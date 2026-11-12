/**
 * Cadeiras e docentes do estudante no semestre corrente. Só leitura: a matrícula, a turma e
 * as cadeiras são atribuídas pelo administrador.
 */
import type { CadeiraInscricao, EstadoMatricula, MatriculaResumo, PeriodoAvaliacao, Semestre } from '../src/types';
import { comCache } from '../src/offline/cache';
import { api } from './api';
import { traduzirErro } from './erro';

interface RespostaApi {
  semester: Semestre;
  enrollment: {
    status: EstadoMatricula;
    course: { id: string; name: string };
    courseYear: number;
    classGroup: { id: string; name: string };
  } | null;
  items: { courseSubjectId: string; name: string; courseYear: number; teachers: { id: string; name: string }[] }[];
}

export interface Inscricao { semestre: Semestre; matricula: MatriculaResumo | null; cadeiras: CadeiraInscricao[] }

export const inscricaoService = {
  async minhas(): Promise<Inscricao> {
    return comCache('minhas-cadeiras', () => this.minhasServidor());
  },

  async minhasServidor(): Promise<Inscricao> {
    try {
      const { data } = await api.get<RespostaApi>('/me/subjects');
      return {
        semestre: data.semester,
        matricula: data.enrollment && {
          estado: data.enrollment.status,
          curso: { id: data.enrollment.course.id, nome: data.enrollment.course.name },
          anoCurso: data.enrollment.courseYear,
          turma: { id: data.enrollment.classGroup.id, nome: data.enrollment.classGroup.name },
        },
        cadeiras: data.items.map(c => ({
          courseSubjectId: c.courseSubjectId,
          nome: c.name,
          anoCurso: c.courseYear,
          docentes: c.teachers.map(t => ({ id: t.id, nome: t.name })),
        })),
      };
    } catch (e) { throw traduzirErro(e); }
  },

  async periodoAtual(): Promise<{ semestre: Semestre | null; periodos: PeriodoAvaliacao[] }> {
    try {
      const { data } = await api.get<{ semester: Semestre | null; periods: { id: string; opensAt: string; closesAt: string; open: boolean }[] }>('/periods/current');
      return {
        semestre: data.semester,
        periodos: data.periods.map(p => ({ id: p.id, abreEm: p.opensAt, fechaEm: p.closesAt, aberto: p.open })),
      };
    } catch (e) { throw traduzirErro(e); }
  },
};
