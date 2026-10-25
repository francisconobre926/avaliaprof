// ============================================================
// Paleta GoHome — Design profissional 2026
// Cores oficiais extraídas do logo: Azul #0082DE + Laranja #FE8A00
// ============================================================

export const Colors = {
  // ============ MARCA GOHOME ============
  azul: '#0082DE',           // Azul principal (do logo)
  azulClaro: '#4CA7E7',
  azulEscuro: '#0061A6',
  azulProfundo: '#003A66',
  azulNoite: '#000000',      // Preto do fundo do logo

  laranja: '#FE8A00',        // Laranja principal (do logo)
  laranjaClaro: '#FEA73F',
  laranjaEscuro: '#CB6E00',

  // ============ ACENTOS SECUNDÁRIOS ============
  verde: '#4CAF50',
  verdeEscuro: '#388E3C',
  verdeClaro: '#81C784',

  // ============ GRADIENTES OFICIAIS GOHOME ============
  gradienteMarca: ['#0082DE', '#FE8A00'] as const,        // Azul → Laranja (identidade GoHome)
  gradientePrimario: ['#0082DE', '#0061A6'] as const,     // Azul → Azul escuro
  gradienteLaranja: ['#FE8A00', '#CB6E00'] as const,
  gradientePremium: ['#0061A6', '#003A66'] as const,
  gradienteSucesso: ['#4CAF50', '#388E3C'] as const,
  gradienteEscuro: ['#000000', '#141414'] as const,
  gradienteVidro: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'] as const,

  // ============ NEUTROS ============
  branco: '#FFFFFF',
  preto: '#000000',
  fundo: '#FFFFFF',
  fundoCard: '#FFFFFF',
  fundoInput: '#F7F8FA',
  fundoSuave: '#EEF2F7',

  // Cinzas
  cinzaClaro: '#F0F2F5',
  cinzaMedio: '#8B95A7',
  cinzaEscuro: '#5A6478',

  // Divisórias
  divisoria: '#E8ECF1',

  // ============ TEXTO (hierarquia) ============
  textoPrincipal: '#0A0E1A',
  textoSecundario: '#5A6B82',
  textoTerciario: '#8A9AAF',
  textoInverso: '#FFFFFF',

  // ============ BORDAS ============
  bordaSubtil: '#E8ECF1',
  bordaMedia: '#D5DAE3',
  bordaEscura: '#B0BAC9',

  // ============ ESTADOS SEMÂNTICOS ============
  sucesso: '#00C853',
  sucessoFundo: '#E8F5E9',
  aviso: '#FF9800',
  avisoFundo: '#FFF3E0',
  erro: '#F44336',
  erroFundo: '#FFEBEE',
  info: '#0082DE',           // Alinhado com azul GoHome
  infoFundo: '#E6F4FD',

  // ============ OVERLAYS E EFEITOS ============
  overlayEscuro: 'rgba(0, 0, 0, 0.75)',
  overlayMedio: 'rgba(0, 0, 0, 0.5)',
  overlayLeve: 'rgba(0, 0, 0, 0.25)',
  vidro: 'rgba(255, 255, 255, 0.85)',
  vidroEscuro: 'rgba(0, 0, 0, 0.85)',

  // ============ ESPECIAIS ============
  destaque: '#FE8A00',        // Laranja GoHome (promoções, CTA destacados)
  premium: '#FFB300',         // Dourado (ratings, VIP)
  transparente: 'transparent',
};

// ============================================================
// Sistema de sombras profissional (iOS + Android)
// ============================================================
export const Sombras = {
  nenhuma: {
    shadowColor: 'transparent',
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 12,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
  },
  colorida: (cor: string) => ({
    shadowColor: cor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  }),
};