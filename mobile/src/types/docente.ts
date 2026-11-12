/** Tipos da área do docente. */
export interface CadeiraCurso { id: string; cursoId: string; cursoNome: string; ano: number; semestre: number }
export interface CadeiraDocente { id: string; nome: string; cursos: CadeiraCurso[] }
export interface FichaDocente {
  id: string;
  nome: string;
  foto: string | null;
  departamento: string;
  codigoPublico: string;
  cadeiras: CadeiraDocente[];
}
export interface ComentarioDocente { id: string; texto: string; resposta: string | null; semestre: string; cadeira: string }
export type EstadoSessao = 'ACTIVE' | 'EXPIRED' | 'CLOSED';
export interface SessaoAvaliacao {
  id: string;
  token: string;
  cadeira: string;
  curso: string;
  cadeiraCursoId: string;
  turma: { id: string; nome: string } | null;
  abreEm: string;
  fechaEm: string;
  estado: EstadoSessao;
}
