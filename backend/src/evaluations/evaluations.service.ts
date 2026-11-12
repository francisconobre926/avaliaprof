import { ConflictException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ModerationService, type ModerationResult } from '../moderation/moderation.service';
import { PeriodsService, coversScope } from '../periods/periods.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getMinSample } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvaluationDto, SyncOpDto, UpdateEvaluationDto } from './evaluations.dto';

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);
const REPEAT_WINDOW_MS = 24 * 60 * 60 * 1000;

type Scores = { clarity: number; punctuality: number; availability: number; mastery: number; fairness: number };
const overall = (s: Scores) => Math.round(((s.clarity + s.punctuality + s.availability + s.mastery + s.fairness) / 5) * 100) / 100;

const evaluationInclude = {
  teacher: { select: { id: true, name: true } },
  subject: { select: { id: true, name: true } },
  semester: { select: { id: true, label: true } },
  comment: true,
} satisfies Prisma.EvaluationInclude;
type EvaluationFull = Prisma.EvaluationGetPayload<{ include: typeof evaluationInclude }>;

@Injectable()
export class EvaluationsService {
  constructor(
    private prisma: PrismaService,
    private periods: PeriodsService,
    private moderation: ModerationService,
    private notifications: NotificationsService,
  ) {}

  /** Avisa o autor quando o comentário não ficou público (a razão detalhada já vai na resposta do pedido). */
  private async notifyModeration(userId: string, m?: ModerationResult) {
    if (!m || m.status === 'PUBLISHED') return;
    await this.notifications.notify(m.status === 'BLOCKED'
      ? { userId, type: 'COMMENT_BLOCKED', title: 'Comentário não publicado', body: m.message ?? 'O teu comentário não cumpre as regras e não foi publicado. A nota foi guardada.', data: { screen: 'minhas-avaliacoes' } }
      : { userId, type: 'COMMENT_PENDING', title: 'Comentário em revisão', body: 'O teu comentário está a ser revisto pela administração antes de ser publicado.', data: { screen: 'minhas-avaliacoes' } });
  }

  /** Quando um docente com conta atinge a amostra mínima pela primeira vez, as suas estatísticas passam a existir. */
  private async notifyTeacherStats(teacherId: string) {
    const min = getMinSample();
    if ((await this.prisma.evaluation.count({ where: { teacherId } })) !== min) return;
    const t = await this.prisma.teacher.findUnique({ where: { id: teacherId }, select: { userId: true } });
    if (t?.userId) await this.notifications.notify({ userId: t.userId, type: 'TEACHER_STATS_READY', title: 'Estatísticas disponíveis', body: `Já há ${min} avaliações: as tuas médias passaram a estar visíveis.`, data: { screen: 'painel' } });
  }

