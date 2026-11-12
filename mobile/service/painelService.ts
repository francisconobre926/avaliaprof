/**
 * Início e Estatísticas. Os destaques, o ranking e as estatísticas são de todos os docentes e só
 * mostram médias com amostra suficiente (anonimato); o "por avaliar" e "as minhas" são pessoais.
 */
import type { DocenteDestaque, InicioDados, OpcoesEstatisticas, Ranking, VisaoGeral } from '../src/types';
import { api } from './api';
import { urlAbsoluto } from './authService';
import { paraEstatisticas, type EstatisticasApi } from './avaliacaoService';
import { traduzirErro } from './erro';

export interface FiltrosEstatisticas { cursoId?: string; cadeiraId?: string; semestreId?: string }

const params = (f: FiltrosEstatisticas) => ({ courseId: f.cursoId, subjectId: f.cadeiraId, semesterId: f.semestreId });
const run = async <T>(fn: () => Promise<T>): Promise<T> => { try { return await fn(); } catch (e) { throw traduzirErro(e); } };

export const painelService = {
  inicio: () => run(async (): Promise<InicioDados> => {
    const { data } = await api.get<{
      semester: { id: string; label: string } | null;
      minSample: number;
      summary: { subjects: number; teachers: number; evaluationsDone: number; pending: number };
      pending: { teacherId: string; teacherName: string; subjectName: string; courseSubjectId: string; closesAt: string }[];
      featured: { id: string; name: string; photoUrl: string | null; department: string; average: number; count: number }[];
      recent: { id: string; teacher: { id: string; name: string }; subject: string; semester: string; overall: number }[];
    }>('/home');
    return {
      semestre: data.semester,
      minimo: data.minSample,
      resumo: { cadeiras: data.summary.subjects, docentes: data.summary.teachers, avaliadas: data.summary.evaluationsDone, porAvaliar: data.summary.pending },
      porAvaliar: data.pending.map(p => ({ docenteId: p.teacherId, docente: p.teacherName, cadeira: p.subjectName, courseSubjectId: p.courseSubjectId, fechaEm: p.closesAt })),
      destaques: data.featured.map((f): DocenteDestaque => ({ id: f.id, nome: f.name, fotoUrl: urlAbsoluto(f.photoUrl), departamento: f.department, media: f.average, total: f.count })),
      recentes: data.recent.map(r => ({ id: r.id, docente: { id: r.teacher.id, nome: r.teacher.name }, cadeira: r.subject, semestre: r.semester, media: r.overall })),
    };
  }),

  opcoes: () => run(async (): Promise<OpcoesEstatisticas> => {
    const { data } = await api.get<{
      courses: { id: string; name: string }[];
      subjects: { id: string; name: string; courseIds: string[] }[];
      semesters: { id: string; label: string; isCurrent: boolean }[];
      minSample: number;
    }>('/stats/options');
    return {
      cursos: data.courses.map(c => ({ id: c.id, nome: c.name })),
      cadeiras: data.subjects.map(s => ({ id: s.id, nome: s.name, cursoIds: s.courseIds })),
      semestres: data.semesters.map(s => ({ id: s.id, rotulo: s.label, corrente: s.isCurrent })),
      minimo: data.minSample,
    };
  }),

  ranking: (f: FiltrosEstatisticas, limite = 10) => run(async (): Promise<Ranking> => {
    const { data } = await api.get<{
      items: { position: number; teacher: { id: string; name: string; photoUrl: string | null; department: string }; average: number; count: number; criteria: Ranking['itens'][number]['criterios'] }[];
      hidden: number;
      minSample: number;
    }>('/stats/ranking', { params: { ...params(f), limit: limite } });
    return {
      itens: data.items.map(i => ({
        posicao: i.position,
        docente: { id: i.teacher.id, nome: i.teacher.name, fotoUrl: urlAbsoluto(i.teacher.photoUrl), departamento: i.teacher.department },
        media: i.average,
        total: i.count,
        criterios: i.criteria,
      })),
      ocultos: data.hidden,
      minimo: data.minSample,
    };
  }),

  visaoGeral: (f: FiltrosEstatisticas) => run(async (): Promise<VisaoGeral> => paraEstatisticas((await api.get<EstatisticasApi>('/stats/overview', { params: params(f) })).data)),
};
