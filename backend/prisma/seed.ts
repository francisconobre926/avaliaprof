/**
 * SEED DE DESENVOLVIMENTO.
 *
 * Tudo o que cria (cursos, currículos, docentes, turmas e estudantes) são dados de EXEMPLO
 * inventados, para a app e o painel de administração terem com que trabalhar enquanto não há dados
 * reais. Os nomes não correspondem a pessoas reais. Substitui-os pelos da universidade antes de
 * qualquer uso real; com SEED_DEV_CATALOG=false nada disto é criado.
 *
 * É idempotente: pode correr-se várias vezes sem duplicar. Cria também o administrador a partir de
 * ADMIN_EMAIL e ADMIN_PASSWORD (.env); sem essas variáveis não cria nenhum admin.
 */
import { classGroupName } from '../src/admin/class-group-name';
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CURRICULOS, DEPARTAMENTOS, DOCENTES_BASE, RENOMEACOES, type Dep } from './seed-data/curriculo';
import { syncAutoSubjects } from '../src/admin/enrollment-sync';
import { emailDe, gerarNomes } from './seed-data/nomes';

const prisma = new PrismaClient();
const DOMINIO_ESTUDANTES = 'estudante.avaliaprof.test';
const ANO_LECTIVO = 2026;

const chave = (dep: Dep, nome: string) => `${dep}|${nome}`;

