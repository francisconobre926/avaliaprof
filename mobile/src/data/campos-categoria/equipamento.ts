/**
 * Formulário dinâmico para:
 * - equipamento (máquinas, ferramentas, electrónicos)
 */

import { FormularioCategoria } from './tipos';

export const CAMPOS_EQUIPAMENTO: FormularioCategoria = {
  categoriaId: 'equipamento',
  categoriaLabel: 'Equipamentos',
  seccoes: [
    {
      titulo: 'Identificação',
      icone: 'tools',
      campos: [
        {
          id: 'nomeEquipamento',
          label: 'Nome do equipamento',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Furadeira, Gerador, Computador portátil',
          maxLength: 80,
          icone: 'tag',
        },
        {
          id: 'marca',
          label: 'Marca',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Bosch, Dell, Honda',
          maxLength: 50,
        },
        {
          id: 'modelo',
          label: 'Modelo',
          tipo: 'texto',
          dica: 'Ex: GSB 13 RE',
          maxLength: 60,
        },
        {
          id: 'numeroSerie',
          label: 'Nº de série (opcional)',
          tipo: 'texto',
          dica: 'Útil para originalidade',
          maxLength: 50,
        },
      ],
    },
    {
      titulo: 'Categoria do equipamento',
      icone: 'shape',
      campos: [
        {
          id: 'categoriaEquipamento',
          label: 'Categoria',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'ferramentas', label: 'Ferramentas' },
            { valor: 'informatica', label: 'Informática' },
            { valor: 'electronica', label: 'Electrónica' },
            { valor: 'electrodomestico', label: 'Electrodoméstico' },
            { valor: 'maquina_industrial', label: 'Máquina industrial' },
            { valor: 'maquina_agricola', label: 'Máquina agrícola' },
            { valor: 'maquina_construcao', label: 'Máquina de construção' },
            { valor: 'som_imagem', label: 'Som e imagem' },
            { valor: 'desporto', label: 'Desporto / fitness' },
            { valor: 'medico', label: 'Médico / hospitalar' },
            { valor: 'outros', label: 'Outros' },
          ],
        },
      ],
    },
    {
      titulo: 'Idade e estado',
      icone: 'calendar',
      campos: [
        {
          id: 'anoFabrico',
          label: 'Ano de fabrico',
          tipo: 'numero',
          dica: 'Ex: 2022',
          min: 1980,
          max: 2030,
          icone: 'calendar',
        },
        {
          id: 'idadeUso',
          label: 'Tempo de uso',
          tipo: 'chip',
          opcoes: [
            { valor: 'novo', label: 'Novo (zero uso)' },
            { valor: 'menos_1_ano', label: 'Menos de 1 ano' },
            { valor: '1_3_anos', label: '1 a 3 anos' },
            { valor: '3_5_anos', label: '3 a 5 anos' },
            { valor: 'mais_5_anos', label: 'Mais de 5 anos' },
          ],
        },
        {
          id: 'estado',
          label: 'Estado',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'novo_lacrado', label: 'Novo lacrado' },
            { valor: 'novo_sem_caixa', label: 'Novo sem caixa' },
            { valor: 'semi_novo', label: 'Semi-novo' },
            { valor: 'usado_bom', label: 'Usado — bom' },
            { valor: 'usado_razoavel', label: 'Usado — razoável' },
            { valor: 'para_reparacao', label: 'Para reparação' },
            { valor: 'para_pecas', label: 'Para peças' },
          ],
        },
        { id: 'funcional', label: 'Totalmente funcional', tipo: 'switch', valorInicial: true },
      ],
    },
    {
      titulo: 'Especificações técnicas',
      icone: 'cog',
      campos: [
        {
          id: 'potencia',
          label: 'Potência (opcional)',
          tipo: 'texto',
          dica: 'Ex: 1500 W, 3 KVA',
          maxLength: 30,
        },
        {
          id: 'tensao',
          label: 'Tensão (opcional)',
          tipo: 'chip',
          opcoes: [
            { valor: '220v', label: '220 V' },
            { valor: '110v', label: '110 V' },
            { valor: '380v', label: '380 V (trifásica)' },
            { valor: 'bateria', label: 'Bateria' },
            { valor: 'combustivel', label: 'Combustível' },
          ],
        },
        {
          id: 'especificacoes',
          label: 'Outras especificações (opcional)',
          tipo: 'textarea',
          dica: 'Dimensões, peso, capacidade, memória, etc.',
          maxLength: 400,
        },
      ],
    },
    {
      titulo: 'Documentação e garantia',
      icone: 'file-document',
      campos: [
        { id: 'temGarantia', label: 'Com garantia', tipo: 'switch' },
        {
          id: 'duracaoGarantia',
          label: 'Duração da garantia',
          tipo: 'chip',
          opcoes: [
            { valor: 'sem_garantia', label: 'Sem garantia' },
            { valor: '3_meses', label: '3 meses' },
            { valor: '6_meses', label: '6 meses' },
            { valor: '1_ano', label: '1 ano' },
            { valor: '2_anos', label: '2 anos' },
            { valor: '3_anos_mais', label: '3+ anos' },
          ],
        },
        { id: 'fatura', label: 'Com factura original', tipo: 'switch' },
        { id: 'manuais', label: 'Com manuais', tipo: 'switch' },
        { id: 'caixaOriginal', label: 'Com caixa original', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Acessórios incluídos',
      icone: 'package-variant',
      campos: [
        {
          id: 'acessorios',
          label: 'Acessórios',
          tipo: 'textarea',
          dica: 'Lista o que vem com o equipamento. Ex: 2 baterias, carregador, mala de transporte',
          maxLength: 400,
        },
        {
          id: 'quantidadeAcessorios',
          label: 'Nº de acessórios',
          tipo: 'contador',
          valorInicial: 0,
          min: 0,
          max: 50,
        },
      ],
    },
    {
      titulo: 'Entrega e negociação',
      icone: 'truck-delivery',
      campos: [
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
        { id: 'aceitaTroca', label: 'Aceita troca', tipo: 'switch' },
        {
          id: 'entrega',
          label: 'Entrega',
          tipo: 'chip',
          opcoes: [
            { valor: 'levantamento', label: 'Só levantamento' },
            { valor: 'cidade_entrega', label: 'Entrega na cidade' },
            { valor: 'entrega_nacional', label: 'Entrega nacional' },
            { valor: 'ambos', label: 'Ambos' },
          ],
        },
        { id: 'testavel', label: 'Pode ser testado antes', tipo: 'switch', valorInicial: true },
      ],
    },
  ],
};