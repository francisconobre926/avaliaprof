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
    principal: '#0A6BC0',
    claro: '#EAF2FA',
    escuro: '#08508F',
    gradiente: ['#0A6BC0', '#095FAA'], // Tonal — sem saltos de matiz
  },
  laranja: {
    id: 'laranja',
    nome: 'Laranja GoHome',
    principal: '#D96D08',
    claro: '#FBF0E3',
    escuro: '#A85204',
    gradiente: ['#D96D08', '#C86306'],
  },
  verde: {
    id: 'verde',
    nome: 'Verde',
    principal: '#2F7A4F',
    claro: '#EAF3EC',
    escuro: '#22593A',
    gradiente: ['#2F7A4F', '#296D46'],
  },
  rosa: {
    id: 'rosa',
    nome: 'Rosa',
    principal: '#B83A64',
    claro: '#F8EAEF',
    escuro: '#8E2A4B',
    gradiente: ['#B83A64', '#A8335A'],
  },
  roxo: {
    id: 'roxo',
    nome: 'Roxo',
    principal: '#6B4BA8',
    claro: '#F0ECF7',
    escuro: '#513782',
    gradiente: ['#6B4BA8', '#60439A'],
  },
  preto: {
    id: 'preto',
    nome: 'Grafite',
    principal: '#1F2226',
    claro: '#EFEEE9',
    escuro: '#0F1012',
    gradiente: ['#2A2D32', '#1F2226'],
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
  fundo: '#FAFAF7',           // Papel quente, não branco clínico
  fundoSuave: '#F2F1EC',
  fundoElevado: '#FFFFFF',
  branco: '#FFFFFF',

  textoPrincipal: '#15181D',
  textoSecundario: '#5B616B',
  textoTerciario: '#8E939B',

  bordaSubtil: '#E7E5DF',
  bordaMedia: '#D6D3CB',

  sucesso: '#2F7A4F',
  aviso: '#B7791F',
  erro: '#C2412D',
  premium: '#B8862B',
  destaque: '#E8760A',
};

export const PALETA_ESCURO: PaletaModo = {
  fundo: '#0F1012',           // Quase-preto, evita o halo do #000 em OLED
  fundoSuave: '#17181B',
  fundoElevado: '#1B1D20',
  branco: '#1B1D20',

  textoPrincipal: '#F2F1EE',
  textoSecundario: '#A6A9AE',
  textoTerciario: '#6F7378',

  bordaSubtil: '#2A2C30',
  bordaMedia: '#383B40',

  sucesso: '#5FA77B',
  aviso: '#D9A24A',
  erro: '#E0705C',
  premium: '#D4A84E',
  destaque: '#F08A2C',
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