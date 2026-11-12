/** Validadores de formulário: devolvem a mensagem de erro, ou `undefined` se válido. */
export type Erro = string | undefined;

export const validarNome = (v: string): Erro =>
  v.trim().length < 3 ? 'Indica o teu nome completo.' : undefined;

export const validarEmail = (v: string): Erro =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? undefined : 'Email inválido.';

export const validarNumeroEstudante = (v: string): Erro =>
  /^\d{6,10}$/.test(v.trim()) ? undefined : 'O número de estudante tem 6 a 10 dígitos.';

export const validarSenha = (v: string): Erro => {
  if (v.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Usa letras e números na senha.';
  return undefined;
};

export const validarObrigatorio = (v: string | undefined, msg: string): Erro =>
  v && v.trim() ? undefined : msg;

export const temErros = (erros: Record<string, Erro>): boolean => Object.values(erros).some(Boolean);

/** Normaliza para pesquisa sem acentos nem maiúsculas. */
export const normalizar = (v: string): string =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
