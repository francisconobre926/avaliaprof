/**
 * Formulário dinâmico para a categoria "Outra".
 *
 * Esta categoria é especial: NÃO tem campos pré-definidos.
 * Em vez disso, o utilizador adiciona livremente pares "nome: valor".
 *
 * O componente CampoDinamico detecta este modo pela secção especial
 * com id "constructor_personalizado" e renderiza a interface do
 * constructor em vez de campos fixos.
 */

import { FormularioCategoria } from './tipos';

/**
 * Marker constante para o componente saber que esta categoria
 * usa o constructor dinâmico de campos personalizados.
 */
export const MODO_CONSTRUCTOR_PERSONALIZADO = 'constructor_personalizado';

export const CAMPOS_OUTRA: FormularioCategoria = {
  categoriaId: 'outro',
  categoriaLabel: 'Outra categoria',
  seccoes: [
    {
      titulo: 'Descreve o que estás a anunciar',
      descricao: 'Como escolheste "Outra", podes definir livremente as características do teu anúncio.',
      icone: 'lightbulb-on',
      campos: [
        {
          id: 'descricaoLivreDetalhada',
          label: 'Descrição detalhada',
          tipo: 'textarea',
          obrigatorio: true,
          dica: 'Explica o que estás a anunciar com o máximo de detalhes.',
          maxLength: 1000,
        },
      ],
    },
    {
      titulo: 'Características personalizadas',
      descricao: 'Adiciona as características que fizerem sentido para o teu anúncio.',
      icone: 'tag-multiple',
      campos: [
        {
          // Campo marker especial — o componente deve reconhecê-lo
          // e renderizar o constructor em vez de um input normal.
          id: MODO_CONSTRUCTOR_PERSONALIZADO,
          label: 'Características',
          tipo: 'texto', // Tipo irrelevante — componente trata especial
        },
      ],
    },
    {
      titulo: 'Estado e condições',
      icone: 'package-variant',
      campos: [
        {
          id: 'estadoGenerico',
          label: 'Estado',
          tipo: 'chip',
          opcoes: [
            { valor: 'novo', label: 'Novo' },
            { valor: 'semi_novo', label: 'Semi-novo' },
            { valor: 'usado', label: 'Usado' },
            { valor: 'nao_aplicavel', label: 'Não aplicável' },
          ],
        },
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
        { id: 'aceitaTroca', label: 'Aceita troca', tipo: 'switch' },
      ],
    },
  ],
};