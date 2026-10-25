// ============================================================
// Paleta GoHome
//
// Princípios:
// - Neutros quentes (papel/tinta) em vez de brancos puros e cinzas azulados.
// - Azul da marca afinado para UI (#0A6BC0 tem contraste AA sobre branco;
//   o #0082DE do logo fica reservado ao próprio logo).
// - Laranja é acento, não decoração: CTA principal, badges, um detalhe por ecrã.
// - Superfícies sólidas; gradientes só tonais (mesma cor, dois tons).
// ============================================================

export const Colors = {
  // ============ MARCA GOHOME ============
  azul: '#0A6BC0',
  azulClaro: '#5B9BD5',
  azulEscuro: '#08508F',
  azulProfundo: '#095FAA',   // Superfícies de marca (hero, banners)
  azulNoite: '#0F1012',

  laranja: '#E8760A',
  laranjaClaro: '#F3A257',
  laranjaEscuro: '#B95A05',

  // ============ ACENTOS SECUNDÁRIOS ============
  verde: '#2F7A4F',
  verdeEscuro: '#22593A',
  verdeClaro: '#7FB394',

  // ============ GRADIENTES (tonais) ============
  gradienteMarca: ['#0A6BC0', '#08508F'] as const,
  gradientePrimario: ['#0A6BC0', '#095FAA'] as const,
  gradienteLaranja: ['#E8760A', '#D86B06'] as const,
  gradientePremium: ['#0A6BC0', '#095FAA'] as const,
  gradienteSucesso: ['#2F7A4F', '#286B45'] as const,
  gradienteEscuro: ['#16181B', '#0F1012'] as const,
  gradienteVidro: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.8)'] as const,

  // ============ NEUTROS ============
  branco: '#FFFFFF',
  preto: '#15181D',
  fundo: '#FAFAF7',
  fundoCard: '#FFFFFF',
  fundoInput: '#F4F3EF',
  fundoSuave: '#F2F1EC',

  // Cinzas
  cinzaClaro: '#EFEEE9',
  cinzaMedio: '#8E939B',
  cinzaEscuro: '#5B616B',

  // Divisórias
  divisoria: '#E7E5DF',

  // ============ TEXTO (hierarquia) ============
  textoPrincipal: '#15181D',
  textoSecundario: '#5B616B',
  textoTerciario: '#8E939B',
  textoInverso: '#FFFFFF',

  // ============ BORDAS ============
  bordaSubtil: '#E7E5DF',
  bordaMedia: '#D6D3CB',
  bordaEscura: '#AFABA2',

  // ============ ESTADOS SEMÂNTICOS ============
  sucesso: '#2F7A4F',
  sucessoFundo: '#EAF3EC',
  aviso: '#B7791F',
  avisoFundo: '#FBF3E4',
  erro: '#C2412D',
  erroFundo: '#FBECE9',
  info: '#0A6BC0',
  infoFundo: '#EAF2FA',

  // ============ OVERLAYS E EFEITOS ============
  overlayEscuro: 'rgba(15, 16, 18, 0.72)',
  overlayMedio: 'rgba(15, 16, 18, 0.48)',
  overlayLeve: 'rgba(15, 16, 18, 0.22)',
  vidro: 'rgba(255, 255, 255, 0.88)',
  vidroEscuro: 'rgba(15, 16, 18, 0.86)',

  // ============ ESPECIAIS ============
  destaque: '#E8760A',
  premium: '#B8862B',        // Dourado envelhecido (ratings, VIP)
  transparente: 'transparent',
};

// ============================================================
// Sombras — curtas e neutras. A separação de planos faz-se
// sobretudo com bordas finas; a sombra só sugere elevação.
// ============================================================
export const Sombras = {
  nenhuma: {
    shadowColor: 'transparent',
  },
  sm: {
    shadowColor: '#1A1712',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1712',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1712',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1A1712',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 14,
  },
  // Mantida por compatibilidade: já não tinge a sombra com a cor
  // (o "glow" colorido era o principal ruído visual).
  colorida: (_cor: string) => ({
    shadowColor: '#1A1712',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  }),
};