async function catalogo() {
  const curso = new Map<string, string>();
  for (const c of CURRICULOS) {
    curso.set(c.curso, (await prisma.course.upsert({ where: { name: c.curso }, update: {}, create: { name: c.curso, code: CODIGO_CURSO[c.curso] ?? c.curso.slice(0, 4) } })).id);
  }
  const dep = new Map<Dep, string>();
  for (const [k, name] of Object.entries(DEPARTAMENTOS) as [Dep, string][]) {
    dep.set(k, (await prisma.department.upsert({ where: { name }, update: {}, create: { name } })).id);
  }

  // Plano antigo de exemplo -> nomes do plano real (mesmo id: mantém avaliações, docentes e matrículas).
  let renomeadas = 0;
  for (const [d, antigo, novo] of RENOMEACOES) {
    const departmentId = dep.get(d)!;
    const velho = await prisma.subject.findUnique({ where: { departmentId_name: { departmentId, name: antigo } } });
    const jaExiste = await prisma.subject.findUnique({ where: { departmentId_name: { departmentId, name: novo } } });
    if (velho && !jaExiste) { await prisma.subject.update({ where: { id: velho.id }, data: { name: novo } }); renomeadas++; }
  }

  // Cadeiras e a sua posição em cada curso (ano e semestre). Uma cadeira pode estar em vários cursos.
  const cadeira = new Map<string, string>();
  let ligacoes = 0;
  for (const c of CURRICULOS) {
    for (const [ia, semestres] of c.anos.entries()) {
      for (const [is, cadeiras] of semestres.entries()) {
        for (const [nome, d] of cadeiras) {
          const departmentId = dep.get(d)!;
          const s = await prisma.subject.upsert({
            where: { departmentId_name: { departmentId, name: nome } },
            update: {},
            create: { name: nome, departmentId },
          });
          cadeira.set(chave(d, nome), s.id);
          await prisma.courseSubject.upsert({
            where: { courseId_subjectId: { courseId: curso.get(c.curso)!, subjectId: s.id } },
            update: { courseYear: ia + 1, semesterNumber: is + 1 },
            create: { courseId: curso.get(c.curso)!, subjectId: s.id, courseYear: ia + 1, semesterNumber: is + 1 },
          });
          ligacoes++;
        }
      }
    }
  }

  // Retira de cada curso as cadeiras que já não fazem parte do seu plano (e, em cascata, as matrículas nelas),
  // e apaga as cadeiras que ficaram sem curso e sem avaliações.
  let podadas = 0;
  for (const c of CURRICULOS) {
    const noPlano = new Set(c.anos.flat(2).map(([nome, d]) => cadeira.get(chave(d, nome))!));
    const r = await prisma.courseSubject.deleteMany({ where: { courseId: curso.get(c.curso)!, subjectId: { notIn: [...noPlano] } } });
    podadas += r.count;
  }
  const orfas = await prisma.subject.deleteMany({ where: { courseSubjects: { none: {} }, evaluations: { none: {} } } });

  // Docentes já existentes (preserva-se quem lecciona o quê) e ligação às cadeiras.
  const cobertas = new Set<string>();
  const ligar = async (teacherId: string, d: Dep, nomes: string[]) => {
    for (const n of nomes) {
      const subjectId = cadeira.get(chave(d, n));
      if (!subjectId) continue;
      await prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId, subjectId } },
        update: {},
        create: { teacherId, subjectId },
      });
      cobertas.add(chave(d, n));
    }
  };
  const usados = new Set<string>((await prisma.teacher.findMany({ select: { name: true } })).map((t) => t.name));
  for (const [name, d, subs] of DOCENTES_BASE) {
    usados.add(name);
    const departmentId = dep.get(d)!;
    const t = (await prisma.teacher.findFirst({ where: { name, departmentId } })) ?? (await prisma.teacher.create({ data: { name, departmentId } }));
    await ligar(t.id, d, subs);
  }
  // Cadeiras que alguém já lecciona na base de dados (de execuções anteriores) também contam.
  for (const l of await prisma.teacherSubject.findMany({ include: { subject: { select: { name: true, departmentId: true } } } })) {
    const d = [...dep.entries()].find(([, id]) => id === l.subject.departmentId)?.[0];
    if (d) cobertas.add(chave(d, l.subject.name));
  }

  // Cadeiras sem docente: novos docentes do mesmo departamento, até 3 cadeiras cada.
  const semDocente = new Map<Dep, string[]>();
  for (const k of cadeira.keys()) {
    if (cobertas.has(k)) continue;
    const [d, nome] = k.split('|') as [Dep, string];
    semDocente.set(d, [...(semDocente.get(d) ?? []), nome]);
  }
  const total = [...semDocente.values()].reduce((s, l) => s + Math.ceil(l.length / 3), 0);
  const nomes = gerarNomes(total, usados);
  let novos = 0;
  for (const [d, lista] of semDocente) {
    for (let i = 0; i < lista.length; i += 3) {
      const name = nomes[novos++];
      const t = await prisma.teacher.create({ data: { name, departmentId: dep.get(d)! } });
      await ligar(t.id, d, lista.slice(i, i + 3));
    }
  }
  // Docentes gerados pelo seed (sem conta nem avaliações) que ficaram sem nenhuma cadeira.
  const base = new Set(DOCENTES_BASE.map((d) => d[0]));
  const sobrantes = (await prisma.teacher.findMany({ where: { userId: null, subjects: { none: {} }, evaluations: { none: {} } }, select: { id: true, name: true } }))
    .filter((t) => !base.has(t.name));
  await prisma.teacher.deleteMany({ where: { id: { in: sobrantes.map((t) => t.id) } } });
  console.log(
    `Catálogo de desenvolvimento: ${CURRICULOS.length} cursos, ${cadeira.size} cadeiras (${ligacoes} ligações curso-cadeira), ` +
      `${renomeadas} renomeadas, ${podadas} retiradas dos planos, ${orfas.count} cadeiras órfãs apagadas, ${novos} docentes novos, ${sobrantes.length} sem cadeiras apagados.`,
  );
}

/** Abreviaturas dos cursos usadas no nome das turmas. */
const CODIGO_CURSO: Record<string, string> = { 'Engenharia Informática': 'Info', 'Gestão de Empresas': 'Gest', Economia: 'Econ', Direito: 'Dir' };

