import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

const DEFAULT_DISCOUNT_PERCENT = 50;

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePromotionDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    this.validateDates(startsAt, endsAt);

    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        city: dto.city.trim(),
        discountPercent: dto.discountPercent ?? DEFAULT_DISCOUNT_PERCENT,
        startsAt,
        endsAt,
      },
    });
  }

  /** Promoções a decorrer neste momento (para a app mostrar o desconto). */
  findActive() {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      orderBy: { city: 'asc' },
    });
  }

  listAll() {
    return this.prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promoção não encontrada.');

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    this.validateDates(startsAt, endsAt);

    return this.prisma.promotion.update({
      where: { id },
      data: {
        name: dto.name,
        discountPercent: dto.discountPercent,
        isActive: dto.isActive,
        startsAt,
        endsAt,
      },
    });
  }

  private validateDates(startsAt: Date, endsAt: Date) {
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException('Datas inválidas.');
    }
    if (endsAt <= startsAt) {
      throw new BadRequestException('A data de fim tem de ser depois da data de início.');
    }
  }
}