/**
 * src/types/index.ts — SNIPPET para adicionar
 *
 * ⚠️ NÃO substituas o teu ficheiro inteiro.
 * Copia estes blocos e cola no fim do teu src/types/index.ts existente.
 */

// ============================================================
// MOTIVOS DE DENÚNCIA
// ============================================================
export type MotivoDenuncia =
  | 'contacto_foto'
  | 'contacto_descricao'
  | 'pagamento_antecipado'
  | 'nao_existe'
  | 'imagem_nao_corresponde'
  | 'preco_irreal'
  | 'outro';

export interface DefinicaoMotivo {
  id: MotivoDenuncia;
  label: string;
  descricao: string;
  icone: string;
  exigeDescricao: boolean;
}

export const MOTIVOS_DENUNCIA: DefinicaoMotivo[] = [
  {
    id: 'contacto_foto',
    label: 'Contacto na foto',
    descricao: 'Número, WhatsApp ou email escrito numa das imagens',
    icone: 'image-marker',
    exigeDescricao: false,
  },
  {
    id: 'contacto_descricao',
    label: 'Contacto na descrição',
    descricao: 'Número, WhatsApp ou email no texto do anúncio',
    icone: 'format-text',
    exigeDescricao: false,
  },
  {
    id: 'pagamento_antecipado',
    label: 'Pede pagamento antecipado',
    descricao: 'Exige transferência antes de visita (M-Pesa, eMola, depósito)',
    icone: 'cash-remove',
    exigeDescricao: false,
  },
  {
    id: 'nao_existe',
    label: 'Imóvel ou produto não existe',
    descricao: 'Endereço inválido ou produto nunca existiu',
    icone: 'map-marker-off',
    exigeDescricao: false,
  },
  {
    id: 'imagem_nao_corresponde',
    label: 'Imagem não corresponde',
    descricao: 'Fotos são de outro imóvel ou retiradas da internet',
    icone: 'image-off',
    exigeDescricao: false,
  },
  {
    id: 'preco_irreal',
    label: 'Preço irreal ou suspeito',
    descricao: 'Preço muito baixo ou muito alto para a zona/categoria',
    icone: 'cash-remove',
    exigeDescricao: false,
  },
  {
    id: 'outro',
    label: 'Outro motivo',
    descricao: 'Explica no campo abaixo',
    icone: 'dots-horizontal',
    exigeDescricao: true,
  },
];

export function obterMotivoPorId(id: MotivoDenuncia): DefinicaoMotivo | undefined {
  return MOTIVOS_DENUNCIA.find(m => m.id === id);
}

// ============================================================
// DENÚNCIA
// ============================================================
export type EstadoDenuncia = 'pendente' | 'aprovada' | 'rejeitada';

export interface Denuncia {
  id: string;
  anuncioId: string;
  tituloAnuncio: string;        // snapshot para apresentação histórica
  motivos: MotivoDenuncia[];
  descricao: string;
  provaUri: string;             // obrigatório: path para screenshot
  dataCriacao: string;          // ISO 8601
  dataResolucao?: string;       // ISO 8601
  estado: EstadoDenuncia;
  compensacaoRecebida?: number; // 25 MT se aprovada
}

export function labelEstadoDenuncia(estado: EstadoDenuncia): string {
  const map: Record<EstadoDenuncia, string> = {
    pendente: 'Em análise',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
  };
  return map[estado];
}

export function corEstadoDenuncia(estado: EstadoDenuncia): string {
  const map: Record<EstadoDenuncia, string> = {
    pendente: '#F57C00',
    aprovada: '#2E7D32',
    rejeitada: '#D32F2F',
  };
  return map[estado];
}

// ============================================================
// AVISO (ao anunciante denunciado)
// ============================================================
export interface Aviso {
  id: string;
  anuncioId: string;
  tituloAnuncio: string;        // snapshot
  motivosDenunciados: MotivoDenuncia[];
  dataCriacao: string;          // ISO 8601
  visto: boolean;               // o utilizador já abriu a notificação?
  numeroAviso: 1 | 2 | 3;       // qual o número deste aviso para o utilizador
}

// ============================================================
// SUSPENSÃO
// ============================================================
export type EstadoSuspensao =
  | 'activa'                    // Em curso, bloqueia publicações
  | 'contestada'                // Anunciante contestou, à espera de decisão
  | 'levantada'                 // Contestação aceite, pode voltar a usar
  | 'expirada';                 // 24h passaram naturalmente

export interface Suspensao {
  id: string;
  dataInicio: string;           // ISO 8601
  dataFim: string;              // ISO 8601 (inicio + 24h)
  avisoDesencadeador: string;   // id do aviso que causou a suspensão
  estado: EstadoSuspensao;

  // Contestação (opcional)
  contestacao?: {
    descricao: string;
    provaUri?: string;
    dataSubmissao: string;
    dataResolucao?: string;
    aceite?: boolean;
  };
}

export function labelEstadoSuspensao(estado: EstadoSuspensao): string {
  const map: Record<EstadoSuspensao, string> = {
    activa: 'Suspensão activa',
    contestada: 'Contestação em análise',
    levantada: 'Suspensão levantada',
    expirada: 'Suspensão expirada',
  };
  return map[estado];
}