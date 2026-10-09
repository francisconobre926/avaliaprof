import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { PaymentGateway } from '../payments/gateways/payment-gateway.interface';
import { PAYMENT_GATEWAY } from '../payments/gateways/payment-gateway.interface';
import { ChatsService } from '../chats/chats.service';
import { NotificationsService } from '../notifications/notifications.service';

const UNLOCK_PRICE_MT = 50;

@Injectable()
export class UnlocksService {
  constructor(
    private prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private paymentGateway: PaymentGateway,
    private chatsService: ChatsService,
    private notifications: NotificationsService,
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

    await this.prisma.unlock.create({
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

    // Activa o chat interno imediatamente após confirmação do pagamento (DDR 17A)
    await this.chatsService.createOrGetChat(listingId, userId);

    // Notifica o anunciante (DDR 17)
    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    });
    await this.notifications.notify(
      listing.ownerId,
      'DESBLOQUEIO_RECEBIDO',
      'Anúncio desbloqueado',
      `${buyer?.name ?? 'Um utilizador'} desbloqueou o teu anúncio ${listing.title}. Contacto: ${buyer?.phone ?? 'não disponível'}`,
      { listingId, type: 'DESBLOQUEIO_RECEBIDO' },
    );

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