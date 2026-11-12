import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paleta } from '../theme/colors';

// ============================================================
// TIPOS
// ============================================================
export type CorDestaque = 'azul' | 'laranja' | 'verde' | 'rosa' | 'roxo' | 'preto';
export type ModoTema = 'claro' | 'escuro';

// ============================================================
// DEFINIÇÕES DE COR DE DESTAQUE
// Azul AvaliaProf #0082DE e Laranja AvaliaProf #FE8A00 são as cores oficiais.
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
  // Identidade oficial AvaliaProf (por omissão).
  azul: {
    id: 'azul',
    nome: 'Azul AvaliaProf',
    principal: Paleta.azul,
    claro: Paleta.azulSuave,
    escuro: Paleta.azulTexto,
    gradiente: [Paleta.azul, Paleta.azul],
  },
  // Alternativas de personalização (opcionais, escolhidas pelo utilizador).
  laranja: {
    id: 'laranja',
    nome: 'Laranja',
    principal: '#C5530A',
    claro: '#FCEFE3',
    escuro: '#9A4107',
    gradiente: ['#C5530A', '#9A4107'],
  },
  verde: {
    id: 'verde',
    nome: 'Verde',
    principal: Paleta.verdeTexto,
    claro: Paleta.verdeSuave,
    escuro: '#0D5C2E',
    gradiente: [Paleta.verdeTexto, '#0D5C2E'],
  },
  rosa: {
    id: 'rosa',
    nome: 'Rosa',
    principal: '#B83A64',
    claro: '#F8EAEF',
    escuro: '#8E2A4B',
    gradiente: ['#B83A64', '#8E2A4B'],
  },
  roxo: {
    id: 'roxo',
    nome: 'Roxo',
    principal: '#6B4BA8',
    claro: '#F0ECF7',
    escuro: '#513782',
    gradiente: ['#6B4BA8', '#513782'],
  },
  preto: {
    id: 'preto',
    nome: 'Carvão',
    principal: Paleta.carvao,
    claro: Paleta.fundoSuave,
    escuro: '#000000',
    gradiente: [Paleta.carvao, Paleta.carvao],
  },
};

// ============================================================
// PALETAS DE MODO (Claro / Escuro)
// Modo claro = default (fundo branco)
// Modo escuro = fundo preto do logo AvaliaProf
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
  destaque: string;           // Laranja AvaliaProf em ambos os modos
}

export const PALETA_CLARO: PaletaModo = {
  fundo: Paleta.gelo,
  fundoSuave: Paleta.fundoSuave,
  fundoElevado: Paleta.branco,
  branco: Paleta.branco,

  textoPrincipal: Paleta.carvao,
  textoSecundario: Paleta.textoSecundario,
  textoTerciario: Paleta.textoTerciario,

  bordaSubtil: Paleta.borda,
  bordaMedia: Paleta.bordaForte,

  sucesso: Paleta.verdeTexto,
  aviso: Paleta.aviso,
  erro: Paleta.erro,
  premium: Paleta.aviso,
  destaque: Paleta.azul,
};

// Modo escuro derivado da mesma paleta: carvão como base, azul e verde
// aclarados para manter contraste ≥ 4,5:1 sobre #14171A.
export const PALETA_ESCURO: PaletaModo = {
  fundo: '#14171A',
  fundoSuave: '#262B30',
  fundoElevado: '#1C2024',
  branco: '#1C2024',

  textoPrincipal: '#F2F4F5',
  textoSecundario: '#A3ADB6',
  textoTerciario: '#9AA5AE',

  bordaSubtil: '#333A41',
  bordaMedia: '#7C8B98',

  sucesso: Paleta.verdeClaro,
  aviso: Paleta.verdeSuave,
  erro: '#F28B82',
  premium: Paleta.verdeSuave,
  destaque: Paleta.azulClaro,
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

const CHAVE_STORAGE = '@avaliaprof_tema';

export const useThemeStore = create<ThemeState>((set, get) => ({
  corDestaque: 'azul',  // Azul AvaliaProf como default
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
    // Superfície suave da cor de destaque: tom claro no modo claro, translúcido no escuro.
    principalClara: modo === 'claro' ? definicao.claro : `${definicao.principal}33`,
    principalEscura: definicao.escuro,
    // Versão da cor de destaque segura para TEXTO pequeno (contraste AA).
    principalTexto: modo === 'claro' ? definicao.escuro : (corDestaque === 'azul' ? Paleta.azulClaro : definicao.claro),
    gradiente: definicao.gradiente,
    // Texto/ícones SOBRE a cor de destaque: preto no Cornflower (claro), branco nas restantes.
    textoSobrePrincipal: corDestaque === 'azul' ? Paleta.carvao : Paleta.branco,

    // Paleta do modo
    ...paleta,

    // Metadados
    corDestaque,
    modo,
    ehEscuro: modo === 'escuro',
  };
};