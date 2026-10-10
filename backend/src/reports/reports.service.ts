import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

// Valor de exemplo: ajustar quando o DDR definir
const AUTO_SUSPEND_THRESHOLD = 3;

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Anúncio não encontrado.');
    if (listing.ownerId === reporterId) {
      throw new BadRequestException('Não podes denunciar o teu próprio anúncio.');
    }

    try {
      await this.prisma.report.create({
        data: {
          listingId: dto.listingId,
          reporterId,
          reason: dto.reason,
          details: dto.details,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já denunciaste este anúncio.');
      }
      throw e;
    }

    // Suspensão automática ao atingir o limite de denúncias pendentes
    const pending = await this.prisma.report.count({
      where: { listingId: dto.listingId, status: 'PENDENTE' },
    });
    if (pending >= AUTO_SUSPEND_THRESHOLD && listing.status === 'ACTIVO') {
      await this.suspendListing(listing.id, listing.ownerId, listing.title);
    }

    return { message: 'Denúncia recebida. Obrigado.' };
  }

  async listForAdmin(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, status: true, ownerId: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
  }

  async resolve(adminId: string, reportId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { listing: true },
    });
    if (!report) throw new NotFoundException('Denúncia não encontrada.');
    if (report.status !== 'PENDENTE') {
      throw new ConflictException('Esta denúncia já foi resolvida.');
    }

    const updated = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.upheld ? 'PROCEDENTE' : 'IMPROCEDENTE',
        resolvedById: adminId,
        resolvedAt: new Date(),
        resolutionNote: dto.note,
      },
    });

    const { listing } = report;
    if (dto.upheld && listing.status === 'ACTIVO') {
      await this.suspendListing(listing.id, listing.ownerId, listing.title);
    }

    // Se foi improcedente e o anúncio estava suspenso por acumulação de
    // denúncias, devolve-o ao ar quando já não há nenhuma pendente nem procedente
    if (!dto.upheld && listing.status === 'SUSPENSO') {
      const open = await this.prisma.report.count({
        where: { listingId: listing.id, status: { in: ['PENDENTE', 'PROCEDENTE'] } },
      });
      const stillValid = listing.expiresAt && listing.expiresAt > new Date();
      if (open === 0 && stillValid) {
        await this.prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'ACTIVO' },
        });
      }
    }

    return updated;
  }

  private async suspendListing(listingId: string, ownerId: string, title: string) {
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { status: 'SUSPENSO' },
    });
    await this.notifications.notify(
      ownerId,
      'SISTEMA',
      'Anúncio suspenso',
      `O teu anúncio "${title}" foi suspenso para análise.`,
      { listingId, type: 'SISTEMA' },
    );
  }
}