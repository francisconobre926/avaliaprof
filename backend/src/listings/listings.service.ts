import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto, SortBy } from './dto/search-listings.dto';
import {
  haversineDistanceKm,
  obfuscateLocation,
  toPublicListing,
} from '../common/utils/geo.util';
import type { StorageProvider } from '../media/storage/storage-provider.interface';
import { STORAGE_PROVIDER } from '../media/storage/storage-provider.interface';

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
   * Um anúncio removido nunca é visível. Rascunhos e suspensos só o dono os vê,
   * por isso o controller deve passar o viewerId quando houver sessão iniciada.
   */
  async findById(id: string, viewerId?: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!listing || listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const isHiddenStatus =
      listing.status === 'RASCUNHO' || listing.status === 'SUSPENSO';
    if (isHiddenStatus && listing.ownerId !== viewerId) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    return toPublicListing(listing);
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
      throw new ForbiddenException(
        'Não tens permissão para editar este anúncio.',
      );
    }
    if (listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    // A taxa de publicação depende do valor, da finalidade, da cidade e da categoria.
    // Com o anúncio já publicado estes campos ficam trancados, senão publicava-se
    // na faixa mais barata e alterava-se o valor a seguir.
    const editable =
      listing.status === 'RASCUNHO' || listing.status === 'EXPIRADO';
    if (!editable) {
      const changesPricing =
        (dto.price !== undefined &&
          Number(dto.price) !== Number(listing.price)) ||
        (dto.purpose !== undefined && dto.purpose !== listing.purpose) ||
        (dto.city !== undefined &&
          dto.city.trim().toLowerCase() !==
            listing.city.trim().toLowerCase()) ||
        (dto.categoryId !== undefined && dto.categoryId !== listing.categoryId);
      if (changesPricing) {
        throw new ConflictException(
          'Com o anúncio publicado não podes alterar o valor, a finalidade, a cidade nem a categoria. Remove-o ou espera que expire.',
        );
      }
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
      throw new ForbiddenException(
        'Não tens permissão para remover este anúncio.',
      );
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
      this.prisma.listing.update({
        where: { id },
        data: { status: 'REMOVIDO' },
      }),
    ]);

    // Os ficheiros só se apagam depois de a base de dados estar certa, para
    // nunca ficar um registo a apontar para um ficheiro que já não existe.
    // Se algum falhar, fica no log com a chave para limpeza manual.
    const results = await Promise.allSettled(
      files.map((f) => this.storage.delete(f.key)),
    );
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        this.logger.warn(`Ficheiro órfão no R2: ${files[i].key}`);
      }
    });

    return { success: true };
  }

  async search(dto: SearchListingsDto) {
    const {
      q,
      province,
      district,
      city,
      neighborhood,
      categoryId,
      purpose,
      minPrice,
      maxPrice,
      bedrooms,
      hasWater,
      hasElectricity,
      hasWifi,
      furnished,
      hasParking,
      lat,
      lng,
      radiusKm,
      sortBy = SortBy.RECENT,
      page = 1,
      limit = 20,
    } = dto;

    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVO',
      ...(categoryId && { categoryId }),
      ...(purpose && { purpose }),
      ...(province && { province: { equals: province, mode: 'insensitive' } }),
      ...(district && { district: { equals: district, mode: 'insensitive' } }),
      ...(city && { city: { equals: city, mode: 'insensitive' } }),
      ...(neighborhood && {
        neighborhood: { equals: neighborhood, mode: 'insensitive' },
      }),
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

    let withDistance = listings.map((l) => ({
      ...l,
      distanceKm:
        lat !== undefined && lng !== undefined
          ? haversineDistanceKm(lat, lng, l.latitude, l.longitude)
          : undefined,
    }));

    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      withDistance = withDistance.filter(
        (l) => (l.distanceKm ?? Infinity) <= radiusKm,
      );
    }

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        withDistance.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case SortBy.PRICE_DESC:
        withDistance.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case SortBy.DISTANCE:
        withDistance.sort(
          (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
        );
        break;
      case SortBy.RECENT:
      default:
        withDistance.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
    }

    const total = withDistance.length;
    const start = (page - 1) * limit;
    const paginated = withDistance.slice(start, start + limit);

    const results = paginated.map(({ latitude, longitude, ...listing }) => {
      const approx = obfuscateLocation(latitude, longitude, listing.id);
      return {
        ...listing,
        approxLatitude: approx.lat,
        approxLongitude: approx.lng,
      };
    });

    return {
      data: results,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
