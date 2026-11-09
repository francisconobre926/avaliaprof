/**
 * Anúncios — catálogo público, detalhe, publicação e gestão.
 *
 * API esperada:
 *   GET    /anuncios          → Anuncio[]  (ou { data: Anuncio[] })
 *   GET    /anuncios/:id      → Anuncio
 *   POST   /anuncios          → publica/actualiza um anúncio
 *   DELETE /anuncios/:id      → elimina
 *
 * Fallback local: anúncios publicados no dispositivo (AsyncStorage) + ANUNCIOS_MOCK.
 */
import { Anuncio } from '../src/types';
import { ANUNCIOS_MOCK } from '../src/data/anuncios-mock';
import {
  AnuncioLocal, eliminarAnuncioLocal, guardarAnuncioLocal, listarAnunciosLocais, obterAnuncioLocal,
} from '../src/store/anunciosLocal';
import { api, escreverComFallback, extrairLista, lerComFallback, Resultado } from './fallback';

const GRUPO_POR_CATEGORIA: Record<string, string> = {
  casa: 'imoveis', apartamento: 'imoveis', quarto: 'imoveis', moradia: 'imoveis',
  terreno: 'terrenos', lote: 'terrenos',
  espaco_eventos: 'espacos', espaco_casamento: 'espacos',
  espaco_reuniao: 'espacos', espaco_formacao: 'espacos', estudio: 'espacos',
  hotel: 'alojamento', pensao: 'alojamento', hospedagem: 'alojamento', quarto_hotel: 'alojamento',
  loja: 'comercial', escritorio: 'comercial', salao: 'comercial', espaco_comercial: 'comercial',
  carro: 'veiculos', mota: 'veiculos', carrinha: 'veiculos', camiao: 'veiculos',
  equipamento: 'equipamentos', maquina: 'equipamentos',
};

/** Converte um anúncio guardado no dispositivo para o formato do catálogo público. */
export function converterAnuncioLocal(anuncio: AnuncioLocal): Anuncio {
  const categoria = String(anuncio.categoria || 'casa').toLowerCase();
  const fotos = Array.isArray(anuncio.fotos) ? anuncio.fotos.filter(Boolean) : [];
  const descricao = String(anuncio.descricao || '');
  const zona = [anuncio.bairro, anuncio.cidade].filter(Boolean).join(', ');
  const grupo = GRUPO_POR_CATEGORIA[categoria] || 'imoveis';

  return {
    ...anuncio,
    id: String(anuncio.id),
    titulo: String(anuncio.titulo || 'Anúncio GoHome'),
    categoria: categoria as any,
    finalidade: String(anuncio.finalidade || 'arrendar') as any,
    bairro: String(anuncio.bairro || 'Localização por confirmar'),
    cidade: String(anuncio.cidade || 'Moçambique'),
    provincia: String((anuncio as any).provincia || 'Sofala'),
    preco: Number(anuncio.preco || 0),
    descricao,
    descricaoCurta: descricao.slice(0, 120),
    fotos,
    imagem: fotos[0] || undefined,
    zona,
    grupo,
    grupoCategoria: grupo,
    publicadoEm: anuncio.publicadoEm || new Date().toISOString(),
    caracteristicas: anuncio.caracteristicas || {},
    anuncianteNome: anuncio.anuncianteNome || 'Anunciante GoHome',
    anuncianteTelefone1: anuncio.anuncianteTelefone1 || '',
    anuncianteTelefone2: anuncio.anuncianteTelefone2 || '',
    latitude: anuncio.latitude ?? null,
    longitude: anuncio.longitude ?? null,
    origemDemo: false,
  } as unknown as Anuncio;
}

/** Anúncios pagos e activos publicados neste dispositivo. */
async function publicadosLocais(): Promise<Anuncio[]> {
  try {
    const locais = await listarAnunciosLocais();
    return locais
      .filter(i => String(i.estadoPagamento || '').toLowerCase() === 'confirmado')
      .filter(i => String(i.estadoAnuncio || 'activo').toLowerCase() === 'activo')
      .map(converterAnuncioLocal);
  } catch (erro) {
    console.warn('[anunciosService] não foi possível ler anúncios locais', erro);
    return [];
  }
}

/** Junta listas sem duplicar ids (a primeira lista tem prioridade). */
function semDuplicados(...listas: Anuncio[][]): Anuncio[] {
  const vistos = new Set<string>();
  const saida: Anuncio[] = [];
  for (const l of listas) for (const a of l) {
    if (!a || vistos.has(a.id)) continue;
    vistos.add(a.id);
    saida.push(a);
  }
  return saida;
}

const eAnuncio = (a: any): a is Anuncio => !!a && typeof a === 'object' && a.id != null && typeof a.titulo === 'string';

export const anunciosService = {
  /** Catálogo público. Nunca lança erro e nunca devolve vazio por falha de rede. */
  async listar(): Promise<Resultado<Anuncio[]>> {
    const locais = await publicadosLocais();
    return lerComFallback<Anuncio[]>({
      nome: 'anuncios.listar',
      remoto: async () => extrairLista<Anuncio>((await api.get('/anuncios')).data).filter(eAnuncio).map(a => ({ ...a, id: String(a.id) })),
      valido: lista => lista.length > 0,
      // Anúncios do próprio dispositivo (acabados de publicar) aparecem logo, mesmo antes de sincronizar.
      aoSucesso: undefined,
      local: () => semDuplicados(locais, ANUNCIOS_MOCK),
    }).then(r => (r.origem === 'api' ? { ...r, dados: semDuplicados(locais, r.dados) } : r));
  },

  /** Detalhe de um anúncio (API → publicado no dispositivo → demonstração). */
  async obter(id: string): Promise<Resultado<Anuncio | null>> {
    const alvo = String(id || '');
    if (!alvo) return { dados: null, origem: 'local' };
    return lerComFallback<Anuncio | null>({
      nome: 'anuncios.obter',
      remoto: async () => {
        const a = (await api.get(`/anuncios/${encodeURIComponent(alvo)}`)).data;
        return eAnuncio(a) ? { ...a, id: String(a.id) } : null;
      },
      valido: a => a != null,
      local: async () => {
        const local = await obterAnuncioLocal(alvo);
        return local ? converterAnuncioLocal(local) : ANUNCIOS_MOCK.find(a => a.id === alvo) ?? null;
      },
    });
  },

  /** Registo local bruto (inclui anúncios pendentes de pagamento) — usado nos ecrãs do anunciante. */
  async obterLocal(id: string): Promise<AnuncioLocal | null> {
    return obterAnuncioLocal(String(id || ''));
  },

  /** Cria ou actualiza um anúncio. Grava sempre localmente e sincroniza com a API em segundo plano. */
  async guardar(anuncio: AnuncioLocal): Promise<void> {
    await escreverComFallback<void>({
      nome: 'anuncios.guardar',
      local: () => guardarAnuncioLocal(anuncio),
      remoto: () => api.post('/anuncios', anuncio),
    });
  },

  async eliminar(id: string): Promise<void> {
    await escreverComFallback<void>({
      nome: 'anuncios.eliminar',
      local: () => eliminarAnuncioLocal(id),
      remoto: () => api.delete(`/anuncios/${encodeURIComponent(id)}`),
    });
  },
};
