/**
 * Formulários dinâmicos para:
 * - espaço de eventos
 * - alojamento (hotel, hostel, Airbnb, pensão)
 */

import { FormularioCategoria } from './tipos';

// ============================================================
// ESPAÇOS E EVENTOS
// ============================================================
export const CAMPOS_ESPACO_EVENTOS: FormularioCategoria = {
  categoriaId: 'espaco_eventos',
  categoriaLabel: 'Espaços e eventos',
  seccoes: [
    {
      titulo: 'Capacidade',
      icone: 'account-group',
      campos: [
        {
          id: 'capacidadeMaxima',
          label: 'Capacidade máxima',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 150',
          sufixo: 'pessoas',
          icone: 'account-group',
        },
        {
          id: 'capacidadeSentados',
          label: 'Lotação sentada',
          tipo: 'numero',
          dica: 'Ex: 100',
          sufixo: 'pessoas',
        },
        {
          id: 'area',
          label: 'Área',
          tipo: 'numero',
          dica: 'Ex: 200',
          sufixo: 'm²',
          icone: 'ruler-square',
        },
      ],
    },
    {
      titulo: 'Tipo de espaço',
      icone: 'home-city',
      campos: [
        {
          id: 'tipoEspaco',
          label: 'Tipo',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'salao', label: 'Salão de festas' },
            { valor: 'sala_reunioes', label: 'Sala de reuniões' },
            { valor: 'auditorio', label: 'Auditório' },
            { valor: 'quinta', label: 'Quinta / espaço rural' },
            { valor: 'praia', label: 'Beach / zona praia' },
            { valor: 'piscina', label: 'Área piscina' },
            { valor: 'estudio', label: 'Estúdio' },
            { valor: 'tenda_jardim', label: 'Tenda / jardim' },
          ],
        },
        {
          id: 'ambiente',
          label: 'Ambiente',
          tipo: 'chip',
          opcoes: [
            { valor: 'interior', label: 'Interior' },
            { valor: 'exterior', label: 'Exterior' },
            { valor: 'misto', label: 'Interior + exterior' },
          ],
        },
      ],
    },
    {
      titulo: 'Eventos aceites',
      icone: 'party-popper',
      campos: [
        {
          id: 'tiposEventosAceites',
          label: 'Tipos de eventos',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'casamentos', label: 'Casamentos' },
            { valor: 'aniversarios', label: 'Aniversários' },
            { valor: 'baptizados', label: 'Baptizados' },
            { valor: 'corporate', label: 'Eventos corporate' },
            { valor: 'formacoes', label: 'Formações / workshops' },
            { valor: 'conferencias', label: 'Conferências' },
            { valor: 'religiosos', label: 'Religiosos' },
            { valor: 'funerais', label: 'Funerais' },
            { valor: 'produtoras_video', label: 'Rodagens / fotos' },
          ],
        },
      ],
    },
    {
      titulo: 'Mobília e equipamento',
      icone: 'table-chair',
      campos: [
        { id: 'mesasIncluidas', label: 'Mesas incluídas', tipo: 'switch', valorInicial: true },
        { id: 'cadeirasIncluidas', label: 'Cadeiras incluídas', tipo: 'switch', valorInicial: true },
        { id: 'toalhasIncluidas', label: 'Toalhas de mesa', tipo: 'switch' },
        { id: 'palco', label: 'Palco', tipo: 'switch' },
        { id: 'pistaDanca', label: 'Pista de dança', tipo: 'switch' },
        {
          id: 'quantidadeMesas',
          label: 'Nº de mesas',
          tipo: 'numero',
          dica: 'Ex: 15',
        },
        {
          id: 'quantidadeCadeiras',
          label: 'Nº de cadeiras',
          tipo: 'numero',
          dica: 'Ex: 120',
        },
      ],
    },
    {
      titulo: 'Som e iluminação',
      icone: 'speaker',
      campos: [
        { id: 'sistemaSom', label: 'Sistema de som', tipo: 'switch', icone: 'speaker' },
        { id: 'microfones', label: 'Microfones', tipo: 'switch' },
        { id: 'iluminacaoProfissional', label: 'Iluminação profissional', tipo: 'switch' },
        { id: 'projector', label: 'Projector / ecrã', tipo: 'switch' },
        { id: 'dj', label: 'DJ incluído', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Infra-estruturas',
      icone: 'power-plug',
      campos: [
        {
          id: 'casasBanho',
          label: 'Casas de banho',
          tipo: 'contador',
          valorInicial: 2,
          min: 0,
          max: 20,
          icone: 'shower',
        },
        { id: 'agua', label: 'Água corrente', tipo: 'switch', valorInicial: true },
        { id: 'energia', label: 'Energia eléctrica', tipo: 'switch', valorInicial: true },
        { id: 'gerador', label: 'Gerador de reserva', tipo: 'switch' },
        { id: 'wifi', label: 'Wi-Fi', tipo: 'switch', icone: 'wifi' },
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', icone: 'air-conditioner' },
      ],
    },
    {
      titulo: 'Serviços e extras',
      icone: 'room-service',
      campos: [
        {
          id: 'cateringProprio',
          label: 'Catering',
          tipo: 'chip',
          opcoes: [
            { valor: 'nao_disponivel', label: 'Não disponível' },
            { valor: 'proprio_opcional', label: 'Próprio (opcional)' },
            { valor: 'proprio_obrigatorio', label: 'Próprio (obrigatório)' },
            { valor: 'cliente_leva', label: 'Cliente pode levar externo' },
          ],
        },
        { id: 'cozinhaDisponivel', label: 'Cozinha disponível', tipo: 'switch' },
        { id: 'bar', label: 'Bar', tipo: 'switch' },
        { id: 'servicoLimpeza', label: 'Serviço de limpeza', tipo: 'switch' },
        { id: 'seguranca', label: 'Segurança no local', tipo: 'switch' },
        { id: 'decoracaoIncluida', label: 'Decoração básica incluída', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Estacionamento e acesso',
      icone: 'car',
      campos: [
        {
          id: 'estacionamento',
          label: 'Estacionamento',
          tipo: 'chip',
          opcoes: [
            { valor: 'nao_tem', label: 'Não tem' },
            { valor: 'na_rua', label: 'Só na rua' },
            { valor: 'proprio', label: 'Próprio' },
            { valor: 'manobrista', label: 'Com manobrista' },
          ],
        },
        {
          id: 'capacidadeEstacionamento',
          label: 'Nº de carros',
          tipo: 'numero',
          dica: 'Ex: 30',
        },
        { id: 'acessivelDeficientes', label: 'Acessível a deficientes', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Condições de reserva',
      icone: 'calendar-check',
      campos: [
        {
          id: 'duracaoMinima',
          label: 'Duração mínima',
          tipo: 'chip',
          opcoes: [
            { valor: '2h', label: '2 horas' },
            { valor: '4h', label: '4 horas' },
            { valor: '6h', label: '6 horas' },
            { valor: '12h', label: '12 horas' },
            { valor: 'dia_todo', label: 'Dia todo' },
          ],
        },
        { id: 'cauçaoNecessaria', label: 'Caução obrigatória', tipo: 'switch' },
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
      ],
    },
  ],
};

// ============================================================
// ALOJAMENTO
// ============================================================
export const CAMPOS_ALOJAMENTO: FormularioCategoria = {
  categoriaId: 'alojamento',
  categoriaLabel: 'Alojamento',
  seccoes: [
    {
      titulo: 'Tipo de alojamento',
      icone: 'bed',
      campos: [
        {
          id: 'tipoAlojamento',
          label: 'Tipo',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'hotel', label: 'Hotel' },
            { valor: 'pousada', label: 'Pousada / pensão' },
            { valor: 'hostel', label: 'Hostel' },
            { valor: 'airbnb', label: 'Airbnb / casa inteira' },
            { valor: 'bungalow', label: 'Bungalow' },
            { valor: 'resort', label: 'Resort' },
            { valor: 'apartamento_turismo', label: 'Apartamento turístico' },
          ],
        },
        {
          id: 'ambiente',
          label: 'Localização / vibe',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'praia', label: 'Praia' },
            { valor: 'cidade', label: 'Cidade' },
            { valor: 'natureza', label: 'Natureza / rural' },
            { valor: 'historico', label: 'Centro histórico' },
            { valor: 'business', label: 'Business' },
            { valor: 'familiar', label: 'Familiar' },
            { valor: 'romantico', label: 'Romântico / lua-de-mel' },
          ],
        },
      ],
    },
    {
      titulo: 'Capacidade',
      icone: 'account-group',
      campos: [
        {
          id: 'numeroQuartos',
          label: 'Nº de quartos',
          tipo: 'contador',
          obrigatorio: true,
          valorInicial: 1,
          min: 1,
          max: 30,
          icone: 'bed',
        },
        {
          id: 'numeroCamas',
          label: 'Nº de camas',
          tipo: 'contador',
          valorInicial: 1,
          min: 1,
          max: 50,
          icone: 'bed-king',
        },
        {
          id: 'capacidadeMaxima',
          label: 'Capacidade total',
          tipo: 'numero',
          dica: 'Ex: 6',
          sufixo: 'pessoas',
        },
        {
          id: 'tipoCamas',
          label: 'Tipo de camas',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'solteiro', label: 'Solteiro' },
            { valor: 'duplo', label: 'Casal' },
            { valor: 'king', label: 'King size' },
            { valor: 'beliche', label: 'Beliche' },
            { valor: 'sofa_cama', label: 'Sofá-cama' },
          ],
        },
      ],
    },
    {
      titulo: 'Casas de banho',
      icone: 'shower',
      campos: [
        {
          id: 'numeroCasasBanho',
          label: 'Nº de casas de banho',
          tipo: 'contador',
          valorInicial: 1,
          min: 0,
          max: 20,
        },
        { id: 'wcPrivativoPorQuarto', label: 'WC privativa por quarto', tipo: 'switch' },
        { id: 'bidetSuite', label: 'Bidet / jacuzzi', tipo: 'switch' },
        { id: 'secadorCabelo', label: 'Secador de cabelo', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Comodidades no quarto',
      icone: 'star-outline',
      campos: [
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', valorInicial: true, icone: 'air-conditioner' },
        { id: 'ventoinha', label: 'Ventoinha', tipo: 'switch' },
        { id: 'tv', label: 'TV', tipo: 'switch' },
        { id: 'tvSatelite', label: 'TV por satélite / DSTV', tipo: 'switch' },
        { id: 'frigorificoMinibar', label: 'Frigorífico / minibar', tipo: 'switch' },
        { id: 'cofre', label: 'Cofre', tipo: 'switch' },
        { id: 'secretariaTrabalho', label: 'Secretária de trabalho', tipo: 'switch' },
        { id: 'varanda', label: 'Varanda', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Comodidades do estabelecimento',
      icone: 'home-city',
      campos: [
        { id: 'wifi', label: 'Wi-Fi gratuito', tipo: 'switch', valorInicial: true, icone: 'wifi' },
        { id: 'piscina', label: 'Piscina', tipo: 'switch', icone: 'pool' },
        { id: 'ginasio', label: 'Ginásio', tipo: 'switch', icone: 'dumbbell' },
        { id: 'spa', label: 'Spa / sauna', tipo: 'switch' },
        { id: 'bar', label: 'Bar', tipo: 'switch' },
        { id: 'restaurante', label: 'Restaurante', tipo: 'switch' },
        { id: 'salaReunioes', label: 'Sala de reuniões', tipo: 'switch' },
        { id: 'areaInfantil', label: 'Área infantil', tipo: 'switch' },
        { id: 'jardim', label: 'Jardim / zona exterior', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Serviços incluídos',
      icone: 'room-service',
      campos: [
        { id: 'pequenoAlmocoIncluido', label: 'Pequeno-almoço incluído', tipo: 'switch' },
        { id: 'meiaRefeicao', label: 'Meia pensão disponível', tipo: 'switch' },
        { id: 'pensaoCompleta', label: 'Pensão completa disponível', tipo: 'switch' },
        { id: 'servicoQuartos', label: 'Serviço de quartos', tipo: 'switch' },
        { id: 'limpezaDiaria', label: 'Limpeza diária', tipo: 'switch' },
        { id: 'rouparia', label: 'Rouparia incluída', tipo: 'switch', valorInicial: true },
        { id: 'lavandaria', label: 'Lavandaria', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Serviços adicionais',
      icone: 'briefcase',
      campos: [
        { id: 'transferAeroporto', label: 'Transfer aeroporto', tipo: 'switch' },
        { id: 'alugueCarros', label: 'Aluguer de carros', tipo: 'switch' },
        { id: 'excursoes', label: 'Organização de excursões', tipo: 'switch' },
        { id: 'rececao24h', label: 'Recepção 24h', tipo: 'switch' },
        { id: 'segurancaPrivada', label: 'Segurança privada', tipo: 'switch' },
        { id: 'estacionamento', label: 'Estacionamento', tipo: 'switch', valorInicial: true, icone: 'car' },
      ],
    },
    {
      titulo: 'Políticas',
      icone: 'file-document',
      campos: [
        {
          id: 'minimoNoites',
          label: 'Mínimo de noites',
          tipo: 'contador',
          valorInicial: 1,
          min: 1,
          max: 30,
        },
        { id: 'aceitaAnimais', label: 'Aceita animais', tipo: 'switch' },
        { id: 'aceitaCriancas', label: 'Aceita crianças', tipo: 'switch', valorInicial: true },
        { id: 'fumarPermitido', label: 'Fumar permitido', tipo: 'switch' },
        { id: 'festasPermitidas', label: 'Festas permitidas', tipo: 'switch' },
        {
          id: 'formasPagamento',
          label: 'Formas de pagamento',
          tipo: 'chip_multi',
          opcoes: [
            { valor: 'mpesa', label: 'M-Pesa' },
            { valor: 'emola', label: 'eMola' },
            { valor: 'dinheiro', label: 'Dinheiro' },
            { valor: 'cartao', label: 'Cartão' },
            { valor: 'transferencia', label: 'Transferência' },
          ],
        },
      ],
    },
  ],
};