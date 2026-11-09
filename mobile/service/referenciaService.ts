/**
 * Programa de referência.
 *
 * API esperada: GET /referencia → estado   ·   PUT /referencia → grava   ·   DELETE /referencia → reset
 */
import { criarRecurso } from './recurso';

export const referenciaService = criarRecurso<Record<string, any>>({
  chave: '@gohome_referencia_v2',
  endpoint: '/referencia',
  nome: 'referencia',
});
