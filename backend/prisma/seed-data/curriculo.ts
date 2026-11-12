/**
 * Currículos de EXEMPLO (desenvolvimento). Quatro cursos, quatro anos, dois semestres, três
 * cadeiras por semestre. Os nomes seguem planos de estudo típicos mas não correspondem a
 * nenhuma universidade em concreto: substituir pelos dados reais antes de qualquer uso real.
 */
export const DEPARTAMENTOS = {
  IM: 'Informática e Matemática',
  EG: 'Economia e Gestão',
  CJ: 'Ciências Jurídicas',
} as const;
export type Dep = keyof typeof DEPARTAMENTOS;
export type Cadeira = [nome: string, departamento: Dep];

export interface Curriculo {
  curso: string;
  /** Código de dois dígitos usado nos números de estudante. */
  codigo: string;
  /** anos[ano-1][semestre-1] = cadeiras desse semestre */
  anos: Cadeira[][][];
}

export const CURRICULOS: Curriculo[] = [
  {
    curso: 'Engenharia Informática',
    codigo: '11',
    // Plano de estudos fornecido pelo curso (nomes por extenso a partir das abreviaturas).
    anos: [
      [
        [['Introdução ao Curso', 'IM'], ['Métodos de Estudo', 'IM'], ['Física 1', 'IM'], ['Análise Matemática 1', 'IM'], ['Informática 1', 'IM'], ['Inglês', 'IM'], ['Matemática Discreta', 'IM']],
        [['Análise Matemática 2', 'IM'], ['Física 2', 'IM'], ['Informática 2', 'IM'], ['Circuito Electrónico', 'IM'], ['Álgebra Linear e Geometria', 'IM'], ['Laboratório de Circuito', 'IM'], ['TELP', 'IM']],
      ],
      [
        [['Electrónica Digital', 'IM'], ['PDSI', 'IM'], ['Programação Orientada a Objectos 1', 'IM'], ['Probabilidade e Estatística', 'IM'], ['Análise Matemática 3', 'IM'], ['Bases de Dados 1', 'IM']],
        [['Programação Orientada a Objectos 2', 'IM'], ['Bases de Dados 2', 'IM'], ['Programação Web', 'IM'], ['Métodos Numéricos', 'IM'], ['Redes de Computadores', 'IM'], ['Arquitectura do Computador', 'IM']],
      ],
      [
        [['Compiladores', 'IM'], ['Elementos de Economia', 'EG'], ['Redes de Comunicação', 'IM'], ['Engenharia de Software I', 'IM'], ['Estruturas de Dados', 'IM'], ['Microprocessadores', 'IM']],
        [['Sistemas Operativos', 'IM'], ['Metodologia de Projecto', 'IM'], ['Engenharia de Software II', 'IM'], ['Programação para Redes de Computadores', 'IM'], ['Inteligência Artificial', 'IM'], ['Sistemas de Informação', 'IM']],
      ],
      [
        [['Sistemas Distribuídos', 'IM'], ['Redes sem Fio', 'IM'], ['Criptografia', 'IM'], ['Computação Gráfica', 'IM'], ['Gestão de Projectos', 'EG'], ['Integração de Redes e Sistemas', 'IM']],
        [['Engenharia e a Sociedade', 'IM'], ['Saúde e Qualidade de Vida', 'IM'], ['Empreendedorismo', 'EG'], ['Programação Móvel', 'IM'], ['Segurança Informática de Redes de Computadores', 'IM'], ['Comércio Electrónico', 'EG']],
      ],
    ],
  },
  {
    curso: 'Gestão de Empresas',
    codigo: '12',
    anos: [
      [
        [['Introdução à Gestão', 'EG'], ['Contabilidade Geral', 'EG'], ['Matemática para Gestão', 'IM']],
        [['Marketing', 'EG'], ['Microeconomia', 'EG'], ['Direito Comercial', 'CJ']],
      ],
      [
        [['Contabilidade Analítica', 'EG'], ['Estatística', 'IM'], ['Comportamento Organizacional', 'EG']],
        [['Gestão Financeira', 'EG'], ['Macroeconomia', 'EG'], ['Gestão de Recursos Humanos', 'EG']],
      ],
      [
        [['Gestão da Produção', 'EG'], ['Investigação Operacional', 'IM'], ['Marketing Digital', 'EG']],
        [['Controlo de Gestão', 'EG'], ['Gestão de Projectos', 'EG'], ['Direito Laboral', 'CJ']],
      ],
      [
        [['Estratégia Empresarial', 'EG'], ['Auditoria', 'EG'], ['Empreendedorismo', 'EG']],
        [['Gestão Internacional', 'EG'], ['Ética Empresarial', 'CJ'], ['Seminário de Gestão', 'EG']],
      ],
    ],
  },
  {
    curso: 'Economia',
    codigo: '13',
    anos: [
      [
        [['Introdução à Economia', 'EG'], ['Microeconomia', 'EG'], ['Matemática para Economia', 'IM']],
        [['Macroeconomia', 'EG'], ['Contabilidade Geral', 'EG'], ['Estatística', 'IM']],
      ],
      [
        [['Econometria I', 'IM'], ['Economia Monetária', 'EG'], ['História do Pensamento Económico', 'EG']],
        [['Economia Internacional', 'EG'], ['Finanças Públicas', 'EG'], ['Econometria II', 'IM']],
      ],
      [
        [['Economia do Desenvolvimento', 'EG'], ['Análise de Projectos', 'EG'], ['Mercados Financeiros', 'EG']],
        [['Economia Africana', 'EG'], ['Política Económica', 'EG'], ['Economia do Ambiente', 'EG']],
      ],
      [
        [['Economia Agrária', 'EG'], ['Teoria dos Jogos', 'IM'], ['Seminário de Economia', 'EG']],
        [['Projecto de Investigação', 'EG'], ['Ética Profissional', 'CJ'], ['Economia Pública', 'EG']],
      ],
    ],
  },
  {
    curso: 'Direito',
    codigo: '14',
    anos: [
      [
        [['Introdução ao Estudo do Direito', 'CJ'], ['Direito Constitucional', 'CJ'], ['Sociologia do Direito', 'CJ']],
        [['Direito Civil', 'CJ'], ['História do Direito', 'CJ'], ['Direito Internacional Público', 'CJ']],
      ],
      [
        [['Direito Penal', 'CJ'], ['Direito das Obrigações', 'CJ'], ['Direito Administrativo', 'CJ']],
        [['Direito Processual Civil', 'CJ'], ['Direito da Família', 'CJ'], ['Direito Comercial', 'CJ']],
      ],
      [
        [['Direito Processual Penal', 'CJ'], ['Direito do Trabalho', 'CJ'], ['Direito Fiscal', 'CJ']],
        [['Direito das Sucessões', 'CJ'], ['Direito dos Contratos', 'CJ'], ['Direito do Ambiente', 'CJ']],
      ],
      [
        [['Direito Internacional Privado', 'CJ'], ['Propriedade Intelectual', 'CJ'], ['Direito Notarial e Registal', 'CJ']],
        [['Deontologia Profissional', 'CJ'], ['Medicina Legal', 'CJ'], ['Seminário de Investigação Jurídica', 'CJ']],
      ],
    ],
  },
];

