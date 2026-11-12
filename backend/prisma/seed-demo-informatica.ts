/**
 * DADOS DE DEMONSTRAÇÃO (só desenvolvimento) — Engenharia Informática.
 *
 * 1. Avaliações e comentários: os estudantes de exemplo do seed (emails @estudante.avaliaprof.test) avaliam os
 *    docentes das cadeiras em que estão inscritos no semestre corrente. Respeita as regras reais: só cadeiras da
 *    matrícula, docente associado à cadeira, período aberto, uma avaliação por estudante/docente/cadeira/semestre.
 *    Os comentários passam pelo motor de moderação real (alguns ficam bloqueados ou em revisão, de propósito).
 *    Docentes que só leccionam no 1.º semestre não recebem avaliações (não há inscrições nesse semestre).
 * 2. Contas dos docentes do 4.º ano de Informática: ficam activas com a senha de demonstração abaixo.
 *
 * Tudo o que cria é fictício e identificável: as avaliações têm `clientId` a começar por "demo-info-".
 *
 *   npx ts-node prisma/seed-demo-informatica.ts            # cria (idempotente)
 *   npx ts-node prisma/seed-demo-informatica.ts --remove   # apaga as avaliações e as contas de docente criadas aqui
 */
import 'dotenv/config';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ModerationEngine } from '../src/moderation/moderation.engine';

const prisma = new PrismaClient();
const engine = new ModerationEngine();

const PREFIXO = 'demo-info-';
const DOMINIO_ESTUDANTES = '@estudante.avaliaprof.test';
const DOMINIO_DOCENTES = '@avaliaprof.com';
const SENHA_DOCENTES = 'Docente1234';

/** Comentários por tom. Os dois últimos de cada lista negativa servem para exercitar a moderação. */
const BONS = [
  'Explica a matéria com clareza e dá muitos exemplos práticos.',
  'As aulas são bem organizadas e os slides ajudam bastante a estudar.',
  'Está sempre disponível para tirar dúvidas, mesmo fora do horário.',
  'Nota-se que domina o assunto e traz exemplos do mundo real.',
  'Os critérios de avaliação foram explicados logo no início e foram cumpridos.',
  'Gostei muito da cadeira, os trabalhos práticos fizeram a diferença.',
  'Chega sempre a horas e aproveita bem o tempo da aula.',
];
const MEDIOS = [
  'A matéria é interessante, mas o ritmo das aulas é um pouco rápido.',
  'Boas aulas teóricas, faltaram mais exercícios resolvidos.',
  'O conteúdo é bom, mas os enunciados dos trabalhos podiam ser mais claros.',
  'Responde às dúvidas, embora demore a devolver as notas dos testes.',
  'As aulas práticas são úteis, as teóricas podiam ser mais dinâmicas.',
];
const FRACOS = [
  'As aulas são muito expositivas e é difícil acompanhar a matéria.',
  'O teste teve matéria que quase não foi dada nas aulas.',
  'Faltou várias vezes sem avisar e a matéria ficou atrasada.',
  'Dificilmente tem tempo para esclarecer dúvidas depois das aulas.',
  'Dizem que o professor vende notas.',
  'O professor é um idiota',
];

/** Número pseudo-aleatório estável (0..1) a partir de um texto: o mesmo seed dá sempre os mesmos dados. */
const rnd = (chave: string) => parseInt(createHash('sha256').update(chave).digest('hex').slice(0, 8), 16) / 0xffffffff;
const nota = (base: number, chave: string) => Math.max(1, Math.min(5, Math.round(base + (rnd(chave) - 0.5) * 2.2)));

async function contexto() {
  const course = await prisma.course.findUnique({ where: { name: 'Engenharia Informática' } });
  const semester = await prisma.semester.findFirst({ where: { isCurrent: true } });
  if (!course || !semester) throw new Error('Corre primeiro: npx prisma db seed');
  return { course, semester };
}

