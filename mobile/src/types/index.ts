
import { Colors } from '../theme/colors';/**
 * src/types/index.ts  —  versão 3
 *
 * Agora inclui TODOS os campos legacy usados no projecto antigo
 * (anuncianteNome, moradaCompleta, publicadoEm, etc.)
 * para que o código actual compile sem precisar de refactor massivo.
 *
 * Campos marcados "legacy" podem ser removidos no futuro quando
 * fizermos refactor dos ecrãs antigos.
 */

// ============================================================
// GRUPOS DO MARKETPLACE
// ============================================================
export type GrupoCategoria =
  | 'imoveis'
  | 'veiculos'
  | 'espacos'
  | 'alojamento'
  | 'comercial'
  | 'equipamentos'
  | 'terrenos'
  | 'outro';

export const GRUPOS: GrupoCategoria[] = [
  'imoveis', 'veiculos', 'espacos', 'alojamento',
  'comercial', 'equipamentos', 'terrenos', 'outro',
];

export function labelGrupo(grupo: GrupoCategoria): string {
  const map: Record<GrupoCategoria, string> = {
    imoveis: 'Imóveis',
    veiculos: 'Veículos',
    espacos: 'Espaços e eventos',
    alojamento: 'Alojamento',
    comercial: 'Comercial',
    equipamentos: 'Equipamentos',
    terrenos: 'Terrenos',
    outro: 'Outro',
  };
  return map[grupo];
}

export function iconeGrupo(grupo: GrupoCategoria): string {
  const map: Record<GrupoCategoria, string> = {
    imoveis: 'home-city',
    veiculos: 'car',
    espacos: 'party-popper',
    alojamento: 'bed',
    comercial: 'storefront',
    equipamentos: 'wrench',
    terrenos: 'map',
    outro: 'package-variant',
  };
  return map[grupo];
}

// ============================================================
// CATEGORIAS
// ============================================================
export type CategoriaAnuncio =
  | 'casa' | 'apartamento' | 'quarto' | 'moradia'
  | 'carro' | 'mota' | 'carrinha' | 'camiao'
  | 'espaco_eventos' | 'salao_festas' | 'estudio' | 'quinta'
  | 'hotel' | 'pensao' | 'hostel' | 'airbnb' | 'bungalow'
  | 'loja' | 'escritorio' | 'armazem'
  | 'equipamento' | 'ferramenta' | 'maquina'
  | 'terreno'
  | 'outro';

export function labelCategoria(categoria: CategoriaAnuncio | string): string {
  const map: Record<string, string> = {
    casa: 'Casa', apartamento: 'Apartamento', quarto: 'Quarto', moradia: 'Moradia',
    carro: 'Carro', mota: 'Mota', carrinha: 'Carrinha', camiao: 'Camião',
    espaco_eventos: 'Espaço de eventos', salao_festas: 'Salão de festas',
    estudio: 'Estúdio', quinta: 'Quinta',
    hotel: 'Hotel', pensao: 'Pensão', hostel: 'Hostel', airbnb: 'Airbnb', bungalow: 'Bungalow',
    loja: 'Loja', escritorio: 'Escritório', armazem: 'Armazém',
    equipamento: 'Equipamento', ferramenta: 'Ferramenta', maquina: 'Máquina',
    terreno: 'Terreno',
    outro: 'Outro',
  };
  return map[categoria] || categoria;
}

export function iconeCategoria(categoria: CategoriaAnuncio | string): string {
  const map: Record<string, string> = {
    casa: 'home', apartamento: 'office-building', quarto: 'bed', moradia: 'home-city',
    carro: 'car', mota: 'motorbike', carrinha: 'van-utility', camiao: 'truck',
    espaco_eventos: 'party-popper', salao_festas: 'glass-cocktail',
    estudio: 'camera', quinta: 'barn',
    hotel: 'bed-king', pensao: 'home-heart', hostel: 'bunk-bed',
    airbnb: 'home-outline', bungalow: 'home-roof',
    loja: 'store', escritorio: 'briefcase', armazem: 'warehouse',
    equipamento: 'tools', ferramenta: 'hammer-wrench', maquina: 'cog',
    terreno: 'map',
    outro: 'package-variant',
  };
  return map[categoria] || 'package-variant';
}

// ============================================================
// MAPA GRUPO → CATEGORIAS
// ============================================================
export const CATEGORIAS_POR_GRUPO: Record<GrupoCategoria, CategoriaAnuncio[]> = {
  imoveis: ['casa', 'apartamento', 'quarto', 'moradia'],
  veiculos: ['carro', 'mota', 'carrinha', 'camiao'],
  espacos: ['espaco_eventos', 'salao_festas', 'estudio', 'quinta'],
  alojamento: ['hotel', 'pensao', 'hostel', 'airbnb', 'bungalow'],
  comercial: ['loja', 'escritorio', 'armazem'],
  equipamentos: ['equipamento', 'ferramenta', 'maquina'],
  terrenos: ['terreno'],
  outro: ['outro'],
};

