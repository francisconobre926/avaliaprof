/**
 * @deprecated Use `anunciosService` (service/anunciosService.ts).
 * Mantido só para compatibilidade com imports antigos.
 */
import { Anuncio } from '../types';
import { anunciosService, converterAnuncioLocal } from '../../service/anunciosService';

export { converterAnuncioLocal };

export async function carregarCatalogo(): Promise<Anuncio[]> {
  return (await anunciosService.listar()).dados;
}
