/**
 * Anúncios guardados ("Salvos").
 *
 * API esperada:
 *   GET /favoritos → string[] (ids)   ·   PUT /favoritos → grava a lista completa
 */
import { criarRecurso } from './recurso';

const recurso = criarRecurso<string[]>({ chave: '@gohome_favoritos_v1', endpoint: '/favoritos', nome: 'favoritos' });

export const favoritosService = {
  async listar(): Promise<string[]> {
    const lista = await recurso.carregar();
    return Array.isArray(lista) ? lista.map(String) : [];
  },
  guardar: (ids: string[]) => recurso.guardar(ids),
};
