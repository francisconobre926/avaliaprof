/**
 * Tipos base do sistema de campos dinâmicos por categoria
 * DDR 1.2 — GoHome
 */

export type TipoDeCampo =
  | 'texto'          // Input de texto curto
  | 'textarea'       // Área de texto grande
  | 'numero'         // Input numérico
  | 'chip'           // Grupo de chips — escolha única
  | 'chip_multi'     // Grupo de chips — múltipla escolha
  | 'switch'         // Toggle on/off
  | 'contador'       // Botões +/-
  | 'select';        // Dropdown (lista fechada)

export interface OpcaoCampo {
  valor: string;
  label: string;
  icone?: string;    // Material Community Icons name
}

export interface DefinicaoCampo {
  /** Identificador único do campo (chave no estado) */
  id: string;
  /** Nome visível ao utilizador */
  label: string;
  /** Dica/placeholder */
  dica?: string;
  /** Tipo de input */
  tipo: TipoDeCampo;
  /** Se obrigatório para avançar */
  obrigatorio?: boolean;
  /** Valor por defeito */
  valorInicial?: any;
  /** Opções (para chip, chip_multi, select) */
  opcoes?: OpcaoCampo[];
  /** Limites para número e contador */
  min?: number;
  max?: number;
  /** Sufixo visual (ex: "m²", "MT", "km") */
  sufixo?: string;
  /** Ícone material community para destacar o campo */
  icone?: string;
  /** Permite inserir vírgula/ponto decimal */
  permiteDecimais?: boolean;
  /** Comprimento máximo (texto/textarea) */
  maxLength?: number;
}

export interface SeccaoCampos {
  /** Título da secção (ex: "Características do veículo") */
  titulo: string;
  /** Descrição opcional sob o título */
  descricao?: string;
  /** Ícone material community para o cabeçalho da secção */
  icone?: string;
  /** Campos desta secção */
  campos: DefinicaoCampo[];
}

export interface FormularioCategoria {
  /** ID da categoria (igual ao `tipo` em publicar.tsx) */
  categoriaId: string;
  /** Rótulo da categoria */
  categoriaLabel: string;
  /** Secções do formulário desta categoria */
  seccoes: SeccaoCampos[];
}

/**
 * Estado dos campos dinâmicos — chaveado por id do campo.
 * Ex: { marca: "Toyota", ano: 2020, mobilado: true, portas: ["4"] }
 */
export type EstadoCamposDinamicos = Record<string, any>;

/**
 * Campo personalizado (para a categoria "outra").
 * O utilizador adiciona nome + valor dinamicamente.
 */
export interface CampoPersonalizado {
  id: string;         // UUID local
  nome: string;       // Ex: "Peso"
  valor: string;      // Ex: "5 kg"
}