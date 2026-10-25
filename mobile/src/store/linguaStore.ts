/**
 * src/store/linguaStore.ts
 *
 * Store Zustand para preferência de língua.
 * Persistência em AsyncStorage.
 *
 * Fluxo:
 * 1. App inicia → carregarLingua() lê do AsyncStorage
 * 2. Se não houver preferência guardada → `linguaEscolhida = null`
 *    → App redireciona para /onboarding/lingua
 * 3. Utilizador escolhe → escolherLingua('pt' | 'en')
 * 4. Guarda e aplica no i18next
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n';

export type Lingua = 'pt' | 'en';

export interface DefinicaoLingua {
  codigo: Lingua;
  nome: string;
  nomeNativo: string;
  bandeira: string;    // emoji
  completo: string;    // ex: "Português (Moçambique)"
}

export const LINGUAS_DISPONIVEIS: Record<Lingua, DefinicaoLingua> = {
  pt: {
    codigo: 'pt',
    nome: 'Portuguese',
    nomeNativo: 'Português',
    bandeira: '🇲🇿',
    completo: 'Português (Moçambique)',
  },
  en: {
    codigo: 'en',
    nome: 'English',
    nomeNativo: 'English',
    bandeira: '🇬🇧',
    completo: 'English',
  },
};

interface LinguaState {
  linguaEscolhida: Lingua | null;   // null = ainda não escolheu
  carregado: boolean;

  // Acções
  carregarLingua: () => Promise<void>;
  escolherLingua: (lingua: Lingua) => Promise<void>;
  alternarLingua: () => Promise<void>;
  resetLingua: () => Promise<void>;

  // Helpers
  linguaActual: () => Lingua;
  precisaEscolherLingua: () => boolean;
  getBandeira: () => string;
  getNomeNativo: () => string;
}

const KEY_LINGUA = '@gohome_lingua';

/**
 * Devolve a melhor língua default baseada no telemóvel.
 * Se o telemóvel estiver em PT (qualquer variante), devolve 'pt'.
 * Se estiver em EN, devolve 'en'. Caso contrário, 'pt' (default do app).
 */
function detectarLinguaTelemóvel(): Lingua {
  try {
    const locales = Localization.getLocales();
    const primeira = locales[0]?.languageCode?.toLowerCase() || 'pt';
    if (primeira.startsWith('en')) return 'en';
    return 'pt'; // default
  } catch {
    return 'pt';
  }
}

export const useLinguaStore = create<LinguaState>((set, get) => ({
  linguaEscolhida: null,
  carregado: false,

  carregarLingua: async () => {
    try {
      const guardada = await AsyncStorage.getItem(KEY_LINGUA);
      const lingua = (guardada as Lingua) || null;

      if (lingua) {
        // Já tinha escolhido antes
        await i18n.changeLanguage(lingua);
        set({ linguaEscolhida: lingua, carregado: true });
      } else {
        // Nunca escolheu — vai para ecrã de escolha
        set({ linguaEscolhida: null, carregado: true });
      }
    } catch (err) {
      console.warn('[linguaStore] erro ao carregar', err);
      set({ linguaEscolhida: null, carregado: true });
    }
  },

  escolherLingua: async (lingua) => {
    try {
      await AsyncStorage.setItem(KEY_LINGUA, lingua);
      await i18n.changeLanguage(lingua);
      set({ linguaEscolhida: lingua });
    } catch (err) {
      console.warn('[linguaStore] erro ao guardar', err);
    }
  },

  alternarLingua: async () => {
    const actual = get().linguaEscolhida || 'pt';
    const nova: Lingua = actual === 'pt' ? 'en' : 'pt';
    await get().escolherLingua(nova);
  },

  resetLingua: async () => {
    await AsyncStorage.removeItem(KEY_LINGUA);
    set({ linguaEscolhida: null });
  },

  linguaActual: () => {
    return get().linguaEscolhida || detectarLinguaTelemóvel();
  },

  precisaEscolherLingua: () => {
    return get().carregado && get().linguaEscolhida === null;
  },

  getBandeira: () => {
    const l = get().linguaActual();
    return LINGUAS_DISPONIVEIS[l].bandeira;
  },

  getNomeNativo: () => {
    const l = get().linguaActual();
    return LINGUAS_DISPONIVEIS[l].nomeNativo;
  },
}));

// Helper exportado para uso directo (sem hook)
export { detectarLinguaTelemóvel };