  /** Vista que o PRÓPRIO estudante tem da sua avaliação (nunca é devolvida a terceiros). */
  private view(e: EvaluationFull, editable: boolean, moderation?: ModerationResult) {
    return {
      id: e.id,
      clientId: e.clientId,
      version: e.version,
      teacher: e.teacher,
      subject: e.subject,
      semester: e.semester,
      scores: { clarity: e.clarity, punctuality: e.punctuality, availability: e.availability, mastery: e.mastery, fairness: e.fairness },
      overall: overall(e),
      comment: e.comment
        ? { text: e.comment.text, status: e.comment.status, reason: e.comment.reason, message: moderation?.message ?? null }
        : null,
      editable,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  /** Contexto do estudante: semestre corrente e curso da turma, exigindo matrícula activa (R-1, R-3). */
  private async studentContext(userId: string) {
    const semester = await this.prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!semester) throw err(409, 'SEM_SEMESTRE_ACTUAL', 'Não há semestre em curso definido pela administração.');
    const matricula = await this.prisma.enrollment.findUnique({
      where: { studentId_semesterId: { studentId: userId, semesterId: semester.id } },
      include: { classGroup: { select: { courseId: true } } },
    });
    if (!matricula) throw err(403, 'NAO_MATRICULADO', 'Ainda não tens matrícula neste semestre. Contacta a administração.');
    if (matricula.status !== 'ACTIVE') throw err(403, 'MATRICULA_INACTIVA', 'A tua matrícula não está activa. Contacta a administração.');
    return { courseId: matricula.classGroup.courseId, semester };
  }

  private async isRepeat(userId: string, text: string, excludeEvaluationId?: string) {
    const hash = this.moderation.hash(text);
    const found = await this.prisma.comment.findFirst({
      where: {
        textHash: hash,
        createdAt: { gte: new Date(Date.now() - REPEAT_WINDOW_MS) },
        evaluation: { studentId: userId, ...(excludeEvaluationId && { id: { not: excludeEvaluationId } }) },
      },
      select: { id: true },
    });
    return !!found;
  }

  private commentData(text: string, result: ModerationResult) {
    return {
      text,
      textHash: this.moderation.hash(text),
      status: result.status,
      reason: result.reason ?? null,
      publishedAt: result.status === 'PUBLISHED' ? new Date() : null,
    };
  }

  /** Verifica R-1 a R-5 e devolve o contexto necessário para gravar. */
  async create(userId: string, dto: CreateEvaluationDto) {
    // Idempotência: o mesmo clientId do mesmo estudante devolve o resultado já gravado.
    const existing = await this.prisma.evaluation.findUnique({ where: { clientId: dto.clientId }, include: evaluationInclude });
    if (existing) {
      if (existing.studentId !== userId) throw err(409, 'ID_EM_USO', 'Identificador de pedido já utilizado.');
      return { duplicate: true, evaluation: this.view(existing, true) };
    }

    const { courseId, semester } = await this.studentContext(userId);

    const courseSubject = await this.prisma.courseSubject.findFirst({
      where: { id: dto.courseSubjectId, courseId, semesterNumber: semester.number },
    });
    const enrolled = courseSubject && await this.prisma.studentSubject.findUnique({
      where: { studentId_courseSubjectId_semesterId: { studentId: userId, courseSubjectId: courseSubject.id, semesterId: semester.id } },
    });
    if (!courseSubject || !enrolled) {
      throw err(403, 'NAO_INSCRITO', 'Só podes avaliar docentes de cadeiras que seleccionaste no teu perfil.');
    }
    const assigned = await this.prisma.teacherSubject.findUnique({
      where: { teacherId_subjectId: { teacherId: dto.teacherId, subjectId: courseSubject.subjectId } },
    });
    if (!assigned) throw err(403, 'DOCENTE_NAO_ASSOCIADO', 'Este docente não lecciona esta cadeira.');

    const period = await this.periods.openPeriodFor(semester.id, courseId, courseSubject.id);
    if (!period) throw err(409, 'PERIODO_FECHADO', 'O período de avaliação desta cadeira não está aberto.');

    const text = dto.comment?.trim();
    const moderation = text ? this.moderation.classify(text, await this.isRepeat(userId, text)) : undefined;

    try {
      const created = await this.prisma.evaluation.create({
        data: {
          clientId: dto.clientId,
          studentId: userId,
          teacherId: dto.teacherId,
          subjectId: courseSubject.subjectId,
          semesterId: semester.id,
          periodId: period.id,
          ...dto.scores,
          ...(text && moderation && { comment: { create: this.commentData(text, moderation) } }),
        },
        include: evaluationInclude,
      });
      await this.notifyModeration(userId, moderation);
      await this.notifyTeacherStats(dto.teacherId);
      return { duplicate: false, evaluation: this.view(created, true, moderation) };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw err(409, 'JA_AVALIADO', 'Já avaliaste este docente nesta cadeira e semestre. Edita a avaliação existente.');
      }
      throw e;
    }
  }

  private async ownOr404(userId: string, id: string) {
    const e = await this.prisma.evaluation.findFirst({ where: { id, studentId: userId }, include: evaluationInclude });
    if (!e) throw new NotFoundException('Avaliação não encontrada.');
    return e;
  }

