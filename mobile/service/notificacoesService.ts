/** Notificações dentro da app (`/notifications`). O servidor só devolve as do utilizador autenticado. */
import { api } from './api';
import { traduzirErro } from './erro';

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string;
  ecra: string | null;
  lida: boolean;
  criadaEm: string;
}

interface NotificacaoApi { id: string; type: string; title: string; body: string; data: { screen?: string } | null; readAt: string | null; createdAt: string }

const run = async <T>(f: () => Promise<T>): Promise<T> => { try { return await f(); } catch (e) { throw traduzirErro(e); } };

export const notificacoesService = {
  listar: (pagina = 0) => run(async () => {
    const { data } = await api.get<{ items: NotificacaoApi[]; unread: number; hasMore: boolean }>('/notifications', { params: { page: pagina } });
    return {
      itens: data.items.map((n): Notificacao => ({ id: n.id, tipo: n.type, titulo: n.title, corpo: n.body, ecra: n.data?.screen ?? null, lida: !!n.readAt, criadaEm: n.createdAt })),
      porLer: data.unread,
      maisPaginas: data.hasMore,
    };
  }),
  porLer: () => run(async () => (await api.get<{ unread: number }>('/notifications/unread-count')).data.unread),
  marcarLida: (id: string) => run(async () => (await api.post<{ unread: number }>(`/notifications/${id}/read`)).data.unread),
  marcarTodas: () => run(async () => { await api.post('/notifications/read-all'); }),
};