export function grupoDaCategoria(categoria: CategoriaAnuncio | string): GrupoCategoria {
  for (const [grupo, categorias] of Object.entries(CATEGORIAS_POR_GRUPO)) {
    if (categorias.includes(categoria as CategoriaAnuncio)) return grupo as GrupoCategoria;
  }
  return 'outro';
}

export function categoriasDoGrupo(grupo: GrupoCategoria): CategoriaAnuncio[] {
  return CATEGORIAS_POR_GRUPO[grupo] || [];
}

// ============================================================
// FINALIDADE
// ============================================================
export type Finalidade = 'arrendar' | 'vender' | 'reservar';

export function labelFinalidade(finalidade: Finalidade): string {
  const map: Record<Finalidade, string> = {
    arrendar: 'Arrendar', vender: 'Vender', reservar: 'Reservar',
  };
  return map[finalidade];
}

export function iconeFinalidade(finalidade: Finalidade): string {
  const map: Record<Finalidade, string> = {
    arrendar: 'key', vender: 'cash', reservar: 'calendar',
  };
  return map[finalidade];
}

export function sufixoPrecoFinalidade(finalidade: Finalidade): string {
  const map: Record<Finalidade, string> = {
    arrendar: '/mês', vender: '', reservar: '/reserva',
  };
  return map[finalidade];
}

export function estadoFechoPorFinalidade(finalidade: Finalidade): EstadoAnuncio {
  const map: Record<Finalidade, EstadoAnuncio> = {
    arrendar: 'arrendado', vender: 'vendido', reservar: 'reservado',
  };
  return map[finalidade];
}

export function verboFechoPorFinalidade(finalidade: Finalidade): string {
  const map: Record<Finalidade, string> = {
    arrendar: 'arrendado', vender: 'vendido', reservar: 'reservado',
  };
  return map[finalidade];
}

// ============================================================
// ESTADO DO ANÚNCIO
// ============================================================
export type EstadoAnuncio =
  | 'activo' | 'pausado' | 'expirado'
  | 'arrendado' | 'vendido' | 'reservado'
  | 'rascunho' | 'em_revisao' | 'removido';

export function estaFechado(estado: EstadoAnuncio): boolean {
  return estado === 'arrendado' || estado === 'vendido' || estado === 'reservado';
}

export function estaVisivel(estado: EstadoAnuncio): boolean {
  return estado === 'activo';
}

export function labelEstadoAnuncio(estado: EstadoAnuncio): string {
  const map: Record<EstadoAnuncio, string> = {
    activo: 'Activo', pausado: 'Pausado', expirado: 'Expirado',
    arrendado: 'Arrendado', vendido: 'Vendido', reservado: 'Reservado',
    rascunho: 'Rascunho', em_revisao: 'Em revisão', removido: 'Removido',
  };
  return map[estado];
}

export function corEstadoAnuncio(estado: EstadoAnuncio): string {
  const map: Record<EstadoAnuncio, string> = {
    activo: Colors.verdeTexto, pausado: Colors.azul, expirado: Colors.textoTerciario,
    arrendado: Colors.azul, vendido: Colors.azul, reservado: Colors.azul,
    rascunho: Colors.textoTerciario, em_revisao: Colors.azul, removido: Colors.erro,
  };
  return map[estado];
}

// ============================================================
// FECHO DE ANÚNCIO
// ============================================================
export type OrigemFecho = 'via_gohome' | 'fora_gohome';

export interface InformacaoFecho {
  origem: OrigemFecho;
  dataFecho: string;
  compensacaoCreditada: number;
}

export function labelOrigemFecho(origem: OrigemFecho): string {
  return origem === 'via_gohome' ? 'Através da GoHome' : 'Fora da GoHome';
}

// ============================================================
// PERIODICIDADE (legacy — usada em alguns ecrãs)
// ============================================================
export type Periodicidade = 'mensal' | 'semanal' | 'diario' | 'unico';

// ============================================================
// STATS DO ANÚNCIO (legacy)
// ============================================================
export interface StatsAnuncio {
  visualizacoes7d?: number;
  contactos7d?: number;
  desbloqueios7d?: number;
  taxaConversao?: number;
}

// ============================================================
// INTERFACE ANÚNCIO — completa com todos os campos usados no projecto
// ============================================================
export interface Anuncio {
  // ============ IDENTIFICAÇÃO ============
  id: string;
  titulo: string;
  descricao: string;
  descricaoCurta?: string;             // legacy

  // ============ CLASSIFICAÇÃO ============
  grupo?: GrupoCategoria;              // opcional (legacy pode não ter)
  categoria: CategoriaAnuncio | string; // string para compat com mocks antigos
  finalidade: Finalidade;
  periodicidade?: Periodicidade | string;  // legacy

  // ============ PREÇO ============
  preco: number;
  moeda?: 'MT' | 'USD' | 'ZAR';

  // ============ MÍDIA ============
  imagem?: string;
  fotos: string[];                      // sempre array (vazio se não houver)
  video?: string | null;

