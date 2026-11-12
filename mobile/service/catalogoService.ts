/**
 * Catálogo (cursos, departamentos, cadeiras, professores) via API REST.
 * As médias e contagens vêm do servidor, calculadas sobre avaliações reais.
 */
import type { Curso, DetalheProfessor, Departamento, Disciplina, FiltrosProfessores, Pagina, Professor } from '../src/types';
import { api } from './api';
import { urlAbsoluto } from './authService';
import { traduzirErro } from './erro';

export const TAMANHO_PAGINA = 10;

export interface OpcoesFiltros {
  cursos: Curso[];
  departamentos: Departamento[];
  disciplinas: Disciplina[];
}

interface ProfessorApi {
  id: string;
  name: string;
  photoUrl: string | null;
  departmentId: string;
  departmentName: string;
  subjectIds: string[];
  count: number;
  average: number | null;
}

const paraProfessor = (p: ProfessorApi): Professor => ({
  id: p.id,
  nome: p.name,
  fotoUrl: urlAbsoluto(p.photoUrl),
  departamentoId: p.departmentId,
  departamentoNome: p.departmentName,
  disciplinaIds: p.subjectIds,
  mediaGeral: p.average,
  totalAvaliacoes: p.count,
});

export const catalogoService = {
  /** Público: o registo precisa dos cursos antes de haver sessão. */
  async listarCursos(): Promise<Curso[]> {
    try {
      return (await api.get<{ id: string; name: string }[]>('/courses')).data.map(c => ({ id: c.id, nome: c.name }));
    } catch (e) { throw traduzirErro(e); }
  },

  async opcoesFiltros(): Promise<OpcoesFiltros> {
    try {
      const { data } = await api.get<{
        courses: { id: string; name: string }[];
        departments: { id: string; name: string }[];
        subjects: { id: string; name: string; courseIds: string[]; departmentId: string }[];
      }>('/filters');
      return {
        cursos: data.courses.map(c => ({ id: c.id, nome: c.name })),
        departamentos: data.departments.map(d => ({ id: d.id, nome: d.name })),
        disciplinas: data.subjects.map(s => ({ id: s.id, nome: s.name, cursoIds: s.courseIds, departamentoId: s.departmentId })),
      };
    } catch (e) { throw traduzirErro(e); }
  },

  async listarProfessores(filtros: FiltrosProfessores, pagina = 0): Promise<Pagina<Professor>> {
    try {
      const { data } = await api.get<{ items: ProfessorApi[]; total: number; hasMore: boolean }>('/teachers', {
        params: {
          q: filtros.texto || undefined,
          courseId: filtros.cursoId,
          departmentId: filtros.departamentoId,
          subjectId: filtros.disciplinaId,
          page: pagina,
          pageSize: TAMANHO_PAGINA,
        },
      });
      return { itens: data.items.map(paraProfessor), total: data.total, temMais: data.hasMore };
    } catch (e) { throw traduzirErro(e); }
  },

  async obterProfessor(id: string): Promise<DetalheProfessor> {
    try {
      const { data } = await api.get<{
        id: string; name: string; photoUrl: string | null; count: number; average: number | null;
        department: { id: string; name: string };
        subjects: { id: string; name: string; courses: { id: string; name: string }[] }[];
      }>(`/teachers/${id}`);
      return {
        professor: {
          id: data.id,
          nome: data.name,
          fotoUrl: urlAbsoluto(data.photoUrl),
          departamentoId: data.department.id,
          departamentoNome: data.department.name,
          disciplinaIds: data.subjects.map(s => s.id),
          mediaGeral: data.average,
          totalAvaliacoes: data.count,
        },
        departamento: { id: data.department.id, nome: data.department.name },
        disciplinas: data.subjects.map(s => ({
          id: s.id,
          nome: s.name,
          cursoIds: s.courses.map(c => c.id),
          departamentoId: data.department.id,
          cursos: s.courses.map(c => ({ id: c.id, nome: c.name })),
        })),
      };
    } catch (e) { throw traduzirErro(e); }
  },
};
