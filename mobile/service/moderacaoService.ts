/**
 * Moderação: denúncias, avisos da plataforma e suspensão.
 *
 * API esperada: GET/PUT /moderacao/denuncias · /moderacao/avisos · /moderacao/suspensao
 */
import { criarRecurso } from './recurso';

const denuncias = criarRecurso<any[]>({ chave: '@gohome_moderacao_denuncias', endpoint: '/moderacao/denuncias', nome: 'moderacao.denuncias' });
const avisos = criarRecurso<any[]>({ chave: '@gohome_moderacao_avisos', endpoint: '/moderacao/avisos', nome: 'moderacao.avisos' });
const suspensao = criarRecurso<any>({ chave: '@gohome_moderacao_suspensao', endpoint: '/moderacao/suspensao', nome: 'moderacao.suspensao' });

export const moderacaoService = {
  async carregar() {
    const [d, a, s] = await Promise.all([denuncias.carregar(), avisos.carregar(), suspensao.carregar()]);
    return {
      denuncias: Array.isArray(d) ? d : [],
      avisos: Array.isArray(a) ? a : [],
      suspensao: s && typeof s === 'object' ? s : null,
    };
  },
  guardarDenuncias: (v: any[]) => denuncias.guardar(v),
  guardarAvisos: (v: any[]) => avisos.guardar(v),
  guardarSuspensao: (v: any | null) => (v ? suspensao.guardar(v) : suspensao.limpar()),
  async limpar() {
    await Promise.all([denuncias.limpar(), avisos.limpar(), suspensao.limpar()]);
  },
};
