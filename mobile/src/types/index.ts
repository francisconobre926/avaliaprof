/** Papéis de acesso (RBAC). A verificação definitiva é feita no servidor. */
export type Papel = 'estudante' | 'docente' | 'admin';

export interface Curso { id: string; nome: string }
export interface Departamento { id: string; nome: string }

export interface Disciplina {
  id: string;
  nome: string;
  /** Uma cadeira pode existir em vários cursos. */
  cursoIds: string[];
  departamentoId: string;
}

export interface Professor {
  id: string;
  nome: string;
  departamentoId: string;
  departamentoNome: string;
  disciplinaIds: string[];
  fotoUrl?: string | null;
  /** Média geral real (null enquanto não houver avaliações). */
  mediaGeral: number | null;
  totalAvaliacoes: number;
}

export interface Utilizador {
  id: string;
  nome: string;
  numeroEstudante: string;
  cursoId: string;
  cursoNome?: string | null;
  email: string;
  papel: Papel;
  foto?: string | null;
}

export interface FiltrosProfessores {
  texto?: string;
  cursoId?: string;
  departamentoId?: string;
  disciplinaId?: string;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  temMais: boolean;
}

export interface DetalheProfessor {
  professor: Professor;
  departamento: Departamento;
  disciplinas: (Disciplina & { cursos: Curso[] })[];
}

export interface Semestre { id: string; label: string }

/** Cadeira do estudante no semestre corrente (atribuída pela administração através da matrícula). */
export interface CadeiraInscricao {
  courseSubjectId: string;
  nome: string;
  anoCurso: number;
  docentes: { id: string; nome: string }[];
}

export type EstadoMatricula = 'ACTIVE' | 'INACTIVE';

/** Matrícula do estudante no semestre corrente. */
export interface MatriculaResumo {
  estado: EstadoMatricula;
  curso: { id: string; nome: string };
  anoCurso: number;
  turma: { id: string; nome: string };
}

export interface PeriodoAvaliacao { id: string; abreEm: string; fechaEm: string; aberto: boolean }

/** Os cinco critérios de avaliação (1 a 5 estrelas cada). */
export type Criterio = 'clarity' | 'punctuality' | 'availability' | 'mastery' | 'fairness';
export type Notas = Record<Criterio, number>;

export const CRITERIOS: { chave: Criterio; rotulo: string }[] = [
  { chave: 'clarity', rotulo: 'Clareza na explicação' },
  { chave: 'punctuality', rotulo: 'Pontualidade' },
  { chave: 'availability', rotulo: 'Disponibilidade para dúvidas' },
  { chave: 'mastery', rotulo: 'Domínio da matéria' },
  { chave: 'fairness', rotulo: 'Justiça na avaliação' },
];

export type EstadoComentario = 'PUBLISHED' | 'BLOCKED' | 'PENDING_REVIEW' | 'HIDDEN' | 'REMOVED';

export interface Avaliacao {
  id: string;
  clientId: string;
  versao: number;
  professor: { id: string; nome: string };
  cadeira: { id: string; nome: string };
  semestre: Semestre;
  notas: Notas;
  media: number;
  comentario: { texto: string; estado: EstadoComentario; mensagem: string | null } | null;
  editavel: boolean;
}

/** Cadeira de um docente que o estudante pode (ou não) avaliar. */
export interface ElegibilidadeCadeira {
  courseSubjectId: string;
  cadeira: string;
  podeAvaliar: boolean;
  motivo: 'JA_AVALIADO' | 'PERIODO_FECHADO' | null;
  avaliacaoId: string | null;
  fechaEm: string | null;
}

export type EstatisticasProfessor =
  | { suficiente: false; total: number; minimo: number }
  | {
      suficiente: true;
      total: number;
      minimo: number;
      media: number;
      criterios: Notas;
      distribuicao: Record<'1' | '2' | '3' | '4' | '5', number>;
      evolucao: { semestre: string; total: number; media: number | null }[];
    };

export interface ComentarioPublico { id: string; texto: string; semestre: string }

// ── Administração: estudantes e turmas ──
export type EstadoConta = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface OpcoesAcademicas {
  cursos: { id: string; nome: string; codigo: string; anos: number[] }[];
  semestres: { id: string; rotulo: string; numero: number; corrente: boolean }[];
  turmas: { id: string; nome: string; cursoId: string; ano: number; semestreId: string }[];
}

export interface EstudanteAdmin {
  id: string;
  nome: string;
  numero: string;
  email: string;
  estadoConta: EstadoConta;
  curso: { id: string; nome: string } | null;
  matricula: { estado: EstadoMatricula; semestre: Semestre; turma: { id: string; nome: string }; ano: number } | null;
}

export interface CadeiraDoEstudante {
  courseSubjectId: string;
  nome: string;
  anoCurso: number;
  origem: 'AUTO' | 'MANUAL';
  docentes: { id: string; nome: string }[];
}

export interface EstudanteAdminDetalhe extends EstudanteAdmin { cadeiras: CadeiraDoEstudante[] }

export interface DadosEstudante {
  nome: string;
  numero: string;
  email: string;
  cursoId: string;
  ano: number;
  semestreId: string;
  turmaId: string;
  estado: EstadoMatricula;
}

export interface TurmaAdmin { id: string; nome: string; curso: { id: string; nome: string }; ano: number; estudantes: number }

export interface EstudanteDaTurma {
  id: string;
  nome: string;
  numero: string;
  email: string;
  estadoConta: EstadoConta;
  estadoMatricula: EstadoMatricula;
}

export interface TurmaDetalhe {
  id: string;
  nome: string;
  curso: { id: string; nome: string };
  ano: number;
  semestre: Semestre;
  estudantes: EstudanteDaTurma[];
}

/** Estudante do mesmo curso, com matrícula activa noutra turma: pode passar para esta. */
export interface CandidatoTurma {
  id: string;
  nome: string;
  numero: string;
  email: string;
  turmaActual: { nome: string; ano: number };
}

// ── Início e Estatísticas ──
export interface DocenteDestaque { id: string; nome: string; fotoUrl: string | null; departamento: string; media: number; total: number }

export interface PendenteAvaliar { docenteId: string; docente: string; cadeira: string; courseSubjectId: string; fechaEm: string }

export interface InicioDados {
  semestre: Semestre | null;
  minimo: number;
  resumo: { cadeiras: number; docentes: number; avaliadas: number; porAvaliar: number };
  porAvaliar: PendenteAvaliar[];
  destaques: DocenteDestaque[];
  recentes: { id: string; docente: { id: string; nome: string }; cadeira: string; semestre: string; media: number }[];
}

export interface ItemRanking {
  posicao: number;
  docente: { id: string; nome: string; fotoUrl: string | null; departamento: string };
  media: number;
  total: number;
  criterios: Notas;
}
export interface Ranking { itens: ItemRanking[]; ocultos: number; minimo: number }

/** Estatísticas agregadas: mesma forma das de um docente (só aparecem com amostra suficiente). */
export type VisaoGeral = EstatisticasProfessor;

export interface OpcoesEstatisticas {
  cursos: { id: string; nome: string }[];
  cadeiras: { id: string; nome: string; cursoIds: string[] }[];
  semestres: { id: string; rotulo: string; corrente: boolean }[];
  minimo: number;
}