/** Ano lectivo, semestres, período aberto e turmas (laboral por curso e ano; pós-laboral também no 1.º ano). */
async function calendario() {
  const ano = await prisma.academicYear.upsert({
    where: { label: String(ANO_LECTIVO) },
    update: {},
    create: { label: String(ANO_LECTIVO), startsAt: new Date(`${ANO_LECTIVO}-02-01`), endsAt: new Date(`${ANO_LECTIVO}-12-20`) },
  });
  await prisma.semester.upsert({
    where: { label: `${ANO_LECTIVO}/1` },
    update: {},
    create: { label: `${ANO_LECTIVO}/1`, academicYearId: ano.id, number: 1, startsAt: new Date(`${ANO_LECTIVO}-02-01`), endsAt: new Date(`${ANO_LECTIVO}-06-30`) },
  });
  const sem2 = await prisma.semester.upsert({
    where: { label: `${ANO_LECTIVO}/2` },
    update: {},
    create: { label: `${ANO_LECTIVO}/2`, academicYearId: ano.id, number: 2, startsAt: new Date(`${ANO_LECTIVO}-08-01`), endsAt: new Date(`${ANO_LECTIVO}-12-20`), isCurrent: true },
  });
  if ((await prisma.evaluationPeriod.count({ where: { semesterId: sem2.id } })) === 0) {
    await prisma.evaluationPeriod.create({
      data: { semesterId: sem2.id, opensAt: new Date(`${ANO_LECTIVO}-11-01`), closesAt: new Date(`${ANO_LECTIVO}-12-15T23:59:59Z`), status: 'OPEN' },
    });
  }
  const anos = await prisma.courseSubject.groupBy({ by: ['courseId', 'courseYear'] });
  let turmas = 0;
  for (const a of anos) {
    const curso = await prisma.course.findUniqueOrThrow({ where: { id: a.courseId } });
    for (const regime of a.courseYear === 1 ? (['LABORAL', 'POS_LABORAL'] as const) : (['LABORAL'] as const)) {
      await prisma.classGroup.upsert({
        where: { courseId_courseYear_semesterId_regime: { courseId: a.courseId, courseYear: a.courseYear, semesterId: sem2.id, regime } },
        update: {},
        create: { courseId: a.courseId, courseYear: a.courseYear, semesterId: sem2.id, regime, name: classGroupName(curso.code, a.courseYear, sem2.number, regime) },
      });
      turmas++;
    }
  }
  console.log(`Calendário de desenvolvimento: ano ${ANO_LECTIVO}, semestre corrente ${ANO_LECTIVO}/2, período aberto, ${turmas} turmas.`);
}

/** Uma cadeira só conta no semestre em que o curso a dá: repara ligações antigas fora do semestre certo. */
async function repararCadeirasDeEstudantes() {
  const todas = await prisma.studentSubject.findMany({ include: { courseSubject: true, semester: true } });
  const erradas = todas.filter((r) => r.courseSubject.semesterNumber !== r.semester.number).map((r) => r.id);
  if (erradas.length) {
    await prisma.studentSubject.deleteMany({ where: { id: { in: erradas } } });
    console.log(`Reparadas ${erradas.length} ligações estudante-cadeira fora do semestre correcto.`);
  }
}

/** Recalcula as cadeiras AUTO de todas as matrículas do semestre corrente (o plano de estudos pode ter mudado). */
async function sincronizarCadeiras() {
  const semestre = await prisma.semester.findFirstOrThrow({ where: { isCurrent: true } });
  const matriculas = await prisma.enrollment.findMany({ where: { semesterId: semestre.id }, include: { classGroup: true } });
  for (const m of matriculas) {
    await prisma.$transaction((tx) =>
      syncAutoSubjects(tx, m.studentId, { courseId: m.classGroup.courseId, courseYear: m.classGroup.courseYear, semesterId: semestre.id, semester: { number: semestre.number } }),
    );
  }
  console.log(`Cadeiras sincronizadas com a turma de ${matriculas.length} matrículas.`);
}

