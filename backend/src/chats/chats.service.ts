import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService,){}

  /**
   * Cria o chat automaticamente após o desbloqueio pago (DDR secção 17A).
   * Se já existir (o mesmo procurador desbloqueou de novo), reaproveita.
   */
  async createOrGetChat(listingId: string, procuradorId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const existing = await this.prisma.chat.findUnique({
      where: { listingId_procuradorId: { listingId, procuradorId } },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.chat.create({
      data: {
        listingId,
        procuradorId,
        anuncianteId: listing.ownerId,
        status: 'ATIVO',
      },
    });
  }

  private async assertParticipant(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) {
      throw new NotFoundException('Conversa não encontrada.');
    }
    if (chat.procuradorId !== userId && chat.anuncianteId !== userId) {
      throw new ForbiddenException('Não tens acesso a esta conversa.');
    }
    return chat;
  }

  async findMyChats(userId: string) {
    return this.prisma.chat.findMany({
      where: { OR: [{ procuradorId: userId }, { anuncianteId: userId }] },
      include: {
        listing: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMessages(chatId: string, userId: string) {
    await this.assertParticipant(chatId, userId);
    return this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  }

async sendMessage(chatId: string, senderId: string, content: string, type: 'TEXTO' | 'IMAGEM' | 'LOCALIZACAO' | 'LINK') {
  const chat = await this.assertParticipant(chatId, senderId);
  if (chat.status !== 'ATIVO') {
    throw new BadRequestException('Esta conversa não está activa.');
  }
  const message = await this.prisma.message.create({
    data: { chatId, senderId, content, type },
  });

  // Notifica a outra parte (DDR 17A)
  const recipientId = chat.procuradorId === senderId ? chat.anuncianteId : chat.procuradorId;
  const sender = await this.prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true },
  });
  const preview =
    type === 'TEXTO' ? content.slice(0, 100)
    : type === 'IMAGEM' ? 'Enviou uma imagem'
    : type === 'LOCALIZACAO' ? 'Partilhou uma localização'
    : 'Enviou um link';

  await this.notifications.notify(
    recipientId,
    'NOVA_MENSAGEM',
    `Nova mensagem de ${sender?.name ?? 'utilizador'}`,
    preview,
    { chatId, type: 'NOVA_MENSAGEM' },
  );

  return message;
}

  async markAsRead(chatId: string, userId: string) {
    await this.assertParticipant(chatId, userId);
    // Marca como lidas todas as mensagens que NÃO foram enviadas por mim
    return this.prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async archive(chatId: string, userId: string) {
    await this.assertParticipant(chatId, userId);
    return this.prisma.chat.update({ where: { id: chatId }, data: { status: 'ARQUIVADO' } });
  }

  async block(chatId: string, userId: string) {
    await this.assertParticipant(chatId, userId);
    return this.prisma.chat.update({ where: { id: chatId }, data: { status: 'BLOQUEADO' } });
  }
}