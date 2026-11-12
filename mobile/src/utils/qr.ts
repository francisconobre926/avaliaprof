/** Leitura do conteúdo de um QR Code da AvaliaProf (função pura, sem rede). */

export type AlvoQr = { tipo: 'professor' | 'sessao'; valor: string };

const PADRAO = /^avaliaprof:\/\/qr\/(professor|sessao)\/([A-Za-z0-9_-]{10,40})\/?$/;

/** Extrai o alvo de um conteúdo lido; devolve null se não for um QR da AvaliaProf. */
export function interpretarQr(conteudo: string): AlvoQr | null {
  const m = PADRAO.exec(conteudo.trim());
  return m ? { tipo: m[1] as AlvoQr['tipo'], valor: m[2] } : null;
}
