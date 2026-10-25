import { Fonte } from './fonts';

// Escala tipográfica GoHome.
// Regra: só os títulos e preços usam a fonte de display; tudo o que é
// lido em bloco ou interagido usa a fonte de texto. Pesos contidos —
// a hierarquia vem do tamanho e da fonte, não de pôr tudo a negrito.
export const Typography = {
  // Display (headers grandes)
  displayXL: {
    fontSize: 38,
    fontFamily: Fonte.tituloSemi,
    lineHeight: 42,
    letterSpacing: -1.2,
  },
  displayLG: {
    fontSize: 30,
    fontFamily: Fonte.tituloSemi,
    lineHeight: 34,
    letterSpacing: -0.9,
  },
  displayMD: {
    fontSize: 26,
    fontFamily: Fonte.tituloSemi,
    lineHeight: 30,
    letterSpacing: -0.6,
  },

  // Títulos
  h1: {
    fontSize: 23,
    fontFamily: Fonte.tituloSemi,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 19,
    fontFamily: Fonte.tituloSemi,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 17,
    fontFamily: Fonte.corpoSemi,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  h4: {
    fontSize: 15,
    fontFamily: Fonte.corpoSemi,
    lineHeight: 20,
  },

  // Corpo
  bodyLarge: {
    fontSize: 16,
    fontFamily: Fonte.corpo,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontFamily: Fonte.corpo,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontFamily: Fonte.corpo,
    lineHeight: 18,
  },

  // Micro (labels, captions)
  caption: {
    fontSize: 12,
    fontFamily: Fonte.corpoMedio,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 11,
    fontFamily: Fonte.corpoSemi,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },

  // Botões
  buttonLarge: {
    fontSize: 16,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: -0.1,
  },
  button: {
    fontSize: 15,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: -0.1,
  },
  buttonSmall: {
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },

  // Preços — display, com algarismos tabulares para alinhar listas
  precoDisplay: {
    fontSize: 28,
    fontFamily: Fonte.tituloSemi,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums' as const],
  },
  precoGrande: {
    fontSize: 22,
    fontFamily: Fonte.tituloSemi,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  },
  preco: {
    fontSize: 17,
    fontFamily: Fonte.tituloSemi,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums' as const],
  },
};

// Espaçamento base 4dp (mais preciso que 8dp)
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

// Cantos arredondados — mais contidos; pílulas só onde fazem sentido
export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};
