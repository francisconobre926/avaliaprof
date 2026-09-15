import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';

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
}