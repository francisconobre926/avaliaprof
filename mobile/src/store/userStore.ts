/**
 * src/store/userStore.ts
 *
 * Store do utilizador com persistência via perfilService (API + fallback local).
 *
 * Keys:
 * - @gohome_user_v2_usuario       → dados do perfil
 * - @gohome_user_v2_papel         → papel escolhido no onboarding
 * - @gohome_user_v2_modo_conv     → se está em modo convidado
 */

import { create } from 'zustand';
import { perfilService } from '../../service/perfilService';

// ============================================================
// TIPOS
// ============================================================
export type PapelUtilizador = 'procurador' | 'anunciante' | null;

export interface UsuarioPerfil {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  foto?: string | null;
  dataCriacao: string;
}

export interface DadosRegisto {
  nome: string;
  email: string;
  telefone: string;
  password: string;
}

interface UserState {
  // ============ ESTADO ============
  usuario: UsuarioPerfil | null;
  papel: PapelUtilizador;
  modoConvidado: boolean;
  carregado: boolean;

  // ============ ACÇÕES ============
  carregarUsuario: () => Promise<void>;

  // Fluxo de onboarding
  escolherPapel: (papel: 'procurador' | 'anunciante') => Promise<void>;

  // Fluxo de registo/login
  registar: (dados: DadosRegisto) => Promise<void>;
  login: (email: string, password: string) => Promise<{ sucesso: boolean; erro?: string }>;
  /** Só para testes: inicia sessão com uma conta fictícia já preenchida. */
  entrarComoDemo: (papel: 'procurador' | 'anunciante') => Promise<void>;
  completarRegisto: () => Promise<void>;

  // Edição de perfil
  actualizarPerfil: (dados: Partial<Omit<UsuarioPerfil, 'id' | 'dataCriacao'>>) => Promise<void>;
  adicionarFoto: (uri: string) => Promise<void>;

  // Logout
  sair: () => Promise<void>;

  // Helpers
  estaAutenticado: () => boolean;

  // Reset total (debug/dev)
  limpar: () => Promise<void>;
}

// ============================================================
// CONSTANTES
// ============================================================

// ============================================================
// HELPERS
// ============================================================
function gerarId(): string {
  return `u${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persistirUsuario(usuario: UsuarioPerfil | null) {
  try {
    await perfilService.guardarUsuario(usuario);
  } catch (err) {
    console.warn('[userStore] erro ao persistir usuario', err);
  }
}

async function persistirPapel(papel: PapelUtilizador) {
  await perfilService.guardarPapel(papel);
}

async function persistirModoConvidado(valor: boolean) {
  await perfilService.guardarModoConvidado(valor);
}

// ============================================================
// STORE
// ============================================================
export const useUserStore = create<UserState>((set, get) => ({
  usuario: null,
  papel: null,
  modoConvidado: false,
  carregado: false,

  // ============ CARREGAR DO ASYNCSTORAGE ============
  carregarUsuario: async () => {
    try {
      const { usuario, papel, modoConvidado } = await perfilService.carregar();

      set({ usuario, papel, modoConvidado, carregado: true });
    } catch (err) {
      console.warn('[userStore] erro ao carregar', err);
      set({ usuario: null, papel: null, modoConvidado: false, carregado: true });
    }
  },

  // ============ ESCOLHER PAPEL (onboarding) ============
  escolherPapel: async (papel) => {
    // Procurador → entra em modo convidado (pode usar sem conta)
    // Anunciante → NÃO entra em modo convidado (precisa de conta imediata)
    const modoConvidado = papel === 'procurador';
    set({ papel, modoConvidado });
    await Promise.all([
      persistirPapel(papel),
      persistirModoConvidado(modoConvidado),
    ]);
  },

  // ============ REGISTO ============
  registar: async (dados) => {
    const novoUsuario: UsuarioPerfil = {
      id: gerarId(),
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      foto: null,
      dataCriacao: new Date().toISOString(),
    };

    set({ usuario: novoUsuario, modoConvidado: false });
    await Promise.all([
      persistirUsuario(novoUsuario),
      persistirModoConvidado(false),
    ]);
  },

  // ============ LOGIN (mock) ============
  login: async (email, password) => {
    if (!email.trim() || !password.trim()) {
      return { sucesso: false, erro: 'Preenche email e password.' };
    }
    if (password.length < 6) {
      return { sucesso: false, erro: 'Password deve ter pelo menos 6 caracteres.' };
    }

    // Mock: cria usuário baseado no email
    const usuario: UsuarioPerfil = {
      id: gerarId(),
      nome: email.split('@')[0].replace(/[._]/g, ' '),
      email,
      telefone: '',
      foto: null,
      dataCriacao: new Date().toISOString(),
    };

    set({ usuario, modoConvidado: false });
    await Promise.all([
      persistirUsuario(usuario),
      persistirModoConvidado(false),
    ]);

    return { sucesso: true };
  },

  // ============ CONTA DEMO (testes) ============
  entrarComoDemo: async (papel) => {
    const usuario: UsuarioPerfil = papel === 'anunciante'
      ? { id: 'demo-anunciante', nome: 'Carlos Mondlane', email: 'anunciante@gohome.mz', telefone: '+258841234567', foto: null, dataCriacao: '2026-01-15T09:00:00Z' }
      : { id: 'demo-procurador', nome: 'Ana Machava', email: 'procurador@gohome.mz', telefone: '+258827654321', foto: null, dataCriacao: '2026-01-15T09:00:00Z' };
    set({ usuario, papel, modoConvidado: false });
    await Promise.all([persistirUsuario(usuario), persistirPapel(papel), persistirModoConvidado(false)]);
  },

  // ============ COMPLETAR REGISTO (desactivar modo convidado) ============
  completarRegisto: async () => {
    set({ modoConvidado: false });
    await persistirModoConvidado(false);
  },

  // ============ ACTUALIZAR PERFIL ============
  actualizarPerfil: async (dados) => {
    const usuarioActual = get().usuario;
    if (!usuarioActual) return;

    const usuarioActualizado: UsuarioPerfil = {
      ...usuarioActual,
      ...dados,
    };

    set({ usuario: usuarioActualizado });
    await persistirUsuario(usuarioActualizado);
  },

  // ============ ADICIONAR FOTO DE PERFIL ============
  adicionarFoto: async (uri) => {
    const usuarioActual = get().usuario;
    if (!usuarioActual) return;

    const usuarioActualizado: UsuarioPerfil = {
      ...usuarioActual,
      foto: uri,
    };

    set({ usuario: usuarioActualizado });
    await persistirUsuario(usuarioActualizado);
  },

  // ============ LOGOUT ============
  // Mantém o papel escolhido (não volta ao onboarding),
  // mas limpa dados do usuário e volta a modo convidado (se procurador).
  sair: async () => {
    const papelActual = get().papel;
    const voltarAConvidado = papelActual === 'procurador';

    set({
      usuario: null,
      modoConvidado: voltarAConvidado,
    });
    await Promise.all([
      persistirUsuario(null),
      persistirModoConvidado(voltarAConvidado),
    ]);
  },

  // ============ HELPER: ESTÁ AUTENTICADO? ============
  estaAutenticado: () => {
    const estado = get();
    return estado.usuario !== null && !estado.modoConvidado;
  },

  // ============ RESET TOTAL (debug) ============
  limpar: async () => {
    set({ usuario: null, papel: null, modoConvidado: false });
    await perfilService.limpar();
  },
}));