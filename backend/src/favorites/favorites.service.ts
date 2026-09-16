import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicListing } from '../common/utils/geo.util';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      throw new ConflictException('Este anúncio já está nos teus favoritos.');
    }

    return this.prisma.favorite.create({ data: { userId, listingId } });
  }

  async remove(userId: string, listingId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!existing) {
      throw new NotFoundException('Este anúncio não está nos teus favoritos.');
    }
    return this.prisma.favorite.delete({
      where: { userId_listingId: { userId, listingId } },
    });
  }

  async findMyFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: { listing: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return favorites.map((fav) => ({
      ...fav,
      listing: toPublicListing(fav.listing),
    }));
  }
}