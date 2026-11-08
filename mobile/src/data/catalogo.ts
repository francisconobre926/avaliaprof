import { Anuncio } from '../types';
import { ANUNCIOS_MOCK } from './anuncios-mock';
import { listarAnunciosLocais, AnuncioLocal } from '../store/anunciosLocal';

/**
 * Converte um anúncio guardado no dispositivo para o formato consumido
 * pelo catálogo público. Os anúncios pendentes de pagamento não são
 * publicados na lista pública.
 */
export function converterAnuncioLocal(anuncio: AnuncioLocal): Anuncio {
  const categoria = String(anuncio.categoria || 'casa').toLowerCase();
  const grupoPorCategoria: Record<string, string> = {
    casa: 'imoveis', apartamento: 'imoveis', quarto: 'imoveis', moradia: 'imoveis',
    terreno: 'terrenos', lote: 'terrenos',
    espaco_eventos: 'espacos', espaco_casamento: 'espacos',
    espaco_reuniao: 'espacos', espaco_formacao: 'espacos', estudio: 'espacos',
    hotel: 'alojamento', pensao: 'alojamento', hospedagem: 'alojamento',
    quarto_hotel: 'alojamento',
    loja: 'comercial', escritorio: 'comercial', salao: 'comercial',
    espaco_comercial: 'comercial',
    carro: 'veiculos', mota: 'veiculos', carrinha: 'veiculos', camiao: 'veiculos',
    equipamento: 'equipamentos', maquina: 'equipamentos',
  };
  const fotos = Array.isArray(anuncio.fotos) ? anuncio.fotos.filter(Boolean) : [];
  const descricao = String(anuncio.descricao || '');
  const zona = [anuncio.bairro, anuncio.cidade].filter(Boolean).join(', ');

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
    grupo: grupoPorCategoria[categoria] || 'imoveis',
    grupoCategoria: grupoPorCategoria[categoria] || 'imoveis',
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


/** Anúncios publicados no dispositivo (pagos e ativos) + demonstração, sem duplicados. */
export async function carregarCatalogo(): Promise<Anuncio[]> {
  try {
    const locais = await listarAnunciosLocais();
    const publicados = locais
      .filter(item => String(item.estadoPagamento || '').toLowerCase() === 'confirmado')
      .filter(item => String(item.estadoAnuncio || 'activo').toLowerCase() === 'activo')
      .map(converterAnuncioLocal);
    const ids = new Set(publicados.map(i => i.id));
    return [...publicados, ...ANUNCIOS_MOCK.filter(i => !ids.has(i.id))];
  } catch (erro) {
    console.warn('Não foi possível carregar anúncios locais do GoHome:', erro);
    return ANUNCIOS_MOCK;
  }
}
