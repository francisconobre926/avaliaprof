/**
 * DADOS DE DEMONSTRAÇÃO (só desenvolvimento).
 *
 * Cria 10 avaliações do docente "Armando Cossa" em "Informática 2", feitas por 10 dos estudantes
 * do seed (Engenharia Informática, 1.º ano, turma A), para se poderem ver as médias (que só aparecem
 * a partir de MIN_SAMPLE avaliações). Os comentários passam pelo motor de moderação real.
 * Corre primeiro `npx prisma db seed`. NÃO usar fora de desenvolvimento.
 *
 *   npx ts-node prisma/seed-demo-avaliacoes.ts            # cria (idempotente)
 *   npx ts-node prisma/seed-demo-avaliacoes.ts --remove   # apaga estas avaliações de demonstração
 */
import 'dotenv/config';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ModerationEngine } from '../src/moderation/moderation.engine';

const prisma = new PrismaClient();
const engine = new ModerationEngine();

// clareza, pontualidade, disponibilidade, domínio, justiça, comentário
const DADOS: [number, number, number, number, number, string?][] = [
  [5, 4, 4, 5, 4, 'Explica com muitos exemplos práticos e as aulas são bem organizadas.'],
  [4, 4, 3, 5, 4, 'Domina a matéria, mas por vezes avança depressa nos conceitos mais difíceis.'],
  [3, 5, 4, 4, 3, 'As aulas começam sempre à hora certa. Gostava de mais exercícios resolvidos na aula.'],
  [5, 5, 5, 5, 5],
  [2, 3, 3, 4, 2, 'Os testes abordaram pontos que quase não foram dados nas aulas, achei injusto.'],
  [4, 3, 4, 4, 4],
  [3, 4, 2, 4, 3, 'Dificilmente tem tempo para esclarecer dúvidas depois das aulas.'],
  [5, 4, 5, 5, 4, 'Muito disponível e paciente. Recomendo.'],
  [4, 4, 4, 3, 4],
  [3, 2, 3, 4, 3, 'A metodologia podia ser mais interactiva, as aulas são muito expositivas.'],
];

async function contexto() {
  const teacher = await prisma.teacher.findFirst({ where: { name: 'Armando Cossa' } });
  const course = await prisma.course.findUnique({ where: { name: 'Engenharia Informática' } });
  const semester = await prisma.semester.findFirst({ where: { isCurrent: true } });
  const subject = await prisma.subject.findFirst({ where: { name: 'Informática 2' } });
  if (!teacher || !course || !semester || !subject) throw new Error('Corre primeiro: npx prisma db seed');
  const turma = await prisma.classGroup.findFirst({ where: { courseId: course.id, courseYear: 1, semesterId: semester.id, regime: 'LABORAL' } });
  if (!turma) throw new Error('Turma A do 1.º ano de Engenharia Informática não encontrada. Corre: npx prisma db seed');
  // Os 10 primeiros estudantes dessa turma, por número.
  const alunos = await prisma.user.findMany({
    where: { role: 'STUDENT', matriculas: { some: { classGroupId: turma.id, semesterId: semester.id } }, studentNumber: { startsWith: '202611' } },
    orderBy: { studentNumber: 'asc' },
    take: DADOS.length,
  });
  if (alunos.length < DADOS.length) throw new Error(`Só há ${alunos.length} estudantes na turma; precisa de ${DADOS.length}.`);
  return { teacher, semester, subject, alunos };
}

async function removerLegado() {
  // Versões antigas deste script criavam contas "Aluno Demo N"; apagam-se com as suas avaliações.
  const velhos = await prisma.user.findMany({ where: { email: { startsWith: 'demo.aluno', endsWith: '@avaliaprof.com' } }, select: { id: true } });
  if (!velhos.length) return;
  const ids = velhos.map((u) => u.id);
  await prisma.evaluation.deleteMany({ where: { studentId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  console.log(`Removidas ${velhos.length} contas de demonstração antigas ("Aluno Demo").`);
}

async function remover() {
  const { teacher, semester, subject, alunos } = await contexto();
  const ids = alunos.map((a) => a.id);
  const r = await prisma.evaluation.deleteMany({ where: { studentId: { in: ids }, teacherId: teacher.id, subjectId: subject.id, semesterId: semester.id } });
  await prisma.user.updateMany({ where: { id: { in: ids }, status: 'ACTIVE' }, data: { status: 'PENDING', password: null } });
  console.log(`Removidas ${r.count} avaliações de demonstração; os estudantes voltaram a "conta por activar".`);
}

async function criar() {
  await removerLegado();
  const { teacher, semester, subject, alunos } = await contexto();
  const period = await prisma.evaluationPeriod.findFirst({ where: { semesterId: semester.id, status: 'OPEN' } });
  if (!period) throw new Error('Não há período de avaliação aberto neste semestre.');

  let criadas = 0;
  for (const [i, aluno] of alunos.entries()) {
    const [clarity, punctuality, availability, mastery, fairness, texto] = DADOS[i];
    // Estes estudantes "já activaram" a conta (sem senha utilizável: não servem para iniciar sessão).
    if (aluno.status === 'PENDING') {
      await prisma.user.update({ where: { id: aluno.id }, data: { status: 'ACTIVE', password: await bcrypt.hash(randomBytes(24).toString('hex'), 10) } });
    }
    if (await prisma.evaluation.findFirst({ where: { studentId: aluno.id, teacherId: teacher.id, subjectId: subject.id, semesterId: semester.id } })) continue;

    const mod = texto ? engine.classify(texto) : undefined;
    await prisma.evaluation.create({
      data: {
        clientId: randomUUID(),
        studentId: aluno.id,
        teacherId: teacher.id,
        subjectId: subject.id,
        semesterId: semester.id,
        periodId: period.id,
        clarity, punctuality, availability, mastery, fairness,
        ...(texto && mod && {
          comment: {
            create: {
              text: texto,
              textHash: engine.hash(texto),
              status: mod.status,
              reason: mod.reason ?? null,
              publishedAt: mod.status === 'PUBLISHED' ? new Date() : null,
            },
          },
        }),
      },
    });
    criadas++;
  }
  console.log(`Demonstração: ${criadas} avaliações criadas (Armando Cossa, Informática 2: ${alunos.length} no total).`);
}

(async () => {
  if (process.argv.includes('--remove')) await remover();
  else await criar();
})()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
