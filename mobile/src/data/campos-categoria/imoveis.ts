/**
 * Formulários dinâmicos para categorias de imóveis:
 * - casa
 * - apartamento
 * - quarto
 * - moradia
 */

import { FormularioCategoria } from './tipos';

// ============================================================
// CASA
// ============================================================
export const CAMPOS_CASA: FormularioCategoria = {
  categoriaId: 'casa',
  categoriaLabel: 'Casa',
  seccoes: [
    {
      titulo: 'Divisões e área',
      icone: 'floor-plan',
      campos: [
        {
          id: 'quartos',
          label: 'Quartos',
          tipo: 'contador',
          obrigatorio: true,
          valorInicial: 1,
          min: 0,
          max: 20,
          icone: 'bed',
        },
        {
          id: 'casasBanho',
          label: 'Casas de banho',
          tipo: 'contador',
          valorInicial: 1,
          min: 0,
          max: 10,
          icone: 'shower',
        },
        {
          id: 'salas',
          label: 'Salas',
          tipo: 'contador',
          valorInicial: 1,
          min: 0,
          max: 5,
          icone: 'sofa',
        },
        {
          id: 'area',
          label: 'Área total',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 120',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
        {
          id: 'areaTerreno',
          label: 'Área do terreno (opcional)',
          tipo: 'numero',
          dica: 'Ex: 300',
          sufixo: 'm²',
        },
      ],
    },
    {
      titulo: 'Estado e condição',
      icone: 'home-outline',
      campos: [
        {
          id: 'estadoCasa',
          label: 'Estado da casa',
          tipo: 'chip',
          opcoes: [
            { valor: 'nova', label: 'Nova' },
            { valor: 'reformada', label: 'Reformada' },
            { valor: 'usada', label: 'Usada' },
            { valor: 'precisa_obras', label: 'Precisa de obras' },
          ],
        },
        {
          id: 'anoConstrucao',
          label: 'Ano de construção (opcional)',
          tipo: 'numero',
          dica: 'Ex: 2018',
          min: 1900,
          max: 2030,
        },
      ],
    },
    {
      titulo: 'Comodidades',
      icone: 'star-outline',
      campos: [
        { id: 'mobilado', label: 'Mobilado', tipo: 'switch', icone: 'sofa' },
        { id: 'agua', label: 'Água canalizada', tipo: 'switch', valorInicial: true, icone: 'water' },
        { id: 'energia', label: 'Energia eléctrica', tipo: 'switch', valorInicial: true, icone: 'flash' },
        { id: 'wifi', label: 'Wi-Fi incluído', tipo: 'switch', icone: 'wifi' },
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', icone: 'air-conditioner' },
        { id: 'aquecedorSolar', label: 'Aquecedor solar', tipo: 'switch', icone: 'solar-power' },
      ],
    },
    {
      titulo: 'Exterior',
      icone: 'tree-outline',
      campos: [
        { id: 'estacionamento', label: 'Estacionamento', tipo: 'switch', icone: 'car' },
        { id: 'jardim', label: 'Jardim / quintal', tipo: 'switch', icone: 'flower' },
        { id: 'piscina', label: 'Piscina', tipo: 'switch', icone: 'pool' },
        { id: 'muroVedacao', label: 'Muro ou vedação', tipo: 'switch', icone: 'fence' },
        { id: 'portao', label: 'Portão eléctrico', tipo: 'switch', icone: 'gate' },
      ],
    },
    {
      titulo: 'Segurança',
      icone: 'shield-outline',
      campos: [
        { id: 'guardaNoturno', label: 'Guarda nocturno na zona', tipo: 'switch' },
        { id: 'alarme', label: 'Sistema de alarme', tipo: 'switch' },
        { id: 'camaras', label: 'Câmaras de vigilância', tipo: 'switch' },
      ],
    },
  ],
};

// ============================================================
// APARTAMENTO
// ============================================================
export const CAMPOS_APARTAMENTO: FormularioCategoria = {
  categoriaId: 'apartamento',
  categoriaLabel: 'Apartamento',
  seccoes: [
    {
      titulo: 'Divisões e área',
      icone: 'floor-plan',
      campos: [
        {
          id: 'quartos',
          label: 'Quartos',
          tipo: 'contador',
          obrigatorio: true,
          valorInicial: 1,
          min: 0,
          max: 10,
          icone: 'bed',
        },
        {
          id: 'casasBanho',
          label: 'Casas de banho',
          tipo: 'contador',
          valorInicial: 1,
          min: 0,
          max: 5,
          icone: 'shower',
        },
        {
          id: 'area',
          label: 'Área',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 75',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
      ],
    },
    {
      titulo: 'Localização no edifício',
      icone: 'office-building',
      campos: [
        {
          id: 'andar',
          label: 'Andar',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 4',
          min: 0,
          max: 50,
          icone: 'stairs',
        },
        { id: 'elevador', label: 'Elevador', tipo: 'switch', icone: 'elevator' },
        {
          id: 'vista',
          label: 'Vista',
          tipo: 'chip',
          opcoes: [
            { valor: 'mar', label: 'Mar' },
            { valor: 'cidade', label: 'Cidade' },
            { valor: 'rua', label: 'Rua' },
            { valor: 'interior', label: 'Interior' },
          ],
        },
      ],
    },
    {
      titulo: 'Comodidades',
      icone: 'star-outline',
      campos: [
        { id: 'mobilado', label: 'Mobilado', tipo: 'switch', icone: 'sofa' },
        { id: 'agua', label: 'Água canalizada', tipo: 'switch', valorInicial: true, icone: 'water' },
        { id: 'energia', label: 'Energia eléctrica', tipo: 'switch', valorInicial: true, icone: 'flash' },
        { id: 'wifi', label: 'Wi-Fi incluído', tipo: 'switch', icone: 'wifi' },
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', icone: 'air-conditioner' },
        { id: 'varanda', label: 'Varanda', tipo: 'switch', icone: 'balcony' },
        { id: 'cozinhaEquipada', label: 'Cozinha equipada', tipo: 'switch', icone: 'stove' },
      ],
    },
    {
      titulo: 'Edifício',
      icone: 'city',
      campos: [
        { id: 'estacionamento', label: 'Lugar de estacionamento', tipo: 'switch', icone: 'car' },
        { id: 'arrumos', label: 'Arrumos', tipo: 'switch', icone: 'package' },
        { id: 'piscinaComum', label: 'Piscina comum', tipo: 'switch', icone: 'pool' },
        { id: 'ginasio', label: 'Ginásio', tipo: 'switch', icone: 'dumbbell' },
        { id: 'portaria', label: 'Portaria 24h', tipo: 'switch', icone: 'account-tie' },
      ],
    },
  ],
};

// ============================================================
// QUARTO
// ============================================================
export const CAMPOS_QUARTO: FormularioCategoria = {
  categoriaId: 'quarto',
  categoriaLabel: 'Quarto',
  seccoes: [
    {
      titulo: 'Tipo de quarto',
      icone: 'bed',
      campos: [
        {
          id: 'tipoQuarto',
          label: 'Tipo',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'individual', label: 'Individual' },
            { valor: 'duplo', label: 'Duplo' },
            { valor: 'suite', label: 'Suite' },
            { valor: 'partilhado', label: 'Partilhado' },
          ],
        },
        {
          id: 'area',
          label: 'Área do quarto',
          tipo: 'numero',
          dica: 'Ex: 12',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
      ],
    },
    {
      titulo: 'Casa de banho',
      icone: 'shower',
      campos: [
        {
          id: 'wcPrivativo',
          label: 'Casa de banho privativa',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'privativa', label: 'Privativa' },
            { valor: 'partilhada', label: 'Partilhada' },
          ],
        },
      ],
    },
    {
      titulo: 'Mobília e extras',
      icone: 'sofa',
      campos: [
        { id: 'mobilado', label: 'Mobilado', tipo: 'switch', valorInicial: true, icone: 'sofa' },
        { id: 'cama', label: 'Cama incluída', tipo: 'switch', valorInicial: true, icone: 'bed' },
        { id: 'secretaria', label: 'Secretária', tipo: 'switch', icone: 'desk' },
        { id: 'armario', label: 'Armário', tipo: 'switch', icone: 'wardrobe' },
        { id: 'wifi', label: 'Wi-Fi', tipo: 'switch', icone: 'wifi' },
        { id: 'ventilador', label: 'Ventilador / AC', tipo: 'switch', icone: 'fan' },
      ],
    },
    {
      titulo: 'Serviços incluídos',
      icone: 'room-service',
      campos: [
        { id: 'limpezaIncluida', label: 'Limpeza', tipo: 'switch' },
        { id: 'roupaCamaIncluida', label: 'Roupa de cama', tipo: 'switch' },
        { id: 'refeicoesIncluidas', label: 'Refeições incluídas', tipo: 'switch' },
        { id: 'contasIncluidas', label: 'Água/luz incluídas', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Preferências do inquilino',
      descricao: 'Opcional — ajuda a filtrar candidatos',
      icone: 'account-check',
      campos: [
        {
          id: 'preferenciaGenero',
          label: 'Preferência de género',
          tipo: 'chip',
          opcoes: [
            { valor: 'sem_preferencia', label: 'Sem preferência' },
            { valor: 'mulheres', label: 'Só mulheres' },
            { valor: 'homens', label: 'Só homens' },
          ],
        },
        {
          id: 'preferenciaOcupacao',
          label: 'Ocupação preferida',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'estudantes', label: 'Estudantes' },
            { valor: 'trabalhadores', label: 'Trabalhadores' },
            { valor: 'ambos', label: 'Ambos' },
          ],
        },
      ],
    },
    {
      titulo: 'Regras da casa',
      icone: 'rule',
      campos: [
        {
          id: 'regras',
          label: 'Regras',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'nao_fumar', label: 'Não fumar' },
            { valor: 'nao_animais', label: 'Sem animais' },
            { valor: 'sem_visitas_noite', label: 'Sem visitas à noite' },
            { valor: 'festas_proibidas', label: 'Sem festas' },
          ],
        },
      ],
    },
  ],
};

