/**
 * src/store/moderacaoStore.ts
 *
 * Store de moderação — denúncias, avisos e suspensões.
 * Persistência e sincronização via moderacaoService (API + fallback local).
 *
 * Keys:
 * - @gohome_moderacao_denuncias
 * - @gohome_moderacao_avisos
 * - @gohome_moderacao_suspensao
 *
 * Em protótipo, aprovações/rejeições acontecem automaticamente após 3s.
 * Em produção, isto é feito por moderadores humanos via dashboard admin.
 */

import { create } from 'zustand';
import { moderacaoService } from '../../service/moderacaoService';
import {
  Denuncia,
  Aviso,
  Suspensao,
  EstadoDenuncia,
  MotivoDenuncia,
} from '../types';
import { useWalletStore } from './walletStore';

// ============================================================
// CONSTANTES
// ============================================================

const COMPENSACAO_DENUNCIA = 25;         // MT ao denunciante
const AVISOS_PARA_SUSPENSAO = 3;         // 3 avisos → suspensão automática
const DURACAO_SUSPENSAO_MS = 24 * 60 * 60 * 1000;  // 24h
const MOCK_DELAY_MS = 3000;              // 3s de simulação de moderação

// ============================================================
// INPUT TYPES
// ============================================================
export interface DadosNovaDenuncia {
  anuncioId: string;
  tituloAnuncio: string;
  motivos: MotivoDenuncia[];
  descricao: string;
  provaUri: string;
}

export interface DadosContestacao {
  descricao: string;
  provaUri?: string;
}

// ============================================================
// STATE
// ============================================================
interface ModeracaoState {
  denuncias: Denuncia[];
  avisos: Aviso[];
  suspensao: Suspensao | null;
  carregado: boolean;

  // Acções principais
  carregarModeracao: () => Promise<void>;

  // Denunciante
  criarDenuncia: (dados: DadosNovaDenuncia) => Promise<Denuncia>;

  // Anunciante
  marcarAvisoVisto: (avisoId: string) => Promise<void>;
  contestarSuspensao: (dados: DadosContestacao) => Promise<void>;

  // Helpers derivados
  estaSuspenso: () => boolean;
  avisosNaoVistos: () => number;
  minhasDenuncias: () => Denuncia[];
  denunciasPendentes: () => Denuncia[];

  // Reset (debug/dev)
  limpar: () => Promise<void>;
}

