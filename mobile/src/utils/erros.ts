export const mensagemErro = (e: unknown): string =>
  e instanceof Error && e.message ? e.message : 'Algo correu mal. Tenta novamente.';
