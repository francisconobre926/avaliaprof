import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }
    return category;
  }

  async create(name: string) {
    const existing = await this.prisma.category.findUnique({ where: { name } });
    if (existing) {
      throw new ConflictException('Já existe uma categoria com este nome.');
    }
    return this.prisma.category.create({ data: { name } });
  }
}