/**
 * Conversas (lista de mensagens).
 *
 * API esperada: GET /conversas → Conversa[]
 * Fallback local: CONVERSAS_MOCK.
 */
import { CONVERSAS_MOCK, Conversa } from '../src/data/conversas-mock';
import { api, extrairLista, lerComFallback } from './fallback';

const eConversa = (c: any): c is Conversa => !!c && typeof c === 'object' && c.id != null && typeof c.nome === 'string';

export const conversasService = {
  async listar(): Promise<Conversa[]> {
    const { dados } = await lerComFallback<Conversa[]>({
      nome: 'conversas.listar',
      remoto: async () => extrairLista<Conversa>((await api.get('/conversas')).data).filter(eConversa).map(c => ({ ...c, id: String(c.id) })),
      valido: Array.isArray,
      local: () => CONVERSAS_MOCK,
    });
    return dados;
  },
};