async function avaliacoes() {
  const { course, semester } = await contexto();
  const period = await prisma.evaluationPeriod.findFirst({ where: { semesterId: semester.id, status: 'OPEN', opensAt: { lte: new Date() }, closesAt: { gte: new Date() } } });
  if (!period) throw new Error('Não há período de avaliação aberto neste semestre.');

  // Inscrições dos estudantes de exemplo, com matrícula activa, em cadeiras de Informática do semestre corrente.
  const inscricoes = await prisma.studentSubject.findMany({
    where: {
      semesterId: semester.id,
      courseSubject: { courseId: course.id },
      student: { email: { endsWith: DOMINIO_ESTUDANTES }, matriculas: { some: { semesterId: semester.id, status: 'ACTIVE' } } },
    },
    select: { studentId: true, courseSubject: { select: { subjectId: true, subject: { select: { name: true, teachers: { select: { teacherId: true, teacher: { select: { name: true } } } } } } } } },
  });

  let criadas = 0, comentarios = 0;
  const porDocente = new Map<string, number>();
  const estados: Record<string, number> = {};
  for (const i of inscricoes) {
    for (const t of i.courseSubject.subject.teachers) {
      const chave = `${i.studentId}|${t.teacherId}|${i.courseSubject.subjectId}`;
      if (rnd(`participa|${chave}`) > 0.85) continue; // nem todos avaliam
      const clientId = PREFIXO + createHash('sha256').update(chave).digest('hex').slice(0, 24);
      const existe = await prisma.evaluation.findFirst({
        where: { studentId: i.studentId, teacherId: t.teacherId, subjectId: i.courseSubject.subjectId, semesterId: semester.id }, select: { id: true },
      });
      if (existe) continue;

      // Cada docente tem um "perfil" estável entre 2,6 e 4,6; cada critério varia à volta dele.
      const base = 2.6 + rnd(`perfil|${t.teacherId}`) * 2.0;
      const s = {
        clarity: nota(base, `c|${chave}`), punctuality: nota(base + 0.3, `p|${chave}`), availability: nota(base - 0.1, `a|${chave}`),
        mastery: nota(base + 0.4, `m|${chave}`), fairness: nota(base, `f|${chave}`),
      };
      const media = (s.clarity + s.punctuality + s.availability + s.mastery + s.fairness) / 5;
      let texto: string | undefined;
      if (rnd(`comenta|${chave}`) < 0.55) {
        const lista = media >= 4 ? BONS : media >= 3 ? MEDIOS : FRACOS;
        texto = lista[Math.floor(rnd(`texto|${chave}`) * lista.length)];
        // O mesmo estudante não repete o mesmo texto (a moderação real trata a repetição como spam).
        if (await prisma.comment.findFirst({ where: { textHash: engine.hash(texto), evaluation: { studentId: i.studentId } }, select: { id: true } })) texto = undefined;
      }
      const mod = texto ? engine.classify(texto) : undefined;
      await prisma.evaluation.create({
        data: {
          clientId, studentId: i.studentId, teacherId: t.teacherId, subjectId: i.courseSubject.subjectId, semesterId: semester.id, periodId: period.id, ...s,
          ...(texto && mod && { comment: { create: { text: texto, textHash: engine.hash(texto), status: mod.status, reason: mod.reason ?? null, publishedAt: mod.status === 'PUBLISHED' ? new Date() : null } } }),
        },
      });
      criadas++;
      porDocente.set(t.teacher.name, (porDocente.get(t.teacher.name) ?? 0) + 1);
      if (mod) { comentarios++; estados[mod.status] = (estados[mod.status] ?? 0) + 1; }
    }
  }
  console.log(`Avaliações de demonstração criadas: ${criadas} (${comentarios} com comentário: ${JSON.stringify(estados)}).`);
  for (const [nome, n] of [...porDocente].sort((a, b) => a[0].localeCompare(b[0], 'pt'))) console.log(`  ${nome}: +${n}`);
}

const emailDe = (nome: string) => nome.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + DOMINIO_DOCENTES;

/** Docentes com pelo menos uma cadeira do 4.º ano de Informática. */
async function docentes4Ano() {
  const { course } = await contexto();
  return prisma.teacher.findMany({
    where: { subjects: { some: { subject: { courseSubjects: { some: { courseId: course.id, courseYear: 4 } } } } } },
    include: { user: true }, orderBy: { name: 'asc' },
  });
}

async function activarDocentes() {
  const hash = await bcrypt.hash(SENHA_DOCENTES, 12);
  for (const t of await docentes4Ano()) {
    if (t.user?.status === 'ACTIVE') { console.log(`  ${t.name}: já tinha conta activa (${t.user.email}), não alterada.`); continue; }
    const email = t.user?.email ?? emailDe(t.name);
    if (t.user) {
      await prisma.user.update({ where: { id: t.user.id }, data: { password: hash, status: 'ACTIVE', resetCodeHash: null, resetExpires: null, resetAttempts: 0 } });
    } else {
      if (await prisma.user.findUnique({ where: { email } })) { console.log(`  ${t.name}: o email ${email} já pertence a outra conta, ignorado.`); continue; }
      await prisma.user.create({ data: { name: t.name, email, role: 'TEACHER', status: 'ACTIVE', password: hash, teacher: { connect: { id: t.id } } } });
    }
    console.log(`  ${t.name}: ${email} / ${SENHA_DOCENTES}`);
  }
}

async function remover() {
  const r = await prisma.evaluation.deleteMany({ where: { clientId: { startsWith: PREFIXO } } });
  console.log(`Removidas ${r.count} avaliações de demonstração.`);
  for (const t of await docentes4Ano()) {
    // Só as contas criadas aqui: email no formato <nome>@avaliaprof.com e sem serem as contas de teste já existentes.
    if (t.user && t.user.email === emailDe(t.name) && !['salvador@avaliaprof.com'].includes(t.user.email)) {
      await prisma.teacher.update({ where: { id: t.id }, data: { userId: null } });
      await prisma.user.delete({ where: { id: t.user.id } });
      console.log(`  Conta de ${t.name} removida.`);
    }
  }
}

(async () => {
  if (process.argv.includes('--remove')) return remover();
  await avaliacoes();
  console.log('Contas dos docentes do 4.º ano de Informática:');
  await activarDocentes();
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
