import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublishPrice {
  ruleId: string;
  originalAmount: number;
  discountPercent: number;
  promotionId: string | null;
  amount: number; // valor final a cobrar
  durationDays: number;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Devolve a regra de preço mais específica para a categoria e cidade.
   * Pontuação: cidade pesa 2, categoria pesa 1, regra geral pesa 0.
   */
  async getPublishPrice(categoryId: string, city: string): Promise<PublishPrice> {
    const rules = await this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ categoryId }, { categoryId: null }] },
          { OR: [{ city: { equals: city, mode: 'insensitive' } }, { city: null }] },
        ],
      },
    });

    if (rules.length === 0) {
      throw new NotFoundException('Não existe tabela de preços para este anúncio.');
    }

    const score = (r: (typeof rules)[number]) => (r.city ? 2 : 0) + (r.categoryId ? 1 : 0);
    const best = [...rules].sort((a, b) => score(b) - score(a))[0];

        const originalAmount = Number(best.amount); // o Prisma devolve Decimal

    // Promoção activa para a cidade do anúncio (a de maior desconto ganha)
    const now = new Date();
    const promotion = await this.prisma.promotion.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        city: { equals: city, mode: 'insensitive' },
      },
      orderBy: { discountPercent: 'desc' },
    });

    const discountPercent = promotion?.discountPercent ?? 0;
    const amount = Math.round(originalAmount * (100 - discountPercent)) / 100;

    return {
      ruleId: best.id,
      originalAmount,
      discountPercent,
      promotionId: promotion?.id ?? null,
      amount,
      durationDays: best.durationDays,
    };
  }
}