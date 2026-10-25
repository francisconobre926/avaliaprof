import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// TIPOS
// ============================================================
export type CorDestaque = 'azul' | 'laranja' | 'verde' | 'rosa' | 'roxo' | 'preto';
export type ModoTema = 'claro' | 'escuro';

// ============================================================
// DEFINIÇÕES DE COR DE DESTAQUE
// Azul GoHome #0082DE e Laranja GoHome #FE8A00 são as cores oficiais.
// Outras ficam disponíveis para personalização pelo utilizador.
// ============================================================
export interface DefinicaoCorDestaque {
  id: CorDestaque;
  nome: string;
  principal: string;
  claro: string;
  escuro: string;
  gradiente: [string, string];
}

export const CORES_DESTAQUE: Record<CorDestaque, DefinicaoCorDestaque> = {
  azul: {
    id: 'azul',
    nome: 'Azul GoHome',
    principal: '#0082DE',
    claro: '#E6F4FD',
    escuro: '#0061A6',
    gradiente: ['#0082DE', '#FE8A00'], // Gradiente oficial: azul → laranja
  },
  laranja: {
    id: 'laranja',
    nome: 'Laranja GoHome',
    principal: '#FE8A00',
    claro: '#FFF3E0',
    escuro: '#CB6E00',
    gradiente: ['#FE8A00', '#0082DE'], // Gradiente oficial inverso: laranja → azul
  },
  verde: {
    id: 'verde',
    nome: 'Verde',
    principal: '#4CAF50',
    claro: '#E8F5E9',
    escuro: '#388E3C',
    gradiente: ['#4CAF50', '#8BC34A'],
  },
  rosa: {
    id: 'rosa',
    nome: 'Rosa',
    principal: '#E91E63',
    claro: '#FCE4EC',
    escuro: '#C2185B',
    gradiente: ['#E91E63', '#F06292'],
  },
  roxo: {
    id: 'roxo',
    nome: 'Roxo',
    principal: '#9C27B0',
    claro: '#F3E5F5',
    escuro: '#7B1FA2',
    gradiente: ['#9C27B0', '#673AB7'],
  },
  preto: {
    id: 'preto',
    nome: 'Preto',
    principal: '#212121',
    claro: '#F5F5F5',
    escuro: '#000000',
    gradiente: ['#424242', '#212121'],
  },
};

// ============================================================
// PALETAS DE MODO (Claro / Escuro)
// Modo claro = default (fundo branco)
// Modo escuro = fundo preto do logo GoHome
// ============================================================
export interface PaletaModo {
  // Fundos
  fundo: string;              // fundo principal da app
  fundoSuave: string;         // fundo de chips, inputs subtis
  fundoElevado: string;       // fundo de cards principais
  branco: string;             // superfície branca neutra (compat legacy)

  // Textos
  textoPrincipal: string;
  textoSecundario: string;
  textoTerciario: string;

  // Bordas
  bordaSubtil: string;
  bordaMedia: string;

  // Semânticos
  sucesso: string;
  aviso: string;
  erro: string;
  premium: string;
  destaque: string;           // Laranja GoHome em ambos os modos
}

export const PALETA_CLARO: PaletaModo = {
  fundo: '#FFFFFF',
  fundoSuave: '#F7F8FA',
  fundoElevado: '#FFFFFF',
  branco: '#FFFFFF',

  textoPrincipal: '#0A0E1A',
  textoSecundario: '#5A6B82',
  textoTerciario: '#8A9AAF',

  bordaSubtil: '#E8ECF1',
  bordaMedia: '#D5DAE3',

  sucesso: '#00C853',
  aviso: '#FF9800',
  erro: '#F44336',
  premium: '#FFB300',
  destaque: '#FE8A00', // Laranja GoHome
};

export const PALETA_ESCURO: PaletaModo = {
  fundo: '#000000',           // Preto puro (como no logo)
  fundoSuave: '#0F0F0F',
  fundoElevado: '#141414',    // Cards
  branco: '#1A1A1A',          // "branco" no escuro = cinza muito escuro

  textoPrincipal: '#FFFFFF',
  textoSecundario: '#B0B0B0',
  textoTerciario: '#707070',

  bordaSubtil: '#2A2A2A',
  bordaMedia: '#3A3A3A',

  sucesso: '#4CAF50',
  aviso: '#FFB74D',
  erro: '#EF5350',
  premium: '#FFCA28',
  destaque: '#FE8A00', // Laranja GoHome (igual nos 2 modos — identidade)
};

// ============================================================
// STORE
// ============================================================
interface ThemeState {
  corDestaque: CorDestaque;
  modo: ModoTema;
  carregado: boolean;

  // Actions
  mudarCor: (cor: CorDestaque) => Promise<void>;
  mudarModo: (modo: ModoTema) => Promise<void>;
  alternarModo: () => Promise<void>;
  carregarTema: () => Promise<void>;
  resetTema: () => Promise<void>;

  // Getters
  getCorPrincipal: () => string;
  getCorClara: () => string;
  getCorEscura: () => string;
  getGradiente: () => [string, string];
  getPaleta: () => PaletaModo;
}

const CHAVE_STORAGE = '@gohome_tema';

export const useThemeStore = create<ThemeState>((set, get) => ({
  corDestaque: 'azul',  // Azul GoHome como default
  modo: 'claro',        // Modo claro como default (fundo branco)
  carregado: false,

  mudarCor: async (cor) => {
    set({ corDestaque: cor });
    const estado = { corDestaque: cor, modo: get().modo };
    await AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
  },

  mudarModo: async (modo) => {
    set({ modo });
    const estado = { corDestaque: get().corDestaque, modo };
    await AsyncStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado));
  },

  alternarModo: async () => {
    const novoModo: ModoTema = get().modo === 'claro' ? 'escuro' : 'claro';
    await get().mudarModo(novoModo);
  },

  carregarTema: async () => {
    try {
      const guardado = await AsyncStorage.getItem(CHAVE_STORAGE);
      if (guardado) {
        const estado = JSON.parse(guardado);
        set({
          corDestaque: estado.corDestaque || 'azul',
          modo: estado.modo || 'claro',
          carregado: true,
        });
      } else {
        set({ carregado: true });
      }
    } catch (e) {
      set({ carregado: true });
    }
  },

  resetTema: async () => {
    set({ corDestaque: 'azul', modo: 'claro' });
    await AsyncStorage.removeItem(CHAVE_STORAGE);
  },

  // Getters
  getCorPrincipal: () => CORES_DESTAQUE[get().corDestaque].principal,
  getCorClara: () => CORES_DESTAQUE[get().corDestaque].claro,
  getCorEscura: () => CORES_DESTAQUE[get().corDestaque].escuro,
  getGradiente: () => CORES_DESTAQUE[get().corDestaque].gradiente,
  getPaleta: () => (get().modo === 'claro' ? PALETA_CLARO : PALETA_ESCURO),
}));

// ============================================================
// HOOK PRINCIPAL — useCores()
// ============================================================
export const useCores = () => {
  const corDestaque = useThemeStore(state => state.corDestaque);
  const modo = useThemeStore(state => state.modo);

  const definicao = CORES_DESTAQUE[corDestaque];
  const paleta = modo === 'claro' ? PALETA_CLARO : PALETA_ESCURO;

  return {
    // Cor de destaque
    principal: definicao.principal,
    principalClara: definicao.claro,
    principalEscura: definicao.escuro,
    gradiente: definicao.gradiente,

    // Paleta do modo
    ...paleta,

    // Metadados
    corDestaque,
    modo,
    ehEscuro: modo === 'escuro',
  };
};