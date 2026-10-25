/**
 * Ponto central de acesso aos formulários dinâmicos.
 * Devolve a definição do formulário consoante a categoria escolhida.
 */

import { FormularioCategoria } from './tipos';
import {
  CAMPOS_CASA,
  CAMPOS_APARTAMENTO,
  CAMPOS_QUARTO,
  CAMPOS_MORADIA,
} from './imoveis';
import {
  CAMPOS_CARRO,
  CAMPOS_MOTA,
  CAMPOS_CARRINHA_CAMIAO,
} from './veiculos';
import {
  CAMPOS_TERRENO,
  CAMPOS_LOJA,
} from './terreno-loja';
import {
  CAMPOS_ESPACO_EVENTOS,
  CAMPOS_ALOJAMENTO,
} from './eventos-alojamento';
import { CAMPOS_EQUIPAMENTO } from './equipamento';
import { CAMPOS_OUTRA, MODO_CONSTRUCTOR_PERSONALIZADO } from './outros';

// Map central — chave = ID da categoria usado em publicar.tsx
const FORMULARIOS: Record<string, FormularioCategoria> = {
  casa: CAMPOS_CASA,
  apartamento: CAMPOS_APARTAMENTO,
  quarto: CAMPOS_QUARTO,
  moradia: CAMPOS_MORADIA,
  terreno: CAMPOS_TERRENO,
  loja: CAMPOS_LOJA,
  espaco_eventos: CAMPOS_ESPACO_EVENTOS,
  alojamento: CAMPOS_ALOJAMENTO,
  carro: CAMPOS_CARRO,
  motorizada: CAMPOS_MOTA,
  carrinha_caminhao: CAMPOS_CARRINHA_CAMIAO,
  equipamento: CAMPOS_EQUIPAMENTO,
  outro: CAMPOS_OUTRA,
};

/**
 * Devolve o formulário para a categoria.
 * Devolve null se a categoria não existir.
 */
export function obterFormulario(categoriaId: string): FormularioCategoria | null {
  return FORMULARIOS[categoriaId] || null;
}

/**
 * Verifica se uma categoria tem formulário dinâmico implementado.
 */
export function temFormularioDinamico(categoriaId: string): boolean {
  return categoriaId in FORMULARIOS;
}

/**
 * Verifica se a categoria usa o constructor de campos personalizados.
 */
export function usaConstructorPersonalizado(categoriaId: string): boolean {
  return categoriaId === 'outro';
}

/**
 * Devolve apenas os campos obrigatórios de uma categoria.
 * Útil para validação antes de avançar.
 */
export function obterCamposObrigatorios(categoriaId: string): string[] {
  const formulario = obterFormulario(categoriaId);
  if (!formulario) return [];

  const obrigatorios: string[] = [];
  for (const seccao of formulario.seccoes) {
    for (const campo of seccao.campos) {
      if (campo.obrigatorio) {
        obrigatorios.push(campo.id);
      }
    }
  }
  return obrigatorios;
}

/**
 * Verifica se todos os campos obrigatórios de uma categoria estão preenchidos.
 */
export function validarCamposObrigatorios(
  categoriaId: string,
  valores: Record<string, any>
): { valido: boolean; emFalta: string[] } {
  const formulario = obterFormulario(categoriaId);
  if (!formulario) return { valido: true, emFalta: [] };

  const emFalta: string[] = [];
  for (const seccao of formulario.seccoes) {
    for (const campo of seccao.campos) {
      if (!campo.obrigatorio) continue;

      const valor = valores[campo.id];
      const vazio =
        valor === undefined ||
        valor === null ||
        valor === '' ||
        (Array.isArray(valor) && valor.length === 0);

      if (vazio) {
        emFalta.push(campo.label);
      }
    }
  }
  return { valido: emFalta.length === 0, emFalta };
}

// ============================================================
// RE-EXPORTS
// ============================================================
export * from './tipos';
export { MODO_CONSTRUCTOR_PERSONALIZADO };

export {
  CAMPOS_CASA,
  CAMPOS_APARTAMENTO,
  CAMPOS_QUARTO,
  CAMPOS_MORADIA,
  CAMPOS_TERRENO,
  CAMPOS_LOJA,
  CAMPOS_ESPACO_EVENTOS,
  CAMPOS_ALOJAMENTO,
  CAMPOS_CARRO,
  CAMPOS_MOTA,
  CAMPOS_CARRINHA_CAMIAO,
  CAMPOS_EQUIPAMENTO,
  CAMPOS_OUTRA,
};