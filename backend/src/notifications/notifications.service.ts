import { Injectable, Inject, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { PushProvider } from './push/push-provider.interface';
import { PUSH_PROVIDER } from './push/push-provider.interface';

// DDR secção 36: estas duas nunca podem ser desativadas
const CRITICAL_TYPES: NotificationType[] = [
  NotificationType.DESBLOQUEIO_RECEBIDO,
  NotificationType.NOVA_MENSAGEM,
];

@Injectable()
export class NotificationsService {
  private logger = new Logger('NotificationsService');

  constructor(
    private prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private push: PushProvider,
  ) {}

  /**
   * Ponto de entrada para outros módulos (chats, unlocks...).
   * Guarda no centro interno e envia push. Nunca lança erro para quem chama.
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    try {
      if (!CRITICAL_TYPES.includes(type)) {
        const pref = await this.prisma.notificationPreference.findUnique({
          where: { userId_type: { userId, type } },
        });
        if (pref && !pref.enabled) {
          return null;
        }
      }

      const notification = await this.prisma.notification.create({
        data: { userId, type, title, body },
      });

      const devices = await this.prisma.deviceToken.findMany({ where: { userId } });
      if (devices.length > 0) {
        const result = await this.push.send(
          devices.map((d) => d.token),
          title,
          body,
          data,
        );
        if (result.invalidTokens.length > 0) {
          await this.prisma.deviceToken.deleteMany({
            where: { token: { in: result.invalidTokens } },
          });
        }
      }

      return notification;
    } catch (error) {
      this.logger.error(`Falha ao notificar o utilizador ${userId}`, error as Error);
      return null;
    }
  }

  async findMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Notificação não encontrada.');
    }
    return { success: true };
  }

  async markUnread(id: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: null },
    });
    if (result.count === 0) {
      throw new NotFoundException('Notificação não encontrada.');
    }
    return { success: true };
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async registerDevice(userId: string, token: string, platform?: string) {
    // Se o token já existia (mesmo telemóvel, outro utilizador), passa para este
    return this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  async removeDevice(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { userId, token } });
    return { success: true };
  }

  async getPreferences(userId: string) {
    const saved = await this.prisma.notificationPreference.findMany({ where: { userId } });
    return Object.values(NotificationType).map((type) => ({
      type,
      critical: CRITICAL_TYPES.includes(type),
      enabled: CRITICAL_TYPES.includes(type)
        ? true
        : saved.find((p) => p.type === type)?.enabled ?? true,
    }));
  }

  async setPreference(userId: string, type: NotificationType, enabled: boolean) {
    if (CRITICAL_TYPES.includes(type) && !enabled) {
      throw new BadRequestException('Esta notificação é crítica e não pode ser desativada.');
    }
    return this.prisma.notificationPreference.upsert({
      where: { userId_type: { userId, type } },
      update: { enabled },
      create: { userId, type, enabled },
    });
  }
}