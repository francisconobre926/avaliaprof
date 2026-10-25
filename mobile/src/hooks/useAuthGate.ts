/**
 * src/hooks/useAuthGate.ts
 *
 * Hook público usado pelas páginas para proteger acções que exigem conta.
 *
 * Uso típico:
 *
 *   const { requerConta } = useAuthGate();
 *
 *   // Em qualquer handler:
 *   const abrirDetalhes = (id: string) => {
 *     requerConta('ver_detalhes', () => {
 *       router.push(`/anuncio/${id}`);
 *     });
 *   };
 *
 * Se o utilizador está autenticado → o callback é executado imediatamente.
 * Se o utilizador é convidado → o modal abre, guarda o callback, e após o
 * registo/login o callback é executado automaticamente.
 */

import { useUserStore } from '../store/userStore';
import { useAuthGateStore, MotivoGate } from '../store/authGateStore';

export function useAuthGate() {
  const estaAutenticado = useUserStore(s => s.estaAutenticado);
  const abrirGate = useAuthGateStore(s => s.abrir);

  /**
   * Verifica se o utilizador pode executar a acção.
   * - Se autenticado: executa o callback imediatamente
   * - Se convidado: abre o modal pedindo registo/login (callback será
   *   executado automaticamente após sucesso do registo/login)
   */
  const requerConta = (motivo: MotivoGate, callback: () => void) => {
    if (estaAutenticado()) {
      callback();
    } else {
      abrirGate(motivo, callback);
    }
  };

  /**
   * Versão booleana — retorna true se autenticado, false se abriu o gate.
   * Útil quando queres fazer early return no handler.
   *
   * Exemplo:
   *   if (!verificarAutenticacao('favoritar')) return;
   *   // continua a lógica apenas se autenticado
   *   adicionarFavorito(id);
   */
  const verificarAutenticacao = (motivo: MotivoGate): boolean => {
    if (estaAutenticado()) return true;
    abrirGate(motivo, () => {});
    return false;
  };

  return {
    requerConta,
    verificarAutenticacao,
    estaAutenticado: estaAutenticado(),
  };
}