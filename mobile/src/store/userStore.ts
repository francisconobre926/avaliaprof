/**
 * Estado da sessão. Fala com `authService` (API REST).
 */
import { create } from 'zustand';
import { authService, type DadosRegisto, type DadosActivacaoDocente } from '../../service/authService';
import { definirAoSessaoExpirada } from '../../service/api';
import { limparCache } from '../offline/cache';
import type { Utilizador } from '../types';

interface UserState {
  utilizador: Utilizador | null;
  carregado: boolean;
  carregarSessao: () => Promise<void>;
  entrar: (email: string, senha: string) => Promise<void>;
  registar: (dados: DadosRegisto) => Promise<void>;
  activarDocente: (dados: DadosActivacaoDocente) => Promise<void>;
  atualizarPerfil: (alteracoes: Partial<Pick<Utilizador, 'nome' | 'foto'>>) => Promise<void>;
  sair: () => Promise<void>;
  sairDeTodos: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  utilizador: null,
  carregado: false,

  carregarSessao: async () => {
    const utilizador = await authService.restaurarSessao();
    set({ utilizador, carregado: true });
  },
  entrar: async (email, senha) => set({ utilizador: await authService.entrar(email, senha) }),
  registar: async dados => set({ utilizador: await authService.registar(dados) }),
  activarDocente: async dados => set({ utilizador: await authService.activarDocente(dados) }),
  atualizarPerfil: async alteracoes => {
    const atual = get().utilizador;
    if (!atual) return;
    set({ utilizador: await authService.atualizarPerfil(alteracoes, atual.foto) });
  },
  sair: async () => {
    await authService.terminarSessao(true);
    await limparCache();
    set({ utilizador: null });
  },
  sairDeTodos: async () => {
    await authService.terminarTodasSessoes();
    await limparCache();
    set({ utilizador: null });
  },
}));

// Token recusado pelo servidor (expirado/revogado): termina a sessão e o layout protegido volta ao login.
definirAoSessaoExpirada(() => {
  authService.terminarSessao().finally(() => { void limparCache(); useUserStore.setState({ utilizador: null }); });
});