  // ============ LOCALIZAÇÃO ============
  zona: string;
  provincia?: string;
  cidade?: string;
  bairro?: string;
  moradaCompleta?: string;              // legacy
  latitude?: number | null;
  longitude?: number | null;

  // ============ ESTADO ============
  estado: EstadoAnuncio;
  fecho?: InformacaoFecho;

  // ============ DATAS ============
  dataCriacao: string;
  dataExpiracao?: string;
  dataPublicacao?: string;
  publicadoEm?: string;                 // legacy (alias de dataPublicacao)
  dataFecho?: string;                   // legacy (também em InformacaoFecho)

  // ============ PAGAMENTO/MONETIZAÇÃO ============
  valorPago?: number;
  destacado?: boolean;
  temVideo?: boolean;
  receita?: number;                     // legacy

  // ============ DONO/ANUNCIANTE ============
  dono?: string;
  donoNome?: string;
  donoVerificado?: boolean;
  // Aliases legacy (ecrãs antigos usam estes nomes)
  anuncianteId?: string;                // legacy (alias de dono)
  anuncianteNome?: string;              // legacy
  anuncianteTelefone1?: string;         // legacy
  anuncianteTelefone2?: string;         // legacy
  anuncianteRating?: number;            // legacy
  anuncianteAvaliacoes?: number;        // legacy
  anuncianteVerificado?: boolean;       // legacy (alias de donoVerificado)

  // ============ MÉTRICAS ============
  visualizacoes?: number;
  contactos?: number;
  favoritos?: number;
  desbloqueios?: number;
  diasPublicado?: number;               // legacy
  diasRestantes?: number;               // legacy
  stats?: StatsAnuncio;                 // legacy

  // ============ COMPENSAÇÃO ============
  compensacaoRecebida?: number;         // legacy

  // ============ CARACTERÍSTICAS DINÂMICAS ============
  caracteristicas?: Record<string, any>;

  // ============ FLAGS ============
  origemDemo?: boolean;
}

// ============================================================
// HELPERS DE APRESENTAÇÃO
// ============================================================
export function formatarPrecoAnuncio(anuncio: Anuncio): string {
  const num = anuncio.preco.toLocaleString('pt-PT');
  const sufixo = sufixoPrecoFinalidade(anuncio.finalidade);
  return `${num} ${anuncio.moeda || 'MT'}${sufixo}`;
}

export function zonaCurta(anuncio: Anuncio): string {
  if (anuncio.bairro && anuncio.cidade) return `${anuncio.bairro}, ${anuncio.cidade}`;
  if (anuncio.cidade) return anuncio.cidade;
  if (anuncio.provincia) return anuncio.provincia;
  return anuncio.zona || '—';
}

export function anuncioCorresponde(anuncio: Anuncio, texto: string): boolean {
  if (!texto.trim()) return true;
  const t = texto.toLocaleLowerCase('pt-MZ');
  return (
    anuncio.titulo.toLocaleLowerCase('pt-MZ').includes(t) ||
    anuncio.descricao.toLocaleLowerCase('pt-MZ').includes(t) ||
    anuncio.zona.toLocaleLowerCase('pt-MZ').includes(t)
  );
}

/**
 * Devolve o nome do anunciante (compat com campos legacy e novos).
 */
export function nomeAnunciante(anuncio: Anuncio): string {
  return anuncio.anuncianteNome || anuncio.donoNome || 'Anunciante';
}

/**
 * Devolve true se o anunciante é verificado (compat legacy + novo).
 */
export function anuncianteVerificado(anuncio: Anuncio): boolean {
  return anuncio.anuncianteVerificado || anuncio.donoVerificado || false;
}

/**
 * Devolve a data de publicação (compat legacy + novo).
 */
export function dataPublicacaoAnuncio(anuncio: Anuncio): string {
  return anuncio.publicadoEm || anuncio.dataPublicacao || anuncio.dataCriacao;
}

// ============================================================
// MODERAÇÃO (denúncias, avisos, suspensões)
// ============================================================
export * from './types-moderacao-snippet';

// ============================================================
// IMÓVEL (legacy — usado por imoveis-mock, CardImovel e imovel/[id])
// ============================================================
export interface Imovel {
  id: string;
  titulo: string;
  descricaoCurta: string;
  descricao: string;
  tipo: CategoriaAnuncio | string;
  finalidade: Finalidade;
  preco: number;
  periodicidade?: Periodicidade;
  fotos: string[];
  provincia: string;
  cidade: string;
  bairro: string;
  latitude: number;
  longitude: number;
  moradaCompleta: string;
  quartos?: number;
  casasBanho?: number;
  area: number;
  mobilado: boolean;
  agua: boolean;
  energia: boolean;
  wifi: boolean;
  estacionamento: boolean;
  anuncianteId: string;
  anuncianteNome: string;
  anuncianteRating: number;
  anuncianteAvaliacoes: number;
  anuncianteVerificado: boolean;
  anuncianteTelefone1: string;
  anuncianteTelefone2?: string;
  publicadoEm: string;
  visualizacoes: number;
  favoritos: number;
}
