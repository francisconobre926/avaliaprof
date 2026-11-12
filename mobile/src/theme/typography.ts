import { Fonte } from './fonts';

// ============================================================
// Escala tipográfica AvaliaProf
//
// Hierarquia:
//   • Sora (títulos)  — display, h1–h3 e preços. Letter-spacing apenas
//     ligeiramente negativo: a Sora é ampla e fecha-se rápido demais.
//   • Manrope (texto) — tudo o que se lê em bloco ou se toca.
//
// Regras:
//   • Texto ≤ 13 px nunca passa de peso 600.
//   • Tamanho mínimo de texto de leitura: 12 px (rótulos em maiúsculas: 11 px).
//   • Altura de linha ≥ 1,4× no texto corrido para boa leitura em ecrãs pequenos.
//   • Preços usam algarismos tabulares para alinhar em listas.
//   • Tamanhos permitidos: 11 · 12 · 13 · 14 · 15 · 16 · 18 · 20 · 22 · 24 · 28 · 34
//     (+ 44/48/56 só para números de destaque). Título de página = 28 (tituloPagina).
// ============================================================
export const Typography = {
  // ---- Escala de páginas e cards (ecrãs e cards) ----
  tituloPagina: { fontSize: 28, lineHeight: 34, fontFamily: Fonte.tituloBold, letterSpacing: -0.4 },
  tituloSecao: { fontSize: 20, lineHeight: 26, fontFamily: Fonte.tituloSemi, letterSpacing: -0.2 },
  tituloCard: { fontSize: 16, lineHeight: 22, fontFamily: Fonte.corpoBold },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: Fonte.corpo },
  etiqueta: { fontSize: 12, lineHeight: 16, fontFamily: Fonte.corpoSemi },

  // ---- Display (cabeçalhos de página e destaque) ----
  displayXL: { fontSize: 34, lineHeight: 40, fontFamily: Fonte.tituloBold, letterSpacing: -0.6 },
  displayLG: { fontSize: 28, lineHeight: 34, fontFamily: Fonte.tituloBold, letterSpacing: -0.4 },
  displayMD: { fontSize: 24, lineHeight: 30, fontFamily: Fonte.tituloBold, letterSpacing: -0.3 },

  // ---- Títulos ----
  h1: { fontSize: 22, lineHeight: 28, fontFamily: Fonte.tituloBold, letterSpacing: -0.3 },
  h2: { fontSize: 18, lineHeight: 24, fontFamily: Fonte.tituloSemi, letterSpacing: -0.2 },
  h3: { fontSize: 16, lineHeight: 22, fontFamily: Fonte.tituloSemi, letterSpacing: -0.1 },
  h4: { fontSize: 15, lineHeight: 20, fontFamily: Fonte.corpoBold },

  // ---- Corpo ----
  bodyLarge: { fontSize: 16, lineHeight: 24, fontFamily: Fonte.corpo },
  body: { fontSize: 15, lineHeight: 22, fontFamily: Fonte.corpo },
  bodyBold: { fontSize: 15, lineHeight: 22, fontFamily: Fonte.corpoSemi },
  bodySmall: { fontSize: 13, lineHeight: 19, fontFamily: Fonte.corpo },

  // ---- Micro (labels, legendas) ----
  caption: { fontSize: 12, lineHeight: 17, fontFamily: Fonte.corpoMedio },
  captionBold: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },

  // ---- Botões ----
  buttonLarge: { fontSize: 16, lineHeight: 22, fontFamily: Fonte.corpoBold },
  button: { fontSize: 15, lineHeight: 20, fontFamily: Fonte.corpoBold },
  buttonSmall: { fontSize: 13, lineHeight: 18, fontFamily: Fonte.corpoSemi },

  // ---- Preços (Sora, tabulares) ----
  precoDisplay: { fontSize: 28, lineHeight: 34, fontFamily: Fonte.tituloBold, letterSpacing: -0.4, fontVariant: ['tabular-nums' as const] },
  precoGrande: { fontSize: 22, lineHeight: 28, fontFamily: Fonte.tituloBold, letterSpacing: -0.3, fontVariant: ['tabular-nums' as const] },
  preco: { fontSize: 17, lineHeight: 22, fontFamily: Fonte.tituloSemi, letterSpacing: -0.2, fontVariant: ['tabular-nums' as const] },
};

// Espaçamento base 4 dp
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

// Cantos arredondados — pílulas (full) para botões e chips, xl/xxl para cards
export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

// Alturas dos controlos — escala única para botões, campos, chips e barras.
// Área de toque mínima de 40 dp (hitSlop onde o elemento visual for menor).
export const Controlo = {
  botaoPequeno: 36,
  botao: 44,
  botaoGrande: 48,
  input: 44,
  chip: 34,
  topBar: 48,
  tabBar: 56,
  icone: 22,
};

// Folhas inferiores (bottom sheets)
export const Folha = {
  raio: 24,
  alturaMaxima: 0.85, // fração da altura do ecrã
  handle: { largura: 36, altura: 4 },
};

// Espessuras de contorno
export const Borda = {
  fina: 0.5,
  normal: 1,
  media: 1.5,
  forte: 2,
};
