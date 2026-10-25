export const Typography = {
  // Display (headers grandes)
  displayXL: {
    fontSize: 40,
    fontWeight: '800' as const,
    lineHeight: 48,
    letterSpacing: -1,
  },
  displayLG: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displayMD: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },

  // Títulos
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },

  // Corpo
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Micro (labels, captions)
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '700' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },

  // Botões
  buttonLarge: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },

  // Preços
  precoDisplay: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  precoGrande: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  preco: {
    fontSize: 18,
    fontWeight: '700' as const,
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

// Cantos arredondados
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};