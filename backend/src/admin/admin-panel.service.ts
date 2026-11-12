import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { getMinSample } from '../config/env';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CommentsQueryDto, CreateCourseDto, CreateSubjectDto, CreateTeacherDto, LinkSubjectDto, PeriodDto, ReportsQueryDto, UpdatePeriodDto, UsersQueryDto,
} from './admin-panel.dto';

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);
const PAGE = 20;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Painel do administrador: estrutura académica, períodos, utilizadores, moderação, estatísticas e auditoria. */
@Injectable()
export class AdminPanelService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  audit(actorId: string, action: string, entity: string, entityId?: string, meta?: Prisma.InputJsonValue) {
    return this.prisma.auditLog.create({ data: { actorId, action, entity, entityId, meta } });
  }

  // ── Semestres e períodos ──
  async semesters() {
    return { items: await this.prisma.semester.findMany({ orderBy: { startsAt: 'desc' }, select: { id: true, label: true, number: true, startsAt: true, endsAt: true, isCurrent: true } }) };
  }

  async setCurrentSemester(actor: string, id: string) {
    if (!(await this.prisma.semester.findUnique({ where: { id } }))) throw new NotFoundException('Semestre não encontrado.');
    await this.prisma.$transaction([
      this.prisma.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
      this.prisma.semester.update({ where: { id }, data: { isCurrent: true } }),
    ]);
    await this.audit(actor, 'SEMESTRE_CORRENTE', 'Semester', id);
    return this.semesters();
  }

  private periodShape(p: Prisma.EvaluationPeriodGetPayload<{ include: { semester: true; courses: { include: { course: true } }; courseSubjects: { include: { courseSubject: { include: { subject: true; course: true } } } }; _count: true } }>) {
    const now = new Date();
    return {
      id: p.id,
      semester: { id: p.semester.id, label: p.semester.label },
      opensAt: p.opensAt,
      closesAt: p.closesAt,
      status: p.status,
      open: p.status === 'OPEN' && p.opensAt <= now && now <= p.closesAt,
      courses: p.courses.map((c) => ({ id: c.courseId, name: c.course.name })),
      courseSubjects: p.courseSubjects.map((c) => ({ id: c.courseSubjectId, name: c.courseSubject.subject.name, course: c.courseSubject.course.name })),
      evaluations: p._count.evaluations,
    };
  }
  private periodInclude = {
    semester: true,
    courses: { include: { course: true } },
    courseSubjects: { include: { courseSubject: { include: { subject: true, course: true } } } },
    _count: { select: { evaluations: true } },
  } as const;

  async periods() {
    const rows = await this.prisma.evaluationPeriod.findMany({ orderBy: { opensAt: 'desc' }, include: this.periodInclude });
    return { items: rows.map((p) => this.periodShape(p as never)), serverTime: new Date() };
  }

  private checkDates(o: Date, c: Date) {
    if (!(o < c)) throw err(400, 'DATAS_INVALIDAS', 'A data de abertura tem de ser anterior à de fecho.');
  }

  async createPeriod(actor: string, dto: PeriodDto) {
    this.checkDates(dto.opensAt, dto.closesAt);
    if (!(await this.prisma.semester.findUnique({ where: { id: dto.semesterId } }))) throw err(400, 'SEMESTRE_INEXISTENTE', 'Semestre inexistente.');
    const p = await this.prisma.evaluationPeriod.create({
      data: {
        semesterId: dto.semesterId, opensAt: dto.opensAt, closesAt: dto.closesAt, status: dto.status ?? 'OPEN',
        courses: { create: (dto.courseIds ?? []).map((courseId) => ({ courseId })) },
        courseSubjects: { create: (dto.courseSubjectIds ?? []).map((courseSubjectId) => ({ courseSubjectId })) },
      },
      include: this.periodInclude,
    });
    await this.audit(actor, 'PERIODO_CRIADO', 'EvaluationPeriod', p.id);
    void this.notifications.runPeriodJob().catch(() => undefined);
    return this.periodShape(p as never);
  }

  async updatePeriod(actor: string, id: string, dto: UpdatePeriodDto) {
    const cur = await this.prisma.evaluationPeriod.findUnique({ where: { id } });
    if (!cur) throw new NotFoundException('Período não encontrado.');
    this.checkDates(dto.opensAt ?? cur.opensAt, dto.closesAt ?? cur.closesAt);
    const p = await this.prisma.evaluationPeriod.update({
      where: { id },
      data: {
        opensAt: dto.opensAt, closesAt: dto.closesAt, status: dto.status,
        ...(dto.courseIds && { courses: { deleteMany: {}, create: dto.courseIds.map((courseId) => ({ courseId })) } }),
        ...(dto.courseSubjectIds && { courseSubjects: { deleteMany: {}, create: dto.courseSubjectIds.map((courseSubjectId) => ({ courseSubjectId })) } }),
      },
      include: this.periodInclude,
    });
    await this.audit(actor, 'PERIODO_ALTERADO', 'EvaluationPeriod', id, { status: dto.status ?? null });
    void this.notifications.runPeriodJob().catch(() => undefined);
    return this.periodShape(p as never);
  }

  async removePeriod(actor: string, id: string) {
    const p = await this.prisma.evaluationPeriod.findUnique({ where: { id }, include: { _count: { select: { evaluations: true } } } });
    if (!p) throw new NotFoundException('Período não encontrado.');
    if (p._count.evaluations > 0) throw err(409, 'PERIODO_COM_AVALIACOES', 'Já existem avaliações neste período: fecha-o em vez de o apagar.');
    await this.prisma.evaluationPeriod.delete({ where: { id } });
    await this.audit(actor, 'PERIODO_APAGADO', 'EvaluationPeriod', id);
    return { ok: true };
  }

  // ── Estrutura académica ──
  async structure() {
    const [courses, departments, subjects, teachers] = await Promise.all([
      this.prisma.course.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, _count: { select: { courseSubjects: true } } } }),
      this.prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
      this.prisma.subject.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, department: { select: { name: true } }, courseSubjects: { select: { id: true, courseYear: true, semesterNumber: true, course: { select: { id: true, name: true } } } } } }),
      this.prisma.teacher.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, department: { select: { name: true } }, user: { select: { email: true, status: true } }, subjects: { select: { subjectId: true } } } }),
    ]);
    return {
      courses: courses.map((c) => ({ id: c.id, name: c.name, code: c.code, subjects: c._count.courseSubjects })),
      departments,
      subjects: subjects.map((s) => ({ id: s.id, name: s.name, department: s.department.name, links: s.courseSubjects.map((l) => ({ id: l.id, courseId: l.course.id, course: l.course.name, courseYear: l.courseYear, semesterNumber: l.semesterNumber })) })),
      teachers: teachers.map((t) => ({ id: t.id, name: t.name, department: t.department.name, subjectIds: t.subjects.map((s) => s.subjectId), account: t.user ? { email: t.user.email, status: t.user.status } : null })),
    };
  }

  private async unique<T>(fn: () => Promise<T>, msg: string): Promise<T> {
    try { return await fn(); } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException({ code: 'DUPLICADO', message: msg });
      throw e;
    }
  }

  async createCourse(actor: string, dto: CreateCourseDto) {
    const c = await this.unique(() => this.prisma.course.create({ data: { name: dto.name, code: dto.code[0].toUpperCase() + dto.code.slice(1).toLowerCase() } }), 'Já existe um curso com este nome ou abreviatura.');
    await this.audit(actor, 'CURSO_CRIADO', 'Course', c.id);
    return { id: c.id, name: c.name };
  }

  async createSubject(actor: string, dto: CreateSubjectDto) {
    if (!(await this.prisma.department.findUnique({ where: { id: dto.departmentId } }))) throw err(400, 'DEPARTAMENTO_INEXISTENTE', 'Departamento inexistente.');
    if (dto.courseId && (dto.courseYear === undefined || dto.semesterNumber === undefined)) throw err(400, 'LIGACAO_INCOMPLETA', 'Para ligar a um curso indica o ano e o semestre.');
    const s = await this.unique(() => this.prisma.subject.create({
      data: { name: dto.name, departmentId: dto.departmentId, ...(dto.courseId && { courseSubjects: { create: { courseId: dto.courseId, courseYear: dto.courseYear!, semesterNumber: dto.semesterNumber! } } }) },
    }), 'Já existe uma cadeira com este nome neste departamento.');
    await this.audit(actor, 'CADEIRA_CRIADA', 'Subject', s.id);
    return { id: s.id, name: s.name };
  }

  async linkSubject(actor: string, subjectId: string, dto: LinkSubjectDto) {
    if (!(await this.prisma.subject.findUnique({ where: { id: subjectId } }))) throw new NotFoundException('Cadeira não encontrada.');
    if (!(await this.prisma.course.findUnique({ where: { id: dto.courseId } }))) throw err(400, 'CURSO_INEXISTENTE', 'Curso inexistente.');
    const l = await this.unique(() => this.prisma.courseSubject.create({ data: { subjectId, ...dto } }), 'Esta cadeira já está ligada a esse curso.');
    await this.audit(actor, 'CADEIRA_LIGADA', 'CourseSubject', l.id);
    return { id: l.id };
  }

  async createTeacher(actor: string, dto: CreateTeacherDto) {
    if (!(await this.prisma.department.findUnique({ where: { id: dto.departmentId } }))) throw err(400, 'DEPARTAMENTO_INEXISTENTE', 'Departamento inexistente.');
    const t = await this.prisma.teacher.create({ data: dto });
    await this.audit(actor, 'DOCENTE_CRIADO', 'Teacher', t.id);
    return { id: t.id, name: t.name };
  }

  async setTeacherSubjects(actor: string, teacherId: string, subjectIds: string[]) {
    if (!(await this.prisma.teacher.findUnique({ where: { id: teacherId } }))) throw new NotFoundException('Docente não encontrado.');
    const ids = [...new Set(subjectIds)];
    if ((await this.prisma.subject.count({ where: { id: { in: ids } } })) !== ids.length) throw err(400, 'CADEIRA_INEXISTENTE', 'Alguma cadeira indicada não existe.');
    await this.prisma.$transaction([
      this.prisma.teacherSubject.deleteMany({ where: { teacherId } }),
      this.prisma.teacherSubject.createMany({ data: ids.map((subjectId) => ({ teacherId, subjectId })) }),
    ]);
    await this.audit(actor, 'DOCENTE_CADEIRAS', 'Teacher', teacherId, { count: ids.length });
    return { ok: true };
  }

  /** Cria (ou renova) a conta de docente pendente e devolve o código de convite, mostrado UMA vez. */
  async inviteTeacher(actor: string, teacherId: string, email: string) {
    const t = await this.prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
    if (!t) throw new NotFoundException('Docente não encontrado.');
    if (t.user?.status === 'ACTIVE') throw err(409, 'CONTA_ACTIVA', 'Este docente já activou a conta.');
    const clash = await this.prisma.user.findUnique({ where: { email } });
    if (clash && clash.id !== t.userId) throw err(409, 'EMAIL_EM_USO', 'Este email já pertence a outra conta.');

    const bytes = randomBytes(8);
    const code = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
    const expires = new Date(Date.now() + INVITE_TTL_MS);
    const hash = createHash('sha256').update(code).digest('hex');
    if (t.user) {
      await this.prisma.user.update({ where: { id: t.user.id }, data: { email, resetCodeHash: hash, resetExpires: expires, resetAttempts: 0 } });
    } else {
      await this.prisma.user.create({
        data: { name: t.name, email, role: 'TEACHER', status: 'PENDING', password: null, resetCodeHash: hash, resetExpires: expires, teacher: { connect: { id: t.id } } },
      });
    }
    await this.audit(actor, 'DOCENTE_CONVIDADO', 'Teacher', teacherId);
    return { email, code, expiresAt: expires };
  }

  // ── Utilizadores ──
  async users(q: UsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(q.role && { role: q.role }),
      ...(q.q && { OR: [{ name: { contains: q.q, mode: 'insensitive' } }, { email: { contains: q.q, mode: 'insensitive' } }] }),
    };
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({ where, orderBy: { name: 'asc' }, skip: (q.page ?? 0) * PAGE, take: PAGE, select: { id: true, name: true, email: true, role: true, status: true, studentNumber: true } }),
    ]);
    return { items: rows, total, hasMore: ((q.page ?? 0) + 1) * PAGE < total };
  }

  async setUserStatus(actor: string, id: string, status: 'ACTIVE' | 'SUSPENDED') {
    if (id === actor) throw err(409, 'PROPRIA_CONTA', 'Não podes alterar o estado da tua própria conta.');
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException('Utilizador não encontrado.');
    if (u.status === 'PENDING') throw err(409, 'CONTA_PENDENTE', 'A conta ainda não foi activada.');
    await this.prisma.user.update({ where: { id }, data: { status } });
    await this.audit(actor, status === 'SUSPENDED' ? 'CONTA_SUSPENSA' : 'CONTA_REACTIVADA', 'User', id);
    return { id, status };
  }

  // ── Moderação (o administrador vê o texto, nunca o autor) ──
  async comments(q: CommentsQueryDto) {
    const where: Prisma.CommentWhereInput = { status: (q.status ?? 'PENDING_REVIEW') as never };
    const [total, rows] = await Promise.all([
      this.prisma.comment.count({ where }),
      this.prisma.comment.findMany({
        where, orderBy: { createdAt: 'asc' }, skip: (q.page ?? 0) * PAGE, take: PAGE,
        select: { id: true, text: true, status: true, reason: true, _count: { select: { reports: true } }, evaluation: { select: { teacher: { select: { name: true } }, subject: { select: { name: true } }, semester: { select: { label: true } } } } },
      }),
    ]);
    return {
      items: rows.map((c) => ({ id: c.id, text: c.text, status: c.status, reason: c.reason, reports: c._count.reports, teacher: c.evaluation.teacher.name, subject: c.evaluation.subject.name, semester: c.evaluation.semester.label })),
      total, hasMore: ((q.page ?? 0) + 1) * PAGE < total,
    };
  }

  async setCommentStatus(actor: string, id: string, status: 'PUBLISHED' | 'HIDDEN' | 'REMOVED') {
    const c = await this.prisma.comment.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Comentário não encontrado.');
    await this.prisma.comment.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : c.publishedAt } });
    if (status !== c.status) {
      const owner = await this.prisma.evaluation.findUnique({ where: { id: c.evaluationId }, select: { studentId: true } });
      const msg = {
        PUBLISHED: ['COMMENT_PUBLISHED', 'Comentário publicado', 'O teu comentário foi aprovado e já é público.'],
        HIDDEN: ['COMMENT_HIDDEN', 'Comentário ocultado', 'A administração ocultou um comentário teu por não cumprir as regras.'],
        REMOVED: ['COMMENT_REMOVED', 'Comentário removido', 'A administração removeu um comentário teu por não cumprir as regras.'],
      }[status] as [never, string, string];
      if (owner) await this.notifications.notify({ userId: owner.studentId, type: msg[0], title: msg[1], body: msg[2], data: { screen: 'minhas-avaliacoes' } });
    }
    await this.audit(actor, 'COMENTARIO_' + status, 'Comment', id, { from: c.status });
    return { id, status };
  }

  async reports(q: ReportsQueryDto) {
    const where: Prisma.CommentReportWhereInput = { status: (q.status ?? 'OPEN') as never };
    const [total, rows] = await Promise.all([
      this.prisma.commentReport.count({ where }),
      this.prisma.commentReport.findMany({
        where, orderBy: { createdAt: 'asc' }, skip: (q.page ?? 0) * PAGE, take: PAGE,
        select: { id: true, reason: true, status: true, createdAt: true, comment: { select: { id: true, text: true, status: true, evaluation: { select: { teacher: { select: { name: true } } } } } } },
      }),
    ]);
    return {
      items: rows.map((r) => ({ id: r.id, reason: r.reason, status: r.status, createdAt: r.createdAt, comment: { id: r.comment.id, text: r.comment.text, status: r.comment.status, teacher: r.comment.evaluation.teacher.name } })),
      total, hasMore: ((q.page ?? 0) + 1) * PAGE < total,
    };
  }

  async resolveReport(actor: string, id: string, status: 'RESOLVED' | 'DISMISSED', hideComment?: boolean) {
    const r = await this.prisma.commentReport.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Denúncia não encontrada.');
    await this.prisma.$transaction([
      this.prisma.commentReport.update({ where: { id }, data: { status } }),
      ...(hideComment && status === 'RESOLVED' ? [this.prisma.comment.update({ where: { id: r.commentId }, data: { status: 'HIDDEN' } })] : []),
    ]);
    await this.audit(actor, 'DENUNCIA_' + status, 'CommentReport', id, { hideComment: !!hideComment });
    await this.notifications.notify({ userId: r.reporterId, type: 'REPORT_REVIEWED', title: 'Denúncia analisada', body: status === 'RESOLVED' ? 'A tua denúncia foi analisada e tomaram-se medidas. Obrigado.' : 'A tua denúncia foi analisada e não foi necessária nenhuma acção. Obrigado.', data: { screen: 'inicio' } });
    return { id, status };
  }

  // ── Estatísticas gerais ──
  async stats() {
    const [students, activeStudents, teachers, evaluations, byStatus, openReports, pendingComments, participants, sem] = await Promise.all([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
      this.prisma.teacher.count(),
      this.prisma.evaluation.count(),
      this.prisma.comment.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.commentReport.count({ where: { status: 'OPEN' } }),
      this.prisma.comment.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.evaluation.findMany({ distinct: ['studentId'], select: { studentId: true } }),
      this.prisma.semester.findFirst({ where: { isCurrent: true }, select: { id: true, label: true } }),
    ]);
    const perSemester = await this.prisma.evaluation.groupBy({ by: ['semesterId'], _count: { _all: true } });
    const labels = new Map((await this.prisma.semester.findMany({ select: { id: true, label: true } })).map((s) => [s.id, s.label]));
    const perTeacher = await this.prisma.evaluation.groupBy({ by: ['teacherId'], _count: { _all: true } });
    const min = getMinSample();
    return {
      students, activeStudents, teachers, evaluations,
      participationRate: activeStudents ? Math.round((participants.length / activeStudents) * 1000) / 10 : 0,
      comments: Object.fromEntries(byStatus.map((b) => [b.status, b._count._all])),
      openReports, pendingComments,
      currentSemester: sem,
      evaluationsPerSemester: perSemester.map((p) => ({ semester: labels.get(p.semesterId) ?? '?', count: p._count._all })).sort((a, b) => a.semester.localeCompare(b.semester)),
      teachersWithEnoughEvaluations: perTeacher.filter((t) => t._count._all >= min).length,
      minSample: min,
    };
  }

  async auditLog(page = 0) {
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip: page * PAGE, take: PAGE }),
    ]);
    const actors = new Map((await this.prisma.user.findMany({ where: { id: { in: [...new Set(rows.map((r) => r.actorId))] } }, select: { id: true, name: true } })).map((u) => [u.id, u.name]));
    return { items: rows.map((r) => ({ id: r.id, action: r.action, entity: r.entity, entityId: r.entityId, actor: actors.get(r.actorId) ?? '—', createdAt: r.createdAt })), total, hasMore: (page + 1) * PAGE < total };
  }
}
