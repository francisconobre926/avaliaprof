import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Listing, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSearchRequestDto } from './dto/create-search-request.dto';
import { UpdateSearchRequestDto } from './dto/update-search-request.dto';

// Valor de exemplo: ajustar quando o DDR definir
const MAX_ACTIVE_REQUESTS = 5;
const MAX_NOTIFIED_PER_LISTING = 500;

@Injectable()
export class SearchRequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateSearchRequestDto) {
    this.validateFilters(dto);

    const active = await this.prisma.searchRequest.count({
      where: { userId, isActive: true },
    });
    if (active >= MAX_ACTIVE_REQUESTS) {
      throw new BadRequestException(
        `Só podes ter ${MAX_ACTIVE_REQUESTS} pedidos activos. Desactiva ou apaga algum.`,
      );
    }

    return this.prisma.searchRequest.create({ data: { userId, ...dto } });
  }

  findMine(userId: string) {
    return this.prisma.searchRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateSearchRequestDto) {
    const existing = await this.prisma.searchRequest.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Pedido não encontrado.');

    this.validateFilters({ ...existing, ...dto } as CreateSearchRequestDto, existing);

    // Reactivar também conta para o limite
    if (dto.isActive === true && !existing.isActive) {
      const active = await this.prisma.searchRequest.count({
        where: { userId, isActive: true },
      });
      if (active >= MAX_ACTIVE_REQUESTS) {
        throw new BadRequestException(`Só podes ter ${MAX_ACTIVE_REQUESTS} pedidos activos.`);
      }
    }

    return this.prisma.searchRequest.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.searchRequest.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new NotFoundException('Pedido não encontrado.');
    return { success: true };
  }

  /**
   * Chamado quando um anúncio é publicado. Avisa quem tem um pedido compatível.
   * Nunca deve bloquear a publicação: quem chama trata os erros.
   */
  async notifyMatches(listing: Listing) {
    const insensitive = (field: 'province' | 'district' | 'city', value: string) => ({
      OR: [{ [field]: null }, { [field]: { equals: value, mode: 'insensitive' as const } }],
    });

    const where: Prisma.SearchRequestWhereInput = {
      isActive: true,
      userId: { not: listing.ownerId }, // o dono não recebe aviso do próprio anúncio
      AND: [
        { OR: [{ categoryId: null }, { categoryId: listing.categoryId }] },
        { OR: [{ purpose: null }, { purpose: listing.purpose }] },
        insensitive('province', listing.province),
        insensitive('district', listing.district),
        insensitive('city', listing.city),
        { OR: [{ minPrice: null }, { minPrice: { lte: listing.price } }] },
        { OR: [{ maxPrice: null }, { maxPrice: { gte: listing.price } }] },
        // "bedrooms" no pedido significa "pelo menos N quartos"
        listing.bedrooms === null
          ? { bedrooms: null }
          : { OR: [{ bedrooms: null }, { bedrooms: { lte: listing.bedrooms } }] },
      ],
    };

    const matches = await this.prisma.searchRequest.findMany({
      where,
      select: { userId: true },
      take: MAX_NOTIFIED_PER_LISTING,
    });

    // Um utilizador com vários pedidos compatíveis recebe só um aviso
    const userIds = [...new Set(matches.map((m) => m.userId))];

    await Promise.all(
      userIds.map((id) =>
        this.notifications.notify(
          id,
          'NOVO_ANUNCIO_COMPATIVEL',
          'Novo anúncio para ti',
          `Foi publicado "${listing.title}" em ${listing.neighborhood}, ${listing.city}.`,
          { listingId: listing.id, type: 'NOVO_ANUNCIO_COMPATIVEL' },
        ),
      ),
    );

    return userIds.length;
  }

  private validateFilters(
    dto: CreateSearchRequestDto,
    _existing?: unknown,
  ) {
    const hasFilter = [
      dto.categoryId, dto.purpose, dto.province, dto.district,
      dto.city, dto.minPrice, dto.maxPrice, dto.bedrooms,
    ].some((v) => v !== undefined && v !== null);

    if (!hasFilter) {
      throw new BadRequestException('Indica pelo menos um critério de pesquisa.');
    }
    if (
      dto.minPrice !== undefined && dto.minPrice !== null &&
      dto.maxPrice !== undefined && dto.maxPrice !== null &&
      Number(dto.minPrice) > Number(dto.maxPrice)
    ) {
      throw new BadRequestException('O preço mínimo não pode ser maior que o máximo.');
    }
  }
}