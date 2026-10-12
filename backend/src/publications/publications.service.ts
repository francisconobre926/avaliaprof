import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import type { PaymentGateway } from '../payments/gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY } from '../payments/gateways/payment-gateway.interface';
import { SearchRequestsService } from '../search-requests/search-requests.service';
import { ReferralsService } from '../referrals/referrals.service';

const MIN_IMAGES_TO_PUBLISH = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class PublicationsService {
  private logger = new Logger('PublicationsService');

  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    @Inject(PAYMENT_GATEWAY) private paymentGateway: PaymentGateway,
    private searchRequests: SearchRequestsService,
    private referrals: ReferralsService,
  ) {}

  /** Cotação do preço de publicação, sem cobrar nada. */
  async getQuote(userId: string, listingId: string) {
    const listing = await this.getOwnedListing(userId, listingId);
    const price = await this.pricing.getPublishPrice(listing);
    const creditAvailable = await this.getCredit(userId);
    const creditToUse = Math.min(creditAvailable, price.amount);

    return {
      ...price,
      creditAvailable,
      creditToUse,
      amountToPay: round2(price.amount - creditToUse),
    };
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
    const price = await this.pricing.getPublishPrice(listing);

    // O crédito cobre primeiro; o resto vai para o gateway
    const creditAvailable = await this.getCredit(userId);
    const creditUsed = Math.min(creditAvailable, price.amount);
    const amountToCharge = round2(price.amount - creditUsed);

    // Reserva o crédito de forma atómica: a condição "gte" impede saldo negativo
    // se dois pagamentos acontecerem ao mesmo tempo
    if (creditUsed > 0) {
      const reserved = await this.prisma.user.updateMany({
        where: { id: userId, creditBalance: { gte: creditUsed } },
        data: { creditBalance: { decrement: creditUsed } },
      });
      if (reserved.count === 0) {
        throw new ConflictException('O teu saldo de crédito mudou. Tenta novamente.');
      }
    }

    let reference = 'CREDITO';
    let success = true;

    if (amountToCharge > 0) {
      reference = 'FALHOU';
      try {
        const charge = await this.paymentGateway.charge(amountToCharge, payerPhone);
        reference = charge.transactionReference;
        success = charge.success;
      } catch (e) {
        success = false;
        this.logger.error('Erro no gateway de pagamento', e as Error);
      }
    }

    if (!success) {
      // Devolve o crédito reservado e regista a tentativa falhada
      if (creditUsed > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: creditUsed } },
        });
      }
      await this.prisma.listingPublication.create({
        data: {
          listingId,
          userId,
          pricingRuleId: price.ruleId,
          promotionId: price.promotionId,
          amount: price.amount,
          durationDays: price.durationDays,
          paymentReference: reference,
          status: 'FALHOU',
        },
      });
      throw new ConflictException('Pagamento não confirmado. Tenta novamente.');
    }

    await this.prisma.listingPublication.create({
      data: {
        listingId,
        userId,
        pricingRuleId: price.ruleId,
        promotionId: price.promotionId,
        amount: price.amount,
        creditUsed,
        durationDays: price.durationDays,
        paymentReference: reference,
        status: 'CONFIRMADO',
      },
    });

    const now = new Date();
    const published = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'ACTIVO',
        publishedAt: now,
        expiresAt: new Date(now.getTime() + price.durationDays * DAY_MS),
      },
    });

    // Nada disto espera nem bloqueia: um erro nos avisos ou no bónus
    // não pode estragar uma publicação já paga
    void this.searchRequests
      .notifyMatches(published)
      .catch((e) => this.logger.error('Falha ao avisar pedidos compatíveis', e));
    void this.referrals
      .rewardReferrerIfFirstPublication(userId)
      .catch((e) => this.logger.error('Falha ao pagar o bónus de referência', e));

    return published;
  }

  private async getCredit(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });
    return Number(user?.creditBalance ?? 0);
  }

  private async getOwnedListing(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (listing.ownerId !== userId) {
      throw new ForbiddenException('Só o dono do anúncio o pode publicar.');
    }
    return listing;
  }
}