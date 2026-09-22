import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PaymentGateway } from '../payments/gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY } from '../payments/gateways/payment-gateway.interface';
import { ChatsService } from '../chats/chats.service';

const UNLOCK_PRICE_MT = 50;

@Injectable()
export class UnlocksService {
  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private paymentGateway: PaymentGateway,
    private chatsService: ChatsService,
  ) {}

  async unlock(userId: string, listingId: string, payerPhone: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const existing = await this.prisma.unlock.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      // Regra do DDR: "mesmo utilizador não paga novamente pelo mesmo anúncio"
      return this.getFullListingInfo(listingId);
    }

    const chargeResult = await this.paymentGateway.charge(UNLOCK_PRICE_MT, payerPhone);

    const unlock = await this.prisma.unlock.create({
      data: {
        userId,
        listingId,
        amount: UNLOCK_PRICE_MT,
        paymentReference: chargeResult.transactionReference,
        status: chargeResult.success ? 'CONFIRMADO' : 'FALHOU',
      },
    });

    if (!chargeResult.success) {
      throw new ConflictException('Pagamento não confirmado. Tenta novamente.');
    }

    // Activa o chat interno imediatamente após confirmação do pagamento (DDR secção 17A)
    await this.chatsService.createOrGetChat(listingId, userId);

    // TODO: notificar o anunciante (push) — módulo notifications ainda não existe

    return this.getFullListingInfo(listingId);
  }

  async hasUnlocked(userId: string, listingId: string): Promise<boolean> {
    const unlock = await this.prisma.unlock.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    return !!unlock && unlock.status === 'CONFIRMADO';
  }

  async getMyUnlocks(userId: string) {
    return this.prisma.unlock.findMany({
      where: { userId, status: 'CONFIRMADO' },
      include: { listing: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getFullListingInfo(listingId: string) {
    // Informação completa (secção 17 do DDR): descrição, contactos, localização exacta
    return this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        category: true,
        owner: { select: { name: true, phone: true } },
      },
    });
  }
}