  /** Período aberto para a cadeira desta avaliação? (R-4: vale para editar e apagar.) */
  private async openPeriodForEvaluation(userId: string, e: EvaluationFull) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { courseId: true } });
    const cs = user?.courseId && await this.prisma.courseSubject.findUnique({
      where: { courseId_subjectId: { courseId: user.courseId, subjectId: e.subject.id } },
    });
    if (!user?.courseId || !cs) return null;
    return this.periods.openPeriodFor(e.semester.id, user.courseId, cs.id);
  }

  async update(userId: string, id: string, dto: UpdateEvaluationDto) {
    const current = await this.ownOr404(userId, id);
    if (dto.version !== undefined && dto.version !== current.version) {
      throw new ConflictException({ code: 'CONFLITO', message: 'A avaliação foi alterada noutro dispositivo.', currentVersion: current.version });
    }
    if (!(await this.openPeriodForEvaluation(userId, current))) {
      throw err(409, 'PERIODO_FECHADO', 'O período de avaliação está encerrado: já não é possível editar.');
    }

    let moderation: ModerationResult | undefined;
    const commentOps: Prisma.EvaluationUpdateInput['comment'] =
      dto.comment === undefined ? undefined
      : dto.comment === null || dto.comment.trim() === '' ? (current.comment ? { delete: true } : undefined)
      : await (async () => {
          const text = dto.comment!.trim();
          if (current.comment && this.moderation.hash(text) === current.comment.textHash && text === current.comment.text) return undefined; // sem alteração
          moderation = this.moderation.classify(text, await this.isRepeat(userId, text, id));
          const data = this.commentData(text, moderation);
          return { upsert: { create: data, update: { ...data, publishedAt: data.publishedAt } } };
        })();

    const updated = await this.prisma.evaluation.update({
      where: { id },
      data: { ...dto.scores, ...(commentOps && { comment: commentOps }), version: { increment: 1 } },
      include: evaluationInclude,
    });
    await this.notifyModeration(userId, moderation);
    return this.view(updated, true, moderation);
  }

  async remove(userId: string, id: string) {
    const current = await this.ownOr404(userId, id);
    if (!(await this.openPeriodForEvaluation(userId, current))) {
      throw err(409, 'PERIODO_FECHADO', 'O período de avaliação está encerrado: já não é possível apagar.');
    }
    await this.prisma.evaluation.delete({ where: { id } });
    return { ok: true };
  }

  async mine(userId: string) {
    const [rows, user, now] = await Promise.all([
      this.prisma.evaluation.findMany({ where: { studentId: userId }, include: evaluationInclude, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { courseId: true } }),
      Promise.resolve(new Date()),
    ]);
    const open = await this.prisma.evaluationPeriod.findMany({
      where: { status: 'OPEN', opensAt: { lte: now }, closesAt: { gte: now } },
      include: { courses: true, courseSubjects: true },
    });
    const courseSubjects = user?.courseId
      ? await this.prisma.courseSubject.findMany({ where: { courseId: user.courseId, subjectId: { in: rows.map((r) => r.subjectId) } } })
      : [];
    const csBySubject = new Map(courseSubjects.map((c) => [c.subjectId, c.id]));
    return {
      items: rows.map((e) => {
        const csId = csBySubject.get(e.subjectId);
        const editable = !!(user?.courseId && csId && open.some((p) => p.semesterId === e.semesterId && coversScope(p, user.courseId!, csId)));
        return this.view(e, editable);
      }),
    };
  }

  /** Para um docente: que cadeiras (das minhas) posso avaliar e porquê não, quando não posso. */
  async eligibility(userId: string, teacherId: string) {
    const { courseId, semester } = await this.studentContext(userId);
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true, name: true } });
    if (!teacher) throw new NotFoundException('Professor não encontrado.');

    const mine = await this.prisma.studentSubject.findMany({
      where: { studentId: userId, semesterId: semester.id, courseSubject: { subject: { teachers: { some: { teacherId } } } } },
      include: { courseSubject: { include: { subject: { select: { id: true, name: true } } } } },
    });
    const evaluated = await this.prisma.evaluation.findMany({
      where: { studentId: userId, teacherId, semesterId: semester.id },
      select: { id: true, subjectId: true },
    });
    const evalBySubject = new Map(evaluated.map((e) => [e.subjectId, e.id]));

    const items = await Promise.all(
      mine.map(async ({ courseSubject: cs }) => {
        const period = await this.periods.openPeriodFor(semester.id, courseId, cs.id);
        const evaluationId = evalBySubject.get(cs.subjectId) ?? null;
        const reason = evaluationId ? 'JA_AVALIADO' : !period ? 'PERIODO_FECHADO' : null;
        return {
          courseSubjectId: cs.id,
          subjectName: cs.subject.name,
          canEvaluate: reason === null,
          reason,
          evaluationId,
          periodClosesAt: period?.closesAt ?? null,
        };
      }),
    );
    // Se não tem nenhuma cadeira deste docente seleccionada, é porque não está inscrito.
    return { teacher, semester: { id: semester.id, label: semester.label }, items: items.sort((a, b) => a.subjectName.localeCompare(b.subjectName, 'pt')) };
  }

  /**
   * Sincronização da fila offline. Cada operação é decidida pelo servidor com as mesmas regras do pedido
   * normal (período pela hora do SERVIDOR, matrícula, inscrição). Devolve um resultado por operação, na
   * mesma ordem; uma falha não impede as seguintes. `create` é idempotente pelo `clientId`; `update` usa
   * `version` para detectar conflito (o cliente decide então se descarta ou reaplica).
   */
  async sync(userId: string, ops: SyncOpDto[]) {
    const results = [];
    for (const o of ops) {
      const ref = o.op === 'create' ? { clientId: o.clientId } : { evaluationId: o.evaluationId };
      try {
        if (o.op === 'create') {
          const r = await this.create(userId, { clientId: o.clientId!, teacherId: o.teacherId!, courseSubjectId: o.courseSubjectId!, scores: o.scores!, comment: o.comment ?? undefined });
          results.push({ op: o.op, ...ref, status: r.duplicate ? 'DUPLICATE' : 'OK', evaluation: r.evaluation });
        } else if (o.op === 'update') {
          const e = await this.update(userId, o.evaluationId!, { scores: o.patch, comment: o.comment, version: o.version });
          results.push({ op: o.op, ...ref, status: 'OK', evaluation: e });
        } else {
          await this.remove(userId, o.evaluationId!);
          results.push({ op: o.op, ...ref, status: 'OK' });
        }
      } catch (e) {
        if (!(e instanceof HttpException)) throw e;
        const body = e.getResponse() as { code?: string; message?: string; currentVersion?: number };
        const code = typeof body === 'object' ? body.code ?? 'ERRO' : 'ERRO';
        results.push({
          op: o.op, ...ref,
          status: code === 'CONFLITO' ? 'CONFLICT' : 'REJECTED',
          code, message: typeof body === 'object' ? body.message : String(body),
          ...(typeof body === 'object' && body.currentVersion !== undefined && { currentVersion: body.currentVersion }),
        });
      }
    }
    return { results, serverTime: new Date() };
  }
}
