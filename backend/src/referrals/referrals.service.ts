import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Valor de exemplo: ajustar quando o DDR definir
const REFERRAL_BONUS_MT = 25;
// Sem 0/O e 1/I, para o código não ser confundido quando alguém o ditar
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

@Injectable()
export class ReferralsService {
  private logger = new Logger('ReferralsService');

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Devolve o código do utilizador, criando-o na primeira vez. */
  async getMyCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');
    if (user.referralCode) return user.referralCode;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // updateMany com referralCode: null evita sobrepor um código criado em paralelo
        const result = await this.prisma.user.updateMany({
          where: { id: userId, referralCode: null },
          data: { referralCode: this.generateCode() },
        });
        const fresh = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { referralCode: true },
        });
        if (result.count >= 0 && fresh?.referralCode) return fresh.referralCode;
      } catch (e) {
        // Colisão com o código de outro utilizador: tenta com outro
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') continue;
        throw e;
      }
    }
    throw new ConflictException('Não foi possível gerar o código. Tenta novamente.');
  }

  async getMine(userId: string) {
    const code = await this.getMyCode(userId);

    const [user, referrals] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      }),
      this.prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          bonusAmount: true,
          paidAt: true,
          createdAt: true,
          referred: { select: { name: true } },
        },
      }),
    ]);

    const totalEarned = referrals.reduce(
      (sum, r) => sum + (r.bonusAmount ? Number(r.bonusAmount) : 0),
      0,
    );

    return {
      code,
      creditBalance: Number(user?.creditBalance ?? 0),
      totalEarned,
      referrals,
    };
  }

  async applyCode(userId: string, rawCode: string) {
    const code = rawCode.trim().toUpperCase();

    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!referrer) throw new NotFoundException('Código inválido.');
    if (referrer.id === userId) {
      throw new BadRequestException('Não podes usar o teu próprio código.');
    }

    // Impede o ciclo A convida B e B convida A
    const reverse = await this.prisma.referral.findFirst({
      where: { referrerId: userId, referredId: referrer.id },
    });
    if (reverse) {
      throw new BadRequestException('Esta pessoa foi convidada por ti.');
    }

    // O código só vale antes da primeira publicação paga (evita contas feitas só para o bónus)
    const paid = await this.prisma.listingPublication.count({
      where: { userId, status: 'CONFIRMADO' },
    });
    if (paid > 0) {
      throw new BadRequestException(
        'O código só pode ser usado antes da tua primeira publicação.',
      );
    }

    try {
      await this.prisma.referral.create({
        data: { referrerId: referrer.id, referredId: userId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já usaste um código de convite.');
      }
      throw e;
    }

    return { message: 'Código aplicado com sucesso.' };
  }

  /**
   * Chamado depois de uma publicação paga ser confirmada.
   * Paga o bónus ao convidante na primeira publicação paga do convidado.
   * Nunca deve bloquear a publicação: quem chama trata os erros.
   */
  async rewardReferrerIfFirstPublication(referredId: string) {
    const referral = await this.prisma.referral.findUnique({ where: { referredId } });
    if (!referral || referral.status !== 'PENDENTE') return;

    // Só conta publicações com valor (uma publicação grátis por promoção não paga bónus)
    const paidPublications = await this.prisma.listingPublication.count({
      where: { userId: referredId, status: 'CONFIRMADO', amount: { gt: 0 } },
    });
    if (paidPublications !== 1) return;

    const rewarded = await this.prisma.$transaction(async (tx) => {
      // O estado PENDENTE na condição garante que o bónus só é pago uma vez
      const claim = await tx.referral.updateMany({
        where: { id: referral.id, status: 'PENDENTE' },
        data: { status: 'PAGO', bonusAmount: REFERRAL_BONUS_MT, paidAt: new Date() },
      });
      if (claim.count === 0) return false;

      await tx.user.update({
        where: { id: referral.referrerId },
        data: { creditBalance: { increment: REFERRAL_BONUS_MT } },
      });
      return true;
    });

    if (rewarded) {
      await this.notifications.notify(
        referral.referrerId,
        'SISTEMA',
        'Ganhaste crédito',
        `Um amigo que convidaste publicou o primeiro anúncio. Ganhaste ${REFERRAL_BONUS_MT} MT de crédito.`,
        { type: 'SISTEMA' },
      );
    }
  }

  private generateCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    return code;
  }
}