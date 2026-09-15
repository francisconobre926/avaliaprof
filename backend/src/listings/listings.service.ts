import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto, SortBy } from './dto/search-listings.dto';
import { haversineDistanceKm, obfuscateLocation } from '../common/utils/geo.util';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  async findAll() {
    return this.prisma.listing.findMany({
      where: { status: 'ACTIVO' },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    return listing;
  }

  async update(id: string, ownerId: string, dto: Partial<CreateListingDto>) {
    const listing = await this.findById(id);
    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('Não tens permissão para editar este anúncio.');
    }
    return this.prisma.listing.update({ where: { id }, data: dto });
  }

  async remove(id: string, ownerId: string) {
    const listing = await this.findById(id);
    if (listing.ownerId !== ownerId) {
      throw new ForbiddenException('Não tens permissão para remover este anúncio.');
    }
    return this.prisma.listing.delete({ where: { id } });
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

    let listings = await this.prisma.listing.findMany({
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
      withDistance = withDistance.filter((l) => (l.distanceKm ?? Infinity) <= radiusKm);
    }

    switch (sortBy) {
      case SortBy.PRICE_ASC:
        withDistance.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case SortBy.PRICE_DESC:
        withDistance.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case SortBy.DISTANCE:
        withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
        break;
      case SortBy.RECENT:
      default:
        withDistance.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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