// ============================================================
// MORADIA
// ============================================================
export const CAMPOS_MORADIA: FormularioCategoria = {
  categoriaId: 'moradia',
  categoriaLabel: 'Moradia',
  seccoes: [
    {
      titulo: 'Divisões e área',
      icone: 'floor-plan',
      campos: [
        {
          id: 'quartos',
          label: 'Quartos',
          tipo: 'contador',
          obrigatorio: true,
          valorInicial: 3,
          min: 1,
          max: 20,
          icone: 'bed',
        },
        {
          id: 'suites',
          label: 'Suites',
          tipo: 'contador',
          valorInicial: 1,
          min: 0,
          max: 10,
          icone: 'bed-king',
        },
        {
          id: 'casasBanho',
          label: 'Casas de banho',
          tipo: 'contador',
          valorInicial: 2,
          min: 1,
          max: 10,
          icone: 'shower',
        },
        {
          id: 'salas',
          label: 'Salas de estar',
          tipo: 'contador',
          valorInicial: 1,
          min: 1,
          max: 5,
          icone: 'sofa',
        },
        {
          id: 'pisos',
          label: 'Nº de pisos',
          tipo: 'contador',
          valorInicial: 1,
          min: 1,
          max: 5,
          icone: 'stairs',
        },
        {
          id: 'area',
          label: 'Área construída',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 250',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
        {
          id: 'areaTerreno',
          label: 'Área do terreno',
          tipo: 'numero',
          dica: 'Ex: 500',
          sufixo: 'm²',
        },
      ],
    },
    {
      titulo: 'Estado',
      icone: 'home-city',
      campos: [
        {
          id: 'estadoCasa',
          label: 'Estado',
          tipo: 'chip',
          opcoes: [
            { valor: 'nova', label: 'Nova' },
            { valor: 'reformada', label: 'Reformada' },
            { valor: 'usada', label: 'Usada' },
            { valor: 'precisa_obras', label: 'Precisa de obras' },
          ],
        },
        {
          id: 'anoConstrucao',
          label: 'Ano de construção',
          tipo: 'numero',
          dica: 'Ex: 2015',
          min: 1900,
          max: 2030,
        },
      ],
    },
    {
      titulo: 'Comodidades interiores',
      icone: 'star-outline',
      campos: [
        { id: 'mobilado', label: 'Mobilada', tipo: 'switch', icone: 'sofa' },
        { id: 'agua', label: 'Água canalizada', tipo: 'switch', valorInicial: true, icone: 'water' },
        { id: 'energia', label: 'Energia eléctrica', tipo: 'switch', valorInicial: true, icone: 'flash' },
        { id: 'wifi', label: 'Wi-Fi', tipo: 'switch', icone: 'wifi' },
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', icone: 'air-conditioner' },
        { id: 'aquecedorSolar', label: 'Aquecedor solar', tipo: 'switch', icone: 'solar-power' },
        { id: 'gerador', label: 'Gerador', tipo: 'switch', icone: 'engine' },
        { id: 'reservatorioAgua', label: 'Reservatório de água', tipo: 'switch', icone: 'water-pump' },
      ],
    },
    {
      titulo: 'Exterior',
      icone: 'tree',
      campos: [
        {
          id: 'lugaresEstacionamento',
          label: 'Lugares de estacionamento',
          tipo: 'contador',
          valorInicial: 0,
          min: 0,
          max: 10,
          icone: 'car',
        },
        { id: 'garagem', label: 'Garagem fechada', tipo: 'switch', icone: 'garage' },
        { id: 'jardim', label: 'Jardim', tipo: 'switch', icone: 'flower' },
        { id: 'piscina', label: 'Piscina', tipo: 'switch', icone: 'pool' },
        { id: 'churrasqueira', label: 'Churrasqueira', tipo: 'switch', icone: 'grill' },
        { id: 'quartoEmpregada', label: 'Quarto de empregada', tipo: 'switch' },
        { id: 'muroVedacao', label: 'Muro ou vedação', tipo: 'switch', icone: 'fence' },
        { id: 'portaoEletrico', label: 'Portão eléctrico', tipo: 'switch', icone: 'gate' },
      ],
    },
    {
      titulo: 'Segurança',
      icone: 'shield-check',
      campos: [
        { id: 'alarme', label: 'Sistema de alarme', tipo: 'switch' },
        { id: 'camaras', label: 'Câmaras de vigilância', tipo: 'switch' },
        { id: 'condominio', label: 'Condomínio fechado', tipo: 'switch' },
        { id: 'guardaNoturno', label: 'Segurança 24h', tipo: 'switch' },
      ],
    },
  ],
};