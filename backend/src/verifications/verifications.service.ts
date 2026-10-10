import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

// Valores de exemplo para o selo "bem avaliado": ajustar quando o DDR definir
const WELL_RATED_MIN_AVERAGE = 4.5;
const WELL_RATED_MIN_REVIEWS = 5;

@Injectable()
export class VerificationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Selos de um utilizador: os automáticos são calculados, o de identidade é manual. */
  async getBadges(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true, phone: true, identityVerifiedAt: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    const stats = await this.prisma.review.aggregate({
      where: { targetId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const average = stats._avg.rating ?? 0;

    return {
      userId,
      emailVerified: user.emailVerified,
      phoneProvided: !!user.phone,
      wellRated:
        stats._count.rating >= WELL_RATED_MIN_REVIEWS && average >= WELL_RATED_MIN_AVERAGE,
      identityVerified: !!user.identityVerifiedAt,
    };
  }

  async request(userId: string, dto: RequestVerificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { identityVerifiedAt: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');
    if (user.identityVerifiedAt) {
      throw new ConflictException('A tua identidade já está verificada.');
    }

    const pending = await this.prisma.verification.findFirst({
      where: { userId, status: 'PENDENTE' },
    });
    if (pending) {
      throw new ConflictException('Já tens um pedido de verificação pendente.');
    }

    return this.prisma.verification.create({
      data: { userId, note: dto.note },
    });
  }

  async getMine(userId: string) {
    const [badges, requests] = await Promise.all([
      this.getBadges(userId),
      this.prisma.verification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    return { badges, requests };
  }

  async listForAdmin(status?: VerificationStatus) {
    return this.prisma.verification.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'asc' }, // os mais antigos primeiro
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    });
  }

  async review(adminId: string, id: string, dto: ReviewVerificationDto) {
    const verification = await this.prisma.verification.findUnique({ where: { id } });
    if (!verification) throw new NotFoundException('Pedido não encontrado.');
    if (verification.status !== 'PENDENTE') {
      throw new ConflictException('Este pedido já foi decidido.');
    }
    if (!dto.approve && !dto.reason) {
      throw new BadRequestException('Indica o motivo da rejeição.');
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.verification.update({
        where: { id },
        data: {
          status: dto.approve ? 'APROVADO' : 'REJEITADO',
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason: dto.approve ? null : dto.reason,
        },
      });
      if (dto.approve) {
        await tx.user.update({
          where: { id: verification.userId },
          data: { identityVerifiedAt: now },
        });
      }
      return result;
    });

    await this.notifications.notify(
      verification.userId,
      'SISTEMA',
      dto.approve ? 'Identidade verificada' : 'Verificação rejeitada',
      dto.approve
        ? 'O teu selo de identidade verificada já está activo.'
        : `O teu pedido de verificação foi rejeitado: ${dto.reason}`,
      { type: 'SISTEMA' },
    );

    return updated;
  }
}