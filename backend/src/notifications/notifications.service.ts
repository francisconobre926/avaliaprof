import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationType =
  | 'COMMENT_PUBLISHED' | 'COMMENT_BLOCKED' | 'COMMENT_PENDING' | 'COMMENT_HIDDEN' | 'COMMENT_REMOVED'
  | 'TEACHER_REPLY' | 'REPORT_REVIEWED' | 'PERIOD_OPEN' | 'PERIOD_CLOSING' | 'TEACHER_STATS_READY';

export interface NewNotification { userId: string; type: NotificationType; title: string; body: string; data?: Prisma.InputJsonValue }

const PAGE = 20;
const JOB_EVERY_MS = 10 * 60 * 1000;
const CLOSING_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Notificações dentro da app. Nunca levam dados de terceiros: o corpo é genérico e `data` só diz para onde ir.
 * O servidor cria-as; o utilizador só lê as suas (filtro sempre por `userId` da conta autenticada).
 */
@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private timer?: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NOTIFICATIONS_JOB === 'false') return;
    this.timer = setInterval(() => void this.runPeriodJob().catch((e) => this.logger.error(e)), JOB_EVERY_MS);
    this.timer.unref();
    void this.runPeriodJob().catch((e) => this.logger.error(e));
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  /** Falhar a notificação nunca deve falhar a operação principal. */
  async notify(n: NewNotification) { await this.notifyMany([n]); }
  async notifyMany(list: NewNotification[]) {
    if (!list.length) return;
    try { await this.prisma.notification.createMany({ data: list }); } catch (e) { this.logger.error(`Falha ao criar notificações: ${String(e)}`); }
  }

  async list(userId: string, page = 0) {
    const where = { userId };
    const [total, unread, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: page * PAGE, take: PAGE, select: { id: true, type: true, title: true, body: true, data: true, readAt: true, createdAt: true } }),
    ]);
    return { items: rows, total, unread, hasMore: (page + 1) * PAGE < total };
  }

  async unreadCount(userId: string) { return { unread: await this.prisma.notification.count({ where: { userId, readAt: null } }) }; }

  async markRead(userId: string, id: string) {
    const r = await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    if (r.count === 0 && !(await this.prisma.notification.findFirst({ where: { id, userId }, select: { id: true } }))) throw new NotFoundException('Notificação não encontrada.');
    return this.unreadCount(userId);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { unread: 0 };
  }

  // ── Avisos de períodos (tarefa periódica; cada aviso sai uma só vez por período) ──

  /** Estudantes com matrícula activa no semestre do período e cujo curso/cadeira estão no âmbito. */
  private async studentsInScope(p: { semesterId: string; courses: { courseId: string }[]; courseSubjects: { courseSubjectId: string }[] }) {
    const where: Prisma.StudentSubjectWhereInput = {
      semesterId: p.semesterId,
      student: { status: 'ACTIVE', role: 'STUDENT', matriculas: { some: { semesterId: p.semesterId, status: 'ACTIVE' } } },
      ...(p.courses.length || p.courseSubjects.length
        ? { courseSubject: { OR: [{ courseId: { in: p.courses.map((c) => c.courseId) } }, { id: { in: p.courseSubjects.map((c) => c.courseSubjectId) } }] } }
        : {}),
    };
    const rows = await this.prisma.studentSubject.findMany({ where, select: { studentId: true, courseSubject: { select: { subjectId: true } } } });
    const byStudent = new Map<string, Set<string>>();
    for (const r of rows) byStudent.set(r.studentId, (byStudent.get(r.studentId) ?? new Set()).add(r.courseSubject.subjectId));
    return byStudent;
  }

  async runPeriodJob(now = new Date()) {
    const include = { courses: true, courseSubjects: true } as const;
    const fmt = (d: Date) => d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });

    const toOpen = await this.prisma.evaluationPeriod.findMany({ where: { status: 'OPEN', opensAt: { lte: now }, closesAt: { gte: now }, openedNotifiedAt: null }, include });
    for (const p of toOpen) {
      // Reservar primeiro: se houver duas instâncias, só uma envia.
      const claim = await this.prisma.evaluationPeriod.updateMany({ where: { id: p.id, openedNotifiedAt: null }, data: { openedNotifiedAt: now } });
      if (!claim.count) continue;
      const students = await this.studentsInScope(p);
      await this.notifyMany([...students.keys()].map((userId) => ({
        userId, type: 'PERIOD_OPEN' as const, title: 'Período de avaliação aberto',
        body: `Já podes avaliar os teus docentes até ${fmt(p.closesAt)}.`, data: { screen: 'professores' },
      })));
    }

    const closing = await this.prisma.evaluationPeriod.findMany({
      where: { status: 'OPEN', opensAt: { lte: now }, closesAt: { gte: now, lte: new Date(now.getTime() + CLOSING_WINDOW_MS) }, closingNotifiedAt: null }, include,
    });
    for (const p of closing) {
      const claim = await this.prisma.evaluationPeriod.updateMany({ where: { id: p.id, closingNotifiedAt: null }, data: { closingNotifiedAt: now } });
      if (!claim.count) continue;
      const students = await this.studentsInScope(p);
      // Só avisa quem ainda tem docentes por avaliar nas cadeiras do âmbito.
      const pairs = await this.prisma.teacherSubject.findMany({ select: { teacherId: true, subjectId: true } });
      const evals = await this.prisma.evaluation.findMany({ where: { semesterId: p.semesterId, studentId: { in: [...students.keys()] } }, select: { studentId: true, teacherId: true, subjectId: true } });
      const done = new Set(evals.map((e) => `${e.studentId}|${e.teacherId}|${e.subjectId}`));
      const out: NewNotification[] = [];
      for (const [userId, subjects] of students) {
        const pending = pairs.filter((x) => subjects.has(x.subjectId) && !done.has(`${userId}|${x.teacherId}|${x.subjectId}`)).length;
        if (pending > 0) out.push({ userId, type: 'PERIOD_CLOSING', title: 'O período de avaliação fecha em breve', body: `Tens ${pending} avaliação(ões) por fazer até ${fmt(p.closesAt)}.`, data: { screen: 'professores' } });
      }
      await this.notifyMany(out);
    }
  }
}
