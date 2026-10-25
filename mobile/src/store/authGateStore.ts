/**
 * src/store/authGateStore.ts
 *
 * Store global que gere o modal "Cria conta para continuar"
 * e a acção pendente que deve ser executada após o utilizador
 * criar conta ou fazer login (deep link).
 *
 * Esta store é consumida pelo:
 * - hook useAuthGate() → API pública para as páginas
 * - componente ModalAuthGate → renderiza o modal
 * - fluxo de auth/registo → chama executarAccaoPendente() ao concluir
 */

import { create } from 'zustand';

// ============================================================
// MOTIVOS
// ============================================================
export type MotivoGate =
  | 'ver_detalhes'
  | 'favoritar'
  | 'mensagem'
  | 'desbloquear_contacto'
  | 'perfil'
  | 'alerta_pesquisa'
  | 'generico';

export interface ConfigMotivo {
  icone: string;          // Nome do ícone MaterialCommunityIcons
  corIcone: string;       // Cor do ícone
  corFundoIcone: string;  // Cor de fundo do círculo do ícone
  titulo: string;
  descricao: string;
  beneficios: string[];
}

// ============================================================
// CONFIGURAÇÃO DAS MENSAGENS POR MOTIVO
// ============================================================
export const CONFIG_MOTIVOS: Record<MotivoGate, ConfigMotivo> = {
  ver_detalhes: {
    icone: 'eye',
    corIcone: '#FF7900',
    corFundoIcone: '#FFF4E6',
    titulo: 'Vê todos os detalhes',
    descricao: 'Cria conta grátis para ver fotos completas, características e falar com o anunciante.',
    beneficios: [
      'Fotos em alta resolução',
      'Localização no mapa',
      'Guarda os teus favoritos',
      'Recebe alertas de novas publicações',
    ],
  },
  favoritar: {
    icone: 'heart',
    corIcone: '#D32F2F',
    corFundoIcone: '#FFEBEE',
    titulo: 'Guarda os teus favoritos',
    descricao: 'Com conta, guardas os anúncios que gostas e vês quando houver mudanças.',
    beneficios: [
      'Lista de anúncios favoritos',
      'Alertas de preço',
      'Comparação lado a lado',
      'Acesso em qualquer dispositivo',
    ],
  },
  mensagem: {
    icone: 'message-text',
    corIcone: '#1976D2',
    corFundoIcone: '#E3F2FD',
    titulo: 'Fala com o anunciante',
    descricao: 'Com conta, podes enviar mensagens directas aos donos dos anúncios.',
    beneficios: [
      'Mensagens directas aos donos',
      'Histórico de conversas',
      'Marcar visitas',
      'Receber respostas em tempo real',
    ],
  },
  desbloquear_contacto: {
    icone: 'lock-open',
    corIcone: '#1976D2',
    corFundoIcone: '#E3F2FD',
    titulo: 'Desbloqueia o contacto',
    descricao: 'Precisas de conta para pagar e falar com o anunciante em segurança.',
    beneficios: [
      'Contacto directo com o dono',
      'Pagamento via M-Pesa / eMola',
      'Histórico de desbloqueios',
      'Protecção contra burlas',
    ],
  },
  perfil: {
    icone: 'account-circle',
    corIcone: '#0B2E59',
    corFundoIcone: '#E8EEF5',
    titulo: 'Gere o teu perfil',
    descricao: 'Com conta, personalizas a tua experiência e acompanhas as tuas interacções.',
    beneficios: [
      'Perfil personalizado',
      'Histórico de pesquisas',
      'Preferências guardadas',
      'Carteira para transacções',
    ],
  },
  alerta_pesquisa: {
    icone: 'bell',
    corIcone: '#FF7900',
    corFundoIcone: '#FFF4E6',
    titulo: 'Recebe alertas',
    descricao: 'Avisamos-te quando aparecerem anúncios novos que correspondem aos teus critérios.',
    beneficios: [
      'Notificações de novos anúncios',
      'Filtros guardados',
      'Alertas por zona',
      'Sê o primeiro a saber',
    ],
  },
  generico: {
    icone: 'star-four-points',
    corIcone: '#FF7900',
    corFundoIcone: '#FFF4E6',
    titulo: 'Cria conta para continuar',
    descricao: 'Para esta acção precisas de ter uma conta GoHome. É grátis.',
    beneficios: [
      'Vê todos os detalhes',
      'Guarda os favoritos',
      'Fala com anunciantes',
      'Carteira segura',
    ],
  },
};

// ============================================================
// STATE
// ============================================================
interface AuthGateState {
  visivel: boolean;
  motivo: MotivoGate;
  accaoPendente: (() => void) | null;

  // Acções
  abrir: (motivo: MotivoGate, callback: () => void) => void;
  fechar: () => void;
  executarAccaoPendente: () => void;
  limpar: () => void;
}

// ============================================================
// STORE
// ============================================================
export const useAuthGateStore = create<AuthGateState>((set, get) => ({
  visivel: false,
  motivo: 'generico',
  accaoPendente: null,

  /**
   * Abre o modal e guarda a acção que deve ser executada após o
   * utilizador criar conta ou fazer login.
   */
  abrir: (motivo, callback) => {
    set({
      visivel: true,
      motivo,
      accaoPendente: callback,
    });
  },

  /**
   * Fecha o modal sem executar a acção pendente.
   * Usado quando o utilizador cancela ("Continuar a explorar sem conta").
   */
  fechar: () => {
    set({ visivel: false, accaoPendente: null });
  },

  /**
   * Executa a acção que estava pendente.
   * Chamado após o utilizador concluir o registo ou login com sucesso.
   */
  executarAccaoPendente: () => {
    const { accaoPendente } = get();
    if (accaoPendente) {
      try {
        accaoPendente();
      } catch (err) {
        console.warn('[authGateStore] erro ao executar acção pendente', err);
      }
    }
    set({ visivel: false, accaoPendente: null });
  },

  /**
   * Reset total — útil quando o utilizador faz logout.
   */
  limpar: () => {
    set({ visivel: false, motivo: 'generico', accaoPendente: null });
  },
}));