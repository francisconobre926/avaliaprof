/**
 * Formulários dinâmicos para:
 * - terreno
 * - loja / espaço comercial
 */

import { FormularioCategoria } from './tipos';

// ============================================================
// TERRENO
// ============================================================
export const CAMPOS_TERRENO: FormularioCategoria = {
  categoriaId: 'terreno',
  categoriaLabel: 'Terreno',
  seccoes: [
    {
      titulo: 'Dimensões',
      icone: 'ruler-square',
      campos: [
        {
          id: 'area',
          label: 'Área total',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 500',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
        {
          id: 'frente',
          label: 'Frente (opcional)',
          tipo: 'numero',
          dica: 'Ex: 20',
          sufixo: 'm',
        },
        {
          id: 'comprimento',
          label: 'Comprimento (opcional)',
          tipo: 'numero',
          dica: 'Ex: 25',
          sufixo: 'm',
        },
        {
          id: 'formato',
          label: 'Formato',
          tipo: 'chip',
          opcoes: [
            { valor: 'regular', label: 'Regular' },
            { valor: 'irregular', label: 'Irregular' },
            { valor: 'esquina', label: 'Esquina' },
          ],
        },
      ],
    },
    {
      titulo: 'Classificação',
      icone: 'map',
      campos: [
        {
          id: 'tipoTerreno',
          label: 'Tipo de terreno',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'urbano', label: 'Urbano' },
            { valor: 'suburbano', label: 'Suburbano' },
            { valor: 'rural', label: 'Rural' },
            { valor: 'agricola', label: 'Agrícola' },
            { valor: 'industrial', label: 'Industrial' },
            { valor: 'misto', label: 'Misto' },
          ],
        },
        {
          id: 'finalidadePermitida',
          label: 'Finalidade',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'habitacao', label: 'Habitação' },
            { valor: 'comercio', label: 'Comércio' },
            { valor: 'industria', label: 'Indústria' },
            { valor: 'agricultura', label: 'Agricultura' },
            { valor: 'turismo', label: 'Turismo' },
          ],
        },
        {
          id: 'topografia',
          label: 'Topografia',
          tipo: 'chip',
          opcoes: [
            { valor: 'plano', label: 'Plano' },
            { valor: 'declive_suave', label: 'Declive suave' },
            { valor: 'declive_acentuado', label: 'Declive acentuado' },
            { valor: 'rochoso', label: 'Rochoso' },
          ],
        },
      ],
    },
    {
      titulo: 'Documentação',
      descricao: 'Importante para compradores — demonstra legalidade',
      icone: 'file-document',
      campos: [
        {
          id: 'documentacao',
          label: 'Documentação disponível',
          tipo: 'chip_multi',
          obrigatorio: true,
          opcoes: [
            { valor: 'duat', label: 'DUAT' },
            { valor: 'titulo', label: 'Título definitivo' },
            { valor: 'promessa', label: 'Contrato promessa' },
            { valor: 'autorizacao', label: 'Autorização de uso' },
            { valor: 'planta', label: 'Planta aprovada' },
            { valor: 'sem_documentos', label: 'Sem documentos' },
          ],
        },
        {
          id: 'estadoDuat',
          label: 'Estado do DUAT (se aplicável)',
          tipo: 'chip',
          opcoes: [
            { valor: 'definitivo', label: 'Definitivo' },
            { valor: 'provisorio', label: 'Provisório' },
            { valor: 'em_regularizacao', label: 'Em regularização' },
            { valor: 'nao_aplicavel', label: 'Não aplicável' },
          ],
        },
        {
          id: 'registoPredial',
          label: 'Com registo predial',
          tipo: 'switch',
        },
      ],
    },
    {
      titulo: 'Infra-estruturas',
      icone: 'power-plug',
      campos: [
        { id: 'acessoAgua', label: 'Acesso a água', tipo: 'switch', icone: 'water' },
        { id: 'acessoLuz', label: 'Acesso a electricidade', tipo: 'switch', icone: 'flash' },
        { id: 'furo', label: 'Furo próprio', tipo: 'switch', icone: 'water-pump' },
        { id: 'saneamento', label: 'Saneamento', tipo: 'switch' },
        { id: 'estradaAsfaltada', label: 'Estrada asfaltada', tipo: 'switch', icone: 'road' },
        { id: 'acessivelCarros', label: 'Acessível a carros', tipo: 'switch', valorInicial: true },
      ],
    },
    {
      titulo: 'Características do terreno',
      icone: 'tree',
      campos: [
        { id: 'muroVedacao', label: 'Muro ou vedação', tipo: 'switch', icone: 'fence' },
        { id: 'arvores', label: 'Com árvores de fruta', tipo: 'switch' },
        { id: 'construcoes', label: 'Com construções existentes', tipo: 'switch' },
        { id: 'poco', label: 'Poço de água', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Negociação',
      icone: 'handshake',
      campos: [
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
        { id: 'parcelamento', label: 'Aceita parcelamento', tipo: 'switch' },
        { id: 'aceitaTroca', label: 'Aceita troca', tipo: 'switch' },
      ],
    },
  ],
};