/** Estudantes de exemplo, matriculados por turma, com as cadeiras do curso, ano e semestre da turma. */
async function estudantes() {
  const semestre = await prisma.semester.findFirstOrThrow({ where: { isCurrent: true } });
  const alvo: { curso: string; codigo: string; ano: number; turma: string; n: number }[] = [];
  for (const c of CURRICULOS) {
    for (let ano = 1; ano <= c.anos.length; ano++) {
      alvo.push({ curso: c.curso, codigo: c.codigo, ano, turma: 'LABORAL', n: c.codigo === '11' && ano === 1 ? 12 : 8 });
      if (ano === 1) alvo.push({ curso: c.curso, codigo: c.codigo, ano, turma: 'POS_LABORAL', n: 5 });
    }
  }
  const nomes = gerarNomes(alvo.reduce((s, a) => s + a.n, 0), new Set(DOCENTES_BASE.map((d) => d[0])), 1000);

  let criados = 0;
  let k = 0;
  const seq = new Map<string, number>();
  for (const a of alvo) {
    const course = await prisma.course.findUniqueOrThrow({ where: { name: a.curso } });
    const turma = await prisma.classGroup.findUniqueOrThrow({
      where: { courseId_courseYear_semesterId_regime: { courseId: course.id, courseYear: a.ano, semesterId: semestre.id, regime: a.turma as 'LABORAL' | 'POS_LABORAL' } },
    });
    const cadeiras = await prisma.courseSubject.findMany({
      where: { courseId: course.id, courseYear: a.ano, semesterNumber: semestre.number },
      select: { id: true },
    });
    for (let i = 0; i < a.n; i++) {
      const nome = nomes[k++];
      const chaveSeq = `${a.codigo}-${a.ano}`;
      const s = (seq.get(chaveSeq) ?? 0) + 1;
      seq.set(chaveSeq, s);
      // Nº de estudante: ano de ingresso + código do curso + sequência (9 dígitos).
      const numero = `${ANO_LECTIVO - (a.ano - 1)}${a.codigo}${String(s).padStart(3, '0')}`;
      if (await prisma.user.findUnique({ where: { studentNumber: numero } })) continue;

      let email = emailDe(nome, DOMINIO_ESTUDANTES);
      if (await prisma.user.findUnique({ where: { email } })) email = emailDe(`${nome} ${numero}`, DOMINIO_ESTUDANTES).replace(/\.\d+/g, '') + '';
      if (await prisma.user.findUnique({ where: { email } })) email = `${numero}@${DOMINIO_ESTUDANTES}`;

      // Dois estudantes com matrícula inactiva, para o painel mostrar os dois estados.
      const inactiva = (a.codigo === '14' && a.ano === 4 && i === a.n - 1) || (a.codigo === '12' && a.ano === 3 && i === a.n - 1);
      const u = await prisma.user.create({
        data: { name: nome, email, studentNumber: numero, courseId: course.id, role: 'STUDENT', status: 'PENDING', password: null },
      });
      await prisma.enrollment.create({ data: { studentId: u.id, semesterId: semestre.id, classGroupId: turma.id, status: inactiva ? 'INACTIVE' : 'ACTIVE' } });
      await prisma.studentSubject.createMany({
        data: cadeiras.map((c) => ({ studentId: u.id, courseSubjectId: c.id, semesterId: semestre.id, source: 'AUTO' as const })),
      });
      criados++;
    }
  }
  console.log(`Estudantes de desenvolvimento: ${criados} novos (${alvo.reduce((s, a) => s + a.n, 0)} no total), todos com conta por activar.`);
}

async function admin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return console.log('ADMIN_EMAIL/ADMIN_PASSWORD não definidos: admin não criado.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres.');
  await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN },
    create: { email, name: 'Administrador', role: Role.ADMIN, password: await bcrypt.hash(password, 12) },
  });
  console.log(`Administrador garantido: ${email}`);
}

(async () => {
  if (process.env.SEED_DEV_CATALOG !== 'false') {
    await catalogo();
    await calendario();
    await repararCadeirasDeEstudantes();
    await sincronizarCadeiras();
    await estudantes();
  }
  await admin();
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
