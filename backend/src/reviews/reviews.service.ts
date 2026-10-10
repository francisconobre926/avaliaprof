import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(authorId: string, dto: CreateReviewDto) {
    const chat = await this.prisma.chat.findUnique({ where: { id: dto.chatId } });
    if (!chat) throw new NotFoundException('Conversa não encontrada.');

    const isProcurador = chat.procuradorId === authorId;
    const isAnunciante = chat.anuncianteId === authorId;
    if (!isProcurador && !isAnunciante) {
      throw new ForbiddenException('Só quem participou na conversa a pode avaliar.');
    }

    // A pessoa avaliada é sempre a outra parte do chat, nunca o próprio autor
    const targetId = isProcurador ? chat.anuncianteId : chat.procuradorId;

    try {
      const review = await this.prisma.review.create({
        data: {
          chatId: dto.chatId,
          authorId,
          targetId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      await this.notifications.notify(
        targetId,
        'SISTEMA',
        'Recebeste uma avaliação',
        `Recebeste ${dto.rating} de 5 estrelas.`,
        { chatId: dto.chatId, type: 'SISTEMA' },
      );

      return review;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já avaliaste esta conversa.');
      }
      throw e;
    }
  }

  /** Média e lista das avaliações recebidas por um utilizador. */
  async getForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    const [stats, reviews] = await Promise.all([
      this.prisma.review.aggregate({
        where: { targetId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.findMany({
        where: { targetId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      user,
      average: stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : null,
      count: stats._count.rating,
      reviews,
    };
  }
}