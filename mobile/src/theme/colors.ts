// ============================================================
// Identidade visual AvaliaProf — paleta oficial
//
//   Canvas      #FBFBF8  fundo principal
//   Mist        #DBE3E9  cartões, bordas, inputs, chips
//   Cornflower  #6AA6DA  cor primária (botões, destaques, ícones ativos)
//   Pear        #E1E5AC  acento (badges, tags, alertas leves)
//   Black       #000000  texto e títulos
//
// ACESSIBILIDADE (WCAG AA):
//   • Cornflower é claro: texto SOBRE ele é preto (8,1:1), nunca branco (2,6:1).
//     Sobre Canvas serve como preenchimento/ícone; para TEXTO azul pequeno usar
//     azulTexto #245E92 (6,5:1).
//   • Pear é sempre fundo; o texto sobre ele é verdeTexto #4A5510 / aviso #6B5A00 (≥ 5:1).
//   • Estados nunca dependem só da cor: acompanham sempre texto ou ícone.
// ============================================================

/** Paleta base — única fonte de verdade para valores hexadecimais. */
export const Paleta = {
  // Oficiais
  azul: '#6AA6DA',          // Cornflower
  gelo: '#FBFBF8',            // Canvas
  verde: '#8A9A2E',
  carvao: '#000000',          // Black

  // Derivados do azul
  azulTexto: '#245E92',     // texto/links sobre fundos claros (≥ 6:1)
  azulSuave: '#E6EFF8',     // superfícies selecionadas, pílulas
  azulClaro: '#6AA6DA',     // texto/ícones azuis sobre fundo escuro

  // Derivados do verde
  verdeTexto: '#4A5510',    // texto e botões de sucesso (texto branco ≥ 5:1)
  verdeSuave: '#E1E5AC',     // Pear
  verdeClaro: '#E1E5AC',    // sucesso sobre fundo escuro

  // Neutros
  branco: '#FFFFFF',
  fundoSuave: '#DBE3E9',    // Mist    // chips, inputs, blocos sobre o gelo
  textoSecundario: '#4A5560',
  textoTerciario: '#58626C',
  borda: '#DBE3E9',             // Mist         // divisores e contornos decorativos
  bordaForte: '#6B7A87',    // contorno de campos/controlos (≥ 3:1)

  // Estados
  erro: '#B3261E',
  erroFundo: '#FCE8E6',
  erroBorda: '#F5C6C2',
  erroEscuro: '#8C1D18',
  aviso: '#6B5A00',         // âmbar escuro: texto ≥ 4,5:1 sobre avisoFundo
  avisoFundo: '#E1E5AC',   // Pear
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
  overlayEscuro: 'rgba(0, 0, 0, 0.72)',
  overlayMedio: 'rgba(0, 0, 0, 0.48)',
  overlayLeve: 'rgba(0, 0, 0, 0.22)',
  vidro: 'rgba(255, 255, 255, 0.88)',
  vidroEscuro: 'rgba(0, 0, 0, 0.86)',

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
