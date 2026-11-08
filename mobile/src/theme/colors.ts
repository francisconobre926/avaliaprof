// ============================================================
// Identidade visual GoHome — paleta oficial
//
//   Azul          #1A73E8  identidade, ações principais, elementos interativos
//   Branco gelo   #F8F9FA  fundos e superfícies
//   Verde         #34A853  estados positivos, confirmações, sucesso
//   Preto carvão  #202124  títulos, texto principal, estrutura
//
// Complementares (só estados, superfícies e legibilidade):
//   azul suave #E8F0FE · verde suave #E6F4EA · texto secundário #5F6368
//   bordas #DADCE0 · fundo de erro #FCE8E6 · texto de erro #B3261E
//
// ACESSIBILIDADE (WCAG AA, medido sobre #F8F9FA / branco):
//   • Azul #1A73E8 → 4,27:1 sobre gelo: usar como PREENCHIMENTO (botões com
//     texto branco = 4,51:1), ícones e texto grande. Para texto pequeno
//     usar azulTexto #1557B0 (6,59:1).
//   • Verde #34A853 → 2,90:1: só preenchimentos, pontos e ícones. Para
//     texto usar verdeTexto #137333 (5,65:1).
//   • Texto secundário #5F6368 → 5,74:1. Terciário #686D72 → 4,7:1+.
//   • Estados nunca dependem só da cor: acompanham sempre texto ou ícone.
// ============================================================

/** Paleta base — única fonte de verdade para valores hexadecimais. */
export const Paleta = {
  // Oficiais
  azul: '#1A73E8',
  gelo: '#F8F9FA',
  verde: '#34A853',
  carvao: '#202124',

  // Derivados do azul
  azulTexto: '#1557B0',     // texto/links sobre fundos claros (≥ 6:1)
  azulSuave: '#E8F0FE',     // superfícies selecionadas, pílulas
  azulClaro: '#8AB4F8',     // texto/ícones azuis sobre fundo escuro

  // Derivados do verde
  verdeTexto: '#137333',    // texto e botões de sucesso (texto branco ≥ 5:1)
  verdeSuave: '#E6F4EA',
  verdeClaro: '#81C995',    // sucesso sobre fundo escuro

  // Neutros
  branco: '#FFFFFF',
  fundoSuave: '#F1F3F4',    // chips, inputs, blocos sobre o gelo
  textoSecundario: '#5F6368',
  textoTerciario: '#686D72',
  borda: '#DADCE0',         // divisores e contornos decorativos
  bordaForte: '#80868B',    // contorno de campos/controlos (≥ 3:1)

  // Estados
  erro: '#B3261E',
  erroFundo: '#FCE8E6',
  erroBorda: '#F5C6C2',
  erroEscuro: '#8C1D18',
  aviso: '#9A5400',         // âmbar escuro: texto ≥ 4,5:1 sobre avisoFundo
  avisoFundo: '#FEF7E0',
} as const;

export const Colors = {
  // ============ MARCA ============
  azul: Paleta.azul,
  azulClaro: Paleta.azulClaro,
  azulEscuro: Paleta.azulTexto,
  azulTexto: Paleta.azulTexto,
  azulSuave: Paleta.azulSuave,
  azulProfundo: Paleta.azulTexto,   // legado
  azulNoite: Paleta.carvao,         // legado

  // Legado: o antigo acento laranja foi retirado da identidade.
  laranja: Paleta.azul,
  laranjaClaro: Paleta.azulClaro,
  laranjaEscuro: Paleta.azulTexto,

  verde: Paleta.verde,
  verdeTexto: Paleta.verdeTexto,
  verdeSuave: Paleta.verdeSuave,
  verdeEscuro: Paleta.verdeTexto,
  verdeClaro: Paleta.verdeClaro,

  carvao: Paleta.carvao,
  gelo: Paleta.gelo,

  // ============ GRADIENTES (tonais, discretos) ============
  gradienteMarca: [Paleta.azul, Paleta.azulTexto] as const,
  gradientePrimario: [Paleta.azul, Paleta.azul] as const,
  gradienteLaranja: [Paleta.azul, Paleta.azulTexto] as const,
  gradientePremium: [Paleta.azul, Paleta.azul] as const,
  gradienteSucesso: [Paleta.verdeTexto, Paleta.verdeTexto] as const,
  gradienteEscuro: [Paleta.carvao, Paleta.carvao] as const,
  gradienteVidro: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.8)'] as const,

  // ============ NEUTROS ============
  branco: Paleta.branco,
  preto: Paleta.carvao,
  fundo: Paleta.gelo,
  fundoCard: Paleta.branco,
  fundoInput: Paleta.fundoSuave,
  fundoSuave: Paleta.fundoSuave,

  cinzaClaro: Paleta.fundoSuave,
  cinzaMedio: Paleta.textoTerciario,
  cinzaEscuro: Paleta.textoSecundario,
  divisoria: Paleta.borda,

  // ============ TEXTO ============
  textoPrincipal: Paleta.carvao,
  textoSecundario: Paleta.textoSecundario,
  textoTerciario: Paleta.textoTerciario,
  textoInverso: Paleta.branco,

  // ============ BORDAS ============
  borda: Paleta.borda,
  bordaSubtil: Paleta.borda,
  bordaMedia: Paleta.bordaForte,
  bordaForte: Paleta.bordaForte,
  bordaEscura: Paleta.bordaForte,

  // ============ ESTADOS (cor + texto/ícone, nunca só cor) ============
  sucesso: Paleta.verdeTexto,
  sucessoFundo: Paleta.verdeSuave,
  aviso: Paleta.aviso,
  avisoFundo: Paleta.avisoFundo,
  erro: Paleta.erro,
  erroFundo: Paleta.erroFundo,
  erroBorda: Paleta.erroBorda,
  erroEscuro: Paleta.erroEscuro,
  info: Paleta.azulTexto,
  infoFundo: Paleta.azulSuave,

  // ============ OVERLAYS ============
  overlayEscuro: 'rgba(32, 33, 36, 0.72)',
  overlayMedio: 'rgba(32, 33, 36, 0.48)',
  overlayLeve: 'rgba(32, 33, 36, 0.22)',
  vidro: 'rgba(255, 255, 255, 0.88)',
  vidroEscuro: 'rgba(32, 33, 36, 0.86)',

  // ============ LEGADO ============
  destaque: Paleta.azul,
  premium: Paleta.aviso,
  transparente: 'transparent',
};

// ============================================================
// Sombras — curtas e neutras; a separação de planos faz-se com
// bordas finas, a sombra só sugere elevação.
// ============================================================
const SOMBRA = Paleta.carvao;
export const Sombras = {
  nenhuma: { shadowColor: 'transparent' },
  sm: { shadowColor: SOMBRA, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: SOMBRA, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  lg: { shadowColor: SOMBRA, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 6 },
  xl: { shadowColor: SOMBRA, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 22, elevation: 10 },
  // Mantida por compatibilidade: já não tinge a sombra com a cor.
  colorida: (_cor: string) => ({
    shadowColor: SOMBRA, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  }),
};
