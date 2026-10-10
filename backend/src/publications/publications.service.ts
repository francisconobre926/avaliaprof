import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import type { PaymentGateway } from '../payments/gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY } from '../payments/gateways/payment-gateway.interface';

const MIN_IMAGES_TO_PUBLISH = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PublicationsService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    @Inject(PAYMENT_GATEWAY) private paymentGateway: PaymentGateway,
  ) {}

  /** Cotação do preço de publicação, sem cobrar nada. */
  async getQuote(userId: string, listingId: string) {
    const listing = await this.getOwnedListing(userId, listingId);
    return this.pricing.getPublishPrice(listing.categoryId, listing.city);
  }

  /** Paga e publica um anúncio em rascunho (ou expirado) por N dias. */
  async publish(userId: string, listingId: string, payerPhone: string) {
    const listing = await this.getOwnedListing(userId, listingId);

    if (listing.status !== 'RASCUNHO' && listing.status !== 'EXPIRADO') {
      throw new ConflictException('Este anúncio já está publicado.');
    }

    const imageCount = await this.prisma.media.count({
      where: { listingId, type: 'IMAGEM' },
    });
    if (imageCount < MIN_IMAGES_TO_PUBLISH) {
      throw new BadRequestException(
        `São necessárias pelo menos ${MIN_IMAGES_TO_PUBLISH} imagens para publicar.`,
      );
    }

    // O preço vem sempre do servidor, nunca do cliente
    const price = await this.pricing.getPublishPrice(listing.categoryId, listing.city);
    const charge = await this.paymentGateway.charge(price.amount, payerPhone);

    await this.prisma.listingPublication.create({
      data: {
        listingId,
        userId,
        pricingRuleId: price.ruleId,
        amount: price.amount,
        durationDays: price.durationDays,
        paymentReference: charge.transactionReference,
        status: charge.success ? 'CONFIRMADO' : 'FALHOU',
      },
    });

    if (!charge.success) {
      throw new ConflictException('Pagamento não confirmado. Tenta novamente.');
    }

    const now = new Date();
    return this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'ACTIVO',
        publishedAt: now,
        expiresAt: new Date(now.getTime() + price.durationDays * DAY_MS),
      },
    });
  }

  private async getOwnedListing(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Anúncio não encontrado.');
    if (listing.ownerId !== userId) {
      throw new ForbiddenException('Só o dono do anúncio o pode publicar.');
    }
    return listing;
  }
}