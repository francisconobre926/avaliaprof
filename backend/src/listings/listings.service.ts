import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto, SortBy } from './dto/search-listings.dto';
import { haversineDistanceKm, obfuscateLocation, toPublicListing } from '../common/utils/geo.util';
import type { StorageProvider } from '../media/storage/storage-provider.interface';
import { STORAGE_PROVIDER } from '../media/storage/storage-provider.interface';

const roundKm = (km: number) => Math.round(km * 10) / 10;

@Injectable()
export class ListingsService {
  private logger = new Logger('ListingsService');

  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {}

  async create(ownerId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  async findAll() {
    const listings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVO' },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    return listings.map(toPublicListing);
  }

  /**
   * Um anúncio removido nunca é visível. Rascunhos e suspensos só o dono os vê.
   *
   * Localização e contacto:
   * - quem desbloqueou vê a localização exacta e o contacto do dono;
   * - o dono vê a localização exacta;
   * - todos os outros veem só a localização aproximada.
   */
  async findById(id: string, viewerId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        category: true,
        owner: { select: { name: true, phone: true } },
      },
    });
    if (!listing || listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const isOwner = !!viewerId && listing.ownerId === viewerId;

    const isHiddenStatus = listing.status === 'RASCUNHO' || listing.status === 'SUSPENSO';
    if (isHiddenStatus && !isOwner) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const { owner, ...rest } = listing;

    if (isOwner) {
      return rest; // o dono já conhece os próprios contactos
    }
    if (viewerId && (await this.hasUnlocked(viewerId, id))) {
      return { ...rest, owner };
    }
    return toPublicListing(rest);
  }

  private async hasUnlocked(userId: string, listingId: string): Promise<boolean> {
    const unlock = await this.prisma.unlock.findUnique({
      where: { userId_listingId: { userId, listingId } },
      select: { status: true },
    });
    return unlock?.status === 'CONFIRMADO';
  }

  private async findRawById(id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    return listing;
  }

  async update(id: string, ownerId: string, dto: Partial<CreateListingDto>) {
    const listing = await this.findRawById(id);
    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('Não tens permissão para editar este anúncio.');
    }
    if (listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    return this.prisma.listing.update({ where: { id }, data: dto });
  }

  /**
   * "Remover" não apaga a linha: o anúncio passa a REMOVIDO e sai do público.
   * Perde as fotos, o vídeo e os favoritos, mas mantém desbloqueios, conversas
   * e pagamentos, que o histórico e as métricas de receita precisam de ter.
   */
  async remove(id: string, ownerId: string) {
    const listing = await this.findRawById(id);
    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('Não tens permissão para remover este anúncio.');
    }
    if (listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const files = await this.prisma.media.findMany({
      where: { listingId: id },
      select: { key: true },
    });

    // Tudo ou nada: se algo falhar, o anúncio fica como estava
    await this.prisma.$transaction([
      this.prisma.media.deleteMany({ where: { listingId: id } }),
      this.prisma.favorite.deleteMany({ where: { listingId: id } }),
      this.prisma.listing.update({ where: { id }, data: { status: 'REMOVIDO' } }),
    ]);

    // Os ficheiros só se apagam depois de a base de dados estar certa, para
    // nunca ficar um registo a apontar para um ficheiro que já não existe.
    // Se algum falhar, fica no log com a chave para limpeza manual.
    const results = await Promise.allSettled(files.map((f) => this.storage.delete(f.key)));
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.warn(`Ficheiro órfão no R2: ${files[i].key}`);
      }
    });

    return { success: true };
  }

  async search(dto: SearchListingsDto) {
    const {
      q, province, district, city, neighborhood, categoryId, purpose,
      minPrice, maxPrice, bedrooms, hasWater, hasElectricity, hasWifi,
      furnished, hasParking, lat, lng, radiusKm,
      sortBy = SortBy.RECENT, page = 1, limit = 20,
    } = dto;

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVO',
      ...(categoryId && { categoryId }),
      ...(purpose && { purpose }),
      ...(province && { province: { equals: province, mode: 'insensitive' } }),
      ...(district && { district: { equals: district, mode: 'insensitive' } }),
      ...(city && { city: { equals: city, mode: 'insensitive' } }),
      ...(neighborhood && { neighborhood: { equals: neighborhood, mode: 'insensitive' } }),
      ...(bedrooms !== undefined && { bedrooms: { gte: bedrooms } }),
      ...(hasWater !== undefined && { hasWater }),
      ...(hasElectricity !== undefined && { hasElectricity }),
      ...(hasWifi !== undefined && { hasWifi }),
      ...(furnished !== undefined && { furnished }),
      ...(hasParking !== undefined && { hasParking }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };

    const listings = await this.prisma.listing.findMany({
      where,
      include: { category: true },
    });

    const origin = lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

    // A distância e a ordenação usam a posição APROXIMADA, e nunca a real, para que
    // pesquisas repetidas com raios pequenos não permitam descobrir a localização exacta.
    let items = listings.map(({ latitude, longitude, ...listing }) => {
      const approx = obfuscateLocation(latitude, longitude, listing.id);
      return {
        ...listing,
        approxLatitude: approx.lat,
        approxLongitude: approx.lng,
        distanceKm: origin
          ? roundKm(haversineDistanceKm(origin.lat, origin.lng, approx.lat, approx.lng))
          : undefined,
      };
    });

    if (origin && radiusKm !== undefined) {
      items = items.filter((l) => (l.distanceKm ?? Infinity) <= radiusKm);
    }

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        items.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case SortBy.PRICE_DESC:
        items.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case SortBy.DISTANCE:
        items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        break;
      case SortBy.RECENT:
      default:
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const total = items.length;
    const start = (page - 1) * limit;

    return {
      data: items.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}