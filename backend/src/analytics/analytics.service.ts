import { BadRequestException, Injectable } from '@nestjs/common';
import { ListingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 366;

const round2 = (n: number) => Math.round(n * 100) / 100;

interface Range {
  start: Date;
  end: Date;
}

interface DailyRow {
  day: Date;
  unlocks: number;
  unlock_amount: number;
  publications: number;
  publication_cash: number;
  new_users: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Visão geral: contagens actuais, receita no período e fila de moderação. */
  async overview(from?: string, to?: string) {
    const range = this.resolveRange(from, to);

    const [
      usersTotal,
      usersNew,
      advertisers,
      admins,
      listingStatusRows,
      reportsPending,
      verificationsPending,
      searchRequestsActive,
      referralsPaid,
      creditOutstanding,
      revenueRange,
      revenueAllTime,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: range.start, lt: range.end } } }),
      this.prisma.user.count({ where: { isAnunciante: true } }),
      this.prisma.user.count({ where: { isAdmin: true } }),
      this.prisma.listing.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.report.count({ where: { status: 'PENDENTE' } }),
      this.prisma.verification.count({ where: { status: 'PENDENTE' } }),
      this.prisma.searchRequest.count({ where: { isActive: true } }),
      this.prisma.referral.count({ where: { status: 'PAGO' } }),
      this.prisma.user.aggregate({ _sum: { creditBalance: true } }),
      this.revenue(range),
      this.revenue(),
    ]);

    // Todos os estados aparecem, mesmo os que têm zero anúncios
    const listingsByStatus: Record<string, number> = Object.fromEntries(
      Object.values(ListingStatus).map((s) => [s, 0]),
    );
    listingStatusRows.forEach((r) => {
      listingsByStatus[r.status] = r._count._all;
    });

    return {
      range: { from: range.start, to: range.end },
      users: { total: usersTotal, newInRange: usersNew, advertisers, admins },
      listings: { byStatus: listingsByStatus },
      moderation: {
        reportsPending,
        verificationsPending,
      },
      engagement: { searchRequestsActive, referralsPaid },
      // Crédito de bónus que ainda não foi gasto: é uma obrigação futura, não dinheiro
      creditOutstanding: Number(creditOutstanding._sum.creditBalance ?? 0),
      revenue: { range: revenueRange, allTime: revenueAllTime },
    };
  }

  /** Série diária de vendas e registos, com os dias sem actividade a zero. */
  async dailySeries(from?: string, to?: string) {
    const { start, end } = this.resolveRange(from, to);

    const rows = await this.prisma.$queryRaw<DailyRow[]>(Prisma.sql`
      WITH days AS (
        SELECT generate_series(
          date_trunc('day', ${start}::timestamp),
          date_trunc('day', ${end}::timestamp),
          interval '1 day'
        ) AS day
      )
      SELECT
        d.day AS day,
        COALESCE((
          SELECT COUNT(*) FROM "unlocks" u
          WHERE u."status" = 'CONFIRMADO' AND date_trunc('day', u."createdAt") = d.day
        ), 0)::int AS unlocks,
        COALESCE((
          SELECT SUM(u."amount") FROM "unlocks" u
          WHERE u."status" = 'CONFIRMADO' AND date_trunc('day', u."createdAt") = d.day
        ), 0)::float8 AS unlock_amount,
        COALESCE((
          SELECT COUNT(*) FROM "ListingPublication" p
          WHERE p."status" = 'CONFIRMADO' AND date_trunc('day', p."createdAt") = d.day
        ), 0)::int AS publications,
        COALESCE((
          SELECT SUM(p."amount" - p."creditUsed") FROM "ListingPublication" p
          WHERE p."status" = 'CONFIRMADO' AND date_trunc('day', p."createdAt") = d.day
        ), 0)::float8 AS publication_cash,
        COALESCE((
          SELECT COUNT(*) FROM "users" x
          WHERE date_trunc('day', x."createdAt") = d.day
        ), 0)::int AS new_users
      FROM days d
      ORDER BY d.day
    `);

    return {
      range: { from: start, to: end },
      days: rows.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        unlocks: r.unlocks,
        publications: r.publications,
        newUsers: r.new_users,
        cash: round2(r.unlock_amount + r.publication_cash),
      })),
    };
  }

  /** Cidades com mais anúncios activos. */
  async topCities(limit = 10) {
    const rows = await this.prisma.listing.groupBy({
      by: ['city'],
      where: { status: 'ACTIVO' },
      _count: { _all: true },
      orderBy: { _count: { city: 'desc' } },
      take: Math.min(Math.max(limit, 1), 50),
    });
    return rows.map((r) => ({ city: r.city, activeListings: r._count._all }));
  }

  private async revenue(range?: Range) {
    const createdAt = range ? { gte: range.start, lt: range.end } : undefined;

    const [unlocks, publications] = await Promise.all([
      this.prisma.unlock.aggregate({
        where: { status: 'CONFIRMADO', createdAt },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.listingPublication.aggregate({
        where: { status: 'CONFIRMADO', createdAt },
        _sum: { amount: true, creditUsed: true },
        _count: true,
      }),
    ]);

    const unlockAmount = Number(unlocks._sum.amount ?? 0);
    const publicationGross = Number(publications._sum.amount ?? 0);
    const paidWithCredit = Number(publications._sum.creditUsed ?? 0);
    const publicationCash = round2(publicationGross - paidWithCredit);

    return {
      unlocks: { count: unlocks._count, amount: unlockAmount },
      publications: {
        count: publications._count,
        gross: publicationGross,
        paidWithCredit,
        cash: publicationCash,
      },
      totalCash: round2(unlockAmount + publicationCash),
    };
  }

  private resolveRange(from?: string, to?: string): Range {
    const end = to ? new Date(to) : new Date();
    const start = from
      ? new Date(from)
      : new Date(end.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Datas inválidas.');
    }
    if (start >= end) {
      throw new BadRequestException('A data de início tem de ser anterior à data de fim.');
    }
    if ((end.getTime() - start.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
      throw new BadRequestException(`O período não pode passar de ${MAX_RANGE_DAYS} dias.`);
    }
    return { start, end };
  }
}