/** Docentes que já existiam no seed anterior (preservam-se os nomes e as cadeiras que leccionam). */
export const DOCENTES_BASE: [nome: string, departamento: Dep, cadeiras: string[]][] = [
  ['Armando Cossa', 'IM', ['Informática 1', 'Informática 2']],
  ['Beatriz Macuácua', 'IM', ['Bases de Dados 1']],
  ['Celso Tembe', 'IM', ['Programação Móvel', 'Redes de Computadores']],
  ['Dulce Nhantumbo', 'IM', ['Análise Matemática 1', 'Estatística']],
  ['Eduardo Sitoe', 'IM', ['Redes de Computadores']],
  ['Fátima Mabunda', 'IM', ['Informática 1']],
  ['Gilberto Chissano', 'IM', ['Bases de Dados 1', 'Informática 2']],
  ['Helena Muianga', 'EG', ['Contabilidade Geral']],
  ['Ivo Mondlane', 'EG', ['Marketing']],
  ['Jacinta Bila', 'EG', ['Microeconomia']],
  ['Lourenço Guambe', 'EG', ['Macroeconomia', 'Microeconomia']],
  ['Madalena Zandamela', 'EG', ['Contabilidade Geral', 'Marketing']],
  ['Nelson Machava', 'EG', ['Macroeconomia']],
  ['Olga Cuamba', 'CJ', ['Direito Civil']],
  ['Paulo Matsinhe', 'CJ', ['Direito Penal']],
  ['Quitéria Langa', 'CJ', ['Direito Constitucional', 'Direito Civil']],
  ['Rui Manhiça', 'CJ', ['Direito Penal', 'Direito Constitucional']],
  ['Sandra Uamusse', 'IM', ['Estatística']],
  ['Tomás Mucavele', 'IM', ['Programação Móvel']],
  ['Úrsula Fumo', 'EG', ['Microeconomia']],
  ['Vasco Nhaca', 'CJ', ['Direito Civil']],
  ['Wilson Tivane', 'IM', ['Análise Matemática 1']],
  ['Xadreque Massingue', 'EG', ['Macroeconomia']],
  ['Yara Cumbe', 'IM', ['Informática 1', 'Programação Móvel']],
];

/**
 * Cadeiras do plano antigo de exemplo que passam a ter o nome do plano real. Renomeia-se a cadeira
 * existente (mesmo id) em vez de apagar e criar, para não perder avaliações, docentes nem matrículas.
 */
export const RENOMEACOES: [departamento: Dep, antigo: string, novo: string][] = [
  ['IM', 'Programação I', 'Informática 1'],
  ['IM', 'Programação II', 'Informática 2'],
  ['IM', 'Análise Matemática I', 'Análise Matemática 1'],
  ['IM', 'Análise Matemática II', 'Análise Matemática 2'],
  ['IM', 'Álgebra Linear', 'Álgebra Linear e Geometria'],
  ['IM', 'Arquitectura de Computadores', 'Arquitectura do Computador'],
  ['IM', 'Bases de Dados', 'Bases de Dados 1'],
  ['IM', 'Probabilidades e Estatística', 'Probabilidade e Estatística'],
  ['IM', 'Engenharia de Software', 'Engenharia de Software I'],
  ['IM', 'Programação em Dispositivos Móveis', 'Programação Móvel'],
  ['IM', 'Segurança Informática', 'Segurança Informática de Redes de Computadores'],
];
