import axios from 'axios';

/** Erro de negócio com código estável, para a UI mostrar mensagens claras. */
export class ErroServico extends Error {
  constructor(public codigo: string, mensagem: string) {
    super(mensagem);
  }
}

/** Converte qualquer falha de rede/HTTP num `ErroServico` com mensagem legível. */
export function traduzirErro(e: unknown): ErroServico {
  if (e instanceof ErroServico) return e;
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      return new ErroServico('SEM_REDE', 'Sem ligação ao servidor. Verifica a internet e tenta novamente.');
    }
    const corpo = e.response.data as { code?: string; message?: string | string[] } | undefined;
    const msg = Array.isArray(corpo?.message) ? corpo?.message[0] : corpo?.message;
    if (e.response.status === 429) return new ErroServico('DEMASIADOS_PEDIDOS', 'Demasiadas tentativas. Aguarda um minuto.');
    if (e.response.status >= 500) return new ErroServico('SERVIDOR', 'O servidor não está a responder. Tenta mais tarde.');
    return new ErroServico(corpo?.code ?? `HTTP_${e.response.status}`, msg ?? 'Pedido inválido.');
  }
  return new ErroServico('DESCONHECIDO', 'Algo correu mal. Tenta novamente.');
}