// ============================================================
// LOJA / ESPAÇO COMERCIAL
// ============================================================
export const CAMPOS_LOJA: FormularioCategoria = {
  categoriaId: 'loja',
  categoriaLabel: 'Loja / espaço comercial',
  seccoes: [
    {
      titulo: 'Área e divisões',
      icone: 'ruler-square',
      campos: [
        {
          id: 'area',
          label: 'Área',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 80',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
        {
          id: 'divisoes',
          label: 'Nº de divisões',
          tipo: 'contador',
          valorInicial: 1,
          min: 1,
          max: 20,
        },
        {
          id: 'pDireito',
          label: 'Pé direito (opcional)',
          tipo: 'numero',
          dica: 'Ex: 3',
          sufixo: 'm',
        },
        { id: 'casaBanho', label: 'Casa de banho', tipo: 'switch', icone: 'shower' },
        { id: 'copa', label: 'Copa / zona cozinha', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Tipo de espaço',
      icone: 'store',
      campos: [
        {
          id: 'tipoEspaco',
          label: 'Tipo',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'loja', label: 'Loja' },
            { valor: 'escritorio', label: 'Escritório' },
            { valor: 'armazem', label: 'Armazém' },
            { valor: 'misto', label: 'Misto' },
            { valor: 'oficina', label: 'Oficina' },
            { valor: 'restaurante', label: 'Restaurante / bar' },
            { valor: 'clinica', label: 'Clínica / consultório' },
          ],
        },
        {
          id: 'sectorRecomendado',
          label: 'Melhor para sector',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'retalho', label: 'Retalho' },
            { valor: 'servicos', label: 'Serviços' },
            { valor: 'alimentacao', label: 'Alimentação' },
            { valor: 'saude', label: 'Saúde' },
            { valor: 'educacao', label: 'Educação' },
            { valor: 'armazenamento', label: 'Armazenamento' },
          ],
        },
      ],
    },
    {
      titulo: 'Localização estratégica',
      icone: 'map-marker',
      campos: [
        {
          id: 'tipoZona',
          label: 'Tipo de zona',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'centro_cidade', label: 'Centro da cidade' },
            { valor: 'mercado', label: 'Próximo a mercado' },
            { valor: 'universidade', label: 'Zona universitária' },
            { valor: 'residencial', label: 'Residencial' },
            { valor: 'industrial', label: 'Industrial' },
            { valor: 'turistica', label: 'Turística' },
            { valor: 'litoral', label: 'Litoral / marginal' },
          ],
        },
        { id: 'frenteRua', label: 'Com frente para a rua', tipo: 'switch', valorInicial: true },
        { id: 'visibilidade', label: 'Alta visibilidade', tipo: 'switch' },
        {
          id: 'piso',
          label: 'Piso (se aplicável)',
          tipo: 'chip',
          opcoes: [
            { valor: 'reschao', label: 'Rés-do-chão' },
            { valor: '1_andar', label: '1º andar' },
            { valor: '2_andar', label: '2º andar' },
            { valor: 'outro', label: 'Outro' },
          ],
        },
      ],
    },
    {
      titulo: 'Infra-estruturas',
      icone: 'power-plug',
      campos: [
        { id: 'agua', label: 'Água canalizada', tipo: 'switch', valorInicial: true, icone: 'water' },
        { id: 'energia', label: 'Energia eléctrica', tipo: 'switch', valorInicial: true, icone: 'flash' },
        { id: 'energiaTrifasica', label: 'Energia trifásica', tipo: 'switch' },
        { id: 'wifi', label: 'Wi-Fi / fibra', tipo: 'switch', icone: 'wifi' },
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', icone: 'air-conditioner' },
        { id: 'gerador', label: 'Gerador', tipo: 'switch' },
        { id: 'segurancaFogo', label: 'Sistema contra incêndio', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Equipamento incluído',
      icone: 'package-variant',
      campos: [
        {
          id: 'equipamentoIncluido',
          label: 'O que está incluído',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'mobiliario', label: 'Mobiliário' },
            { valor: 'prateleiras', label: 'Prateleiras' },
            { valor: 'balcao', label: 'Balcão / caixa' },
            { valor: 'cameras', label: 'Câmaras CCTV' },
            { valor: 'alarme', label: 'Alarme' },
            { valor: 'cofre', label: 'Cofre' },
            { valor: 'equip_cozinha', label: 'Equipamento de cozinha' },
            { valor: 'vazio', label: 'Nada incluído (vazio)' },
          ],
        },
      ],
    },
    {
      titulo: 'Estacionamento e acesso',
      icone: 'car',
      campos: [
        { id: 'estacionamentoProprio', label: 'Estacionamento próprio', tipo: 'switch' },
        { id: 'estacionamentoNaRua', label: 'Estacionamento na rua', tipo: 'switch' },
        { id: 'acessoCarga', label: 'Acesso para carga/descarga', tipo: 'switch' },
        { id: 'acessivelDeficientes', label: 'Acessível a deficientes', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Encargos',
      icone: 'cash',
      campos: [
        { id: 'condominio', label: 'Com condomínio', tipo: 'switch' },
        { id: 'iptIncluido', label: 'IPT / imposto incluído', tipo: 'switch' },
        { id: 'cauçaoNecessaria', label: 'Caução necessária', tipo: 'switch' },
      ],
    },
  ],
};