import { Injectable, NotFoundException } from '@nestjs/common';
import type { ListingPurpose } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface PublishPrice {
  ruleId: string;
  originalAmount: number;
  discountPercent: number;
  promotionId: string | null;
  amount: number; // valor final a cobrar
  durationDays: number;
}

export interface PriceableListing {
  categoryId: string;
  city: string;
  purpose: ListingPurpose;
  price: unknown; // Decimal do Prisma ou número
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Escolhe a taxa de publicação do DDR (secções 18 a 20) pela finalidade e pelo
   * valor do anúncio. Uma regra de cidade ou de categoria pode sobrepor-se.
   * Pontuação: cidade 4, categoria 2, finalidade 1.
   */
  async getPublishPrice(listing: PriceableListing): Promise<PublishPrice> {
    const listingPrice = Number(listing.price);

    const candidates = await this.prisma.pricingRule.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ categoryId: listing.categoryId }, { categoryId: null }] },
          { OR: [{ city: { equals: listing.city, mode: 'insensitive' } }, { city: null }] },
          { OR: [{ purpose: listing.purpose }, { purpose: null }] },
        ],
      },
    });

    // O valor tem de cair na faixa: acima do mínimo (exclusivo) e até ao máximo (inclusivo)
    const rules = candidates.filter(
      (r) =>
        (r.minPrice === null || listingPrice > Number(r.minPrice)) &&
        (r.maxPrice === null || listingPrice <= Number(r.maxPrice)),
    );

    if (rules.length === 0) {
      throw new NotFoundException('Não existe tabela de preços para este anúncio.');
    }

    const score = (r: (typeof rules)[number]) =>
      (r.city ? 4 : 0) + (r.categoryId ? 2 : 0) + (r.purpose ? 1 : 0);
    const best = [...rules].sort((a, b) => score(b) - score(a))[0];

    const originalAmount = Number(best.amount); // o Prisma devolve Decimal

    // Promoção activa para a cidade do anúncio (a de maior desconto ganha)
    const now = new Date();
    const promotion = await this.prisma.promotion.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        city: { equals: listing.city, mode: 'insensitive' },
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