// ============================================================
// HELPERS
// ============================================================
function gerarId(prefixo: string): string {
  return `${prefixo}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function persistirDenuncias(denuncias: Denuncia[]) {
  try {
    await moderacaoService.guardarDenuncias(denuncias);
  } catch (err) {
    console.warn('[moderacaoStore] erro ao persistir denúncias', err);
  }
}

async function persistirAvisos(avisos: Aviso[]) {
  try {
    await moderacaoService.guardarAvisos(avisos);
  } catch (err) {
    console.warn('[moderacaoStore] erro ao persistir avisos', err);
  }
}

async function persistirSuspensao(suspensao: Suspensao | null) {
  try {
    await moderacaoService.guardarSuspensao(suspensao);
  } catch (err) {
    console.warn('[moderacaoStore] erro ao persistir suspensão', err);
  }
}

// ============================================================
// STORE
// ============================================================
export const useModeracaoStore = create<ModeracaoState>((set, get) => ({
  denuncias: [],
  avisos: [],
  suspensao: null,
  carregado: false,

  // ============ CARREGAR DO ASYNCSTORAGE ============
  carregarModeracao: async () => {
    try {
      const dados = await moderacaoService.carregar();
      const denuncias: Denuncia[] = dados.denuncias;
      const avisos: Aviso[] = dados.avisos;
      let suspensao: Suspensao | null = dados.suspensao;

      // Verifica expiração automática de suspensão
      if (suspensao && suspensao.estado === 'activa') {
        const agora = Date.now();
        const fim = new Date(suspensao.dataFim).getTime();
        if (agora >= fim) {
          suspensao = { ...suspensao, estado: 'expirada' };
          await persistirSuspensao(suspensao);
        }
      }

      set({ denuncias, avisos, suspensao, carregado: true });
    } catch (err) {
      console.warn('[moderacaoStore] erro ao carregar', err);
      set({ denuncias: [], avisos: [], suspensao: null, carregado: true });
    }
  },

  // ============ CRIAR DENÚNCIA (procurador) ============
  criarDenuncia: async (dados) => {
    const novaDenuncia: Denuncia = {
      id: gerarId('d'),
      anuncioId: dados.anuncioId,
      tituloAnuncio: dados.tituloAnuncio,
      motivos: dados.motivos,
      descricao: dados.descricao,
      provaUri: dados.provaUri,
      dataCriacao: new Date().toISOString(),
      estado: 'pendente',
    };

    const novasDenuncias = [novaDenuncia, ...get().denuncias];
    set({ denuncias: novasDenuncias });
    await persistirDenuncias(novasDenuncias);

    // Simulação de moderação após 3s (em produção, humano decide)
    setTimeout(async () => {
      await aprovarDenunciaMock(novaDenuncia.id);
    }, MOCK_DELAY_MS);

    return novaDenuncia;
  },

  // ============ MARCAR AVISO COMO VISTO ============
  marcarAvisoVisto: async (avisoId) => {
    const novosAvisos = get().avisos.map(a =>
      a.id === avisoId ? { ...a, visto: true } : a
    );
    set({ avisos: novosAvisos });
    await persistirAvisos(novosAvisos);
  },

  // ============ CONTESTAR SUSPENSÃO (anunciante) ============
  contestarSuspensao: async (dados) => {
    const suspensaoActual = get().suspensao;
    if (!suspensaoActual || suspensaoActual.estado !== 'activa') return;

    const novaSuspensao: Suspensao = {
      ...suspensaoActual,
      estado: 'contestada',
      contestacao: {
        descricao: dados.descricao,
        provaUri: dados.provaUri,
        dataSubmissao: new Date().toISOString(),
      },
    };
    set({ suspensao: novaSuspensao });
    await persistirSuspensao(novaSuspensao);

    // Simulação de análise de contestação após 3s (em produção, humano decide)
    setTimeout(async () => {
      await aceitarContestacaoMock();
    }, MOCK_DELAY_MS);
  },

  // ============ HELPERS DERIVADOS ============
  estaSuspenso: () => {
    const s = get().suspensao;
    if (!s) return false;
    return s.estado === 'activa' || s.estado === 'contestada';
  },

  avisosNaoVistos: () => {
    return get().avisos.filter(a => !a.visto).length;
  },

  minhasDenuncias: () => {
    return [...get().denuncias].sort(
      (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
    );
  },

  denunciasPendentes: () => {
    return get().denuncias.filter(d => d.estado === 'pendente');
  },

  limpar: async () => {
    set({ denuncias: [], avisos: [], suspensao: null });
    await moderacaoService.limpar();
  },
}));

// ============================================================
// MOCK — SIMULAÇÃO DE MODERAÇÃO (em produção é removido)
// ============================================================

/**
 * Aprova uma denúncia pendente e aplica consequências:
 * 1. Credita 25 MT na carteira do denunciante
 * 2. Cria aviso para o anunciante
 * 3. Se for 3º aviso, suspende por 24h
 */
async function aprovarDenunciaMock(denunciaId: string) {
  const store = useModeracaoStore.getState();
  const denuncia = store.denuncias.find(d => d.id === denunciaId);
  if (!denuncia || denuncia.estado !== 'pendente') return;

  // 1. Actualizar denúncia
  const denunciaAprovada: Denuncia = {
    ...denuncia,
    estado: 'aprovada',
    dataResolucao: new Date().toISOString(),
    compensacaoRecebida: COMPENSACAO_DENUNCIA,
  };
  const novasDenuncias = store.denuncias.map(d =>
    d.id === denunciaId ? denunciaAprovada : d
  );
  useModeracaoStore.setState({ denuncias: novasDenuncias });
  await persistirDenuncias(novasDenuncias);

  // 2. Creditar 25 MT ao denunciante
  const wallet = useWalletStore.getState();
  try {
    await wallet.creditarCompensacao(
      COMPENSACAO_DENUNCIA,
      `Compensação — denúncia aprovada ("${denuncia.tituloAnuncio}")`,
      {
        anuncioId: denuncia.anuncioId,
        tituloAnuncio: denuncia.tituloAnuncio,
        categoria: 'denuncia_valida',
      }
    );
  } catch (err) {
    console.warn('[moderacaoStore] erro ao creditar denunciante', err);
  }

  // 3. Criar aviso para o anunciante
  // (num app real, isto iria para o utilizador dono do anúncio;
  //  aqui simulamos que o utilizador actual é o anunciante)
  const avisosExistentes = useModeracaoStore.getState().avisos;
  const avisosDoAnuncio = avisosExistentes.filter(a => a.anuncioId === denuncia.anuncioId);
  const numeroAviso = Math.min(avisosDoAnuncio.length + 1, 3) as 1 | 2 | 3;

  const novoAviso: Aviso = {
    id: gerarId('v'),
    anuncioId: denuncia.anuncioId,
    tituloAnuncio: denuncia.tituloAnuncio,
    motivosDenunciados: denuncia.motivos,
    dataCriacao: new Date().toISOString(),
    visto: false,
    numeroAviso,
  };
  const novosAvisos = [novoAviso, ...avisosExistentes];
  useModeracaoStore.setState({ avisos: novosAvisos });
  await persistirAvisos(novosAvisos);

  // 4. Se é o 3º aviso E não há suspensão activa, cria suspensão
  const totalAvisos = novosAvisos.length;
  const suspensaoActual = useModeracaoStore.getState().suspensao;
  const temSuspensaoEmCurso = suspensaoActual &&
    (suspensaoActual.estado === 'activa' || suspensaoActual.estado === 'contestada');

  if (totalAvisos >= AVISOS_PARA_SUSPENSAO && !temSuspensaoEmCurso) {
    const agora = new Date();
    const fim = new Date(agora.getTime() + DURACAO_SUSPENSAO_MS);
    const novaSuspensao: Suspensao = {
      id: gerarId('s'),
      dataInicio: agora.toISOString(),
      dataFim: fim.toISOString(),
      avisoDesencadeador: novoAviso.id,
      estado: 'activa',
    };
    useModeracaoStore.setState({ suspensao: novaSuspensao });
    await persistirSuspensao(novaSuspensao);
  }
}

/**
 * Aceita a contestação de uma suspensão e levanta-a.
 */
async function aceitarContestacaoMock() {
  const store = useModeracaoStore.getState();
  const suspensao = store.suspensao;
  if (!suspensao || suspensao.estado !== 'contestada') return;

  const suspensaoLevantada: Suspensao = {
    ...suspensao,
    estado: 'levantada',
    contestacao: suspensao.contestacao ? {
      ...suspensao.contestacao,
      dataResolucao: new Date().toISOString(),
      aceite: true,
    } : undefined,
  };
  useModeracaoStore.setState({ suspensao: suspensaoLevantada });
  await persistirSuspensao(suspensaoLevantada);
}