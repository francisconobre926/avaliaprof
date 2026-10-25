/**
 * Formulários dinâmicos para categorias de veículos:
 * - carro
 * - motorizada (mota)
 * - carrinha_caminhao
 */

import { FormularioCategoria } from './tipos';

// ============================================================
// CARRO
// ============================================================
export const CAMPOS_CARRO: FormularioCategoria = {
  categoriaId: 'carro',
  categoriaLabel: 'Carro',
  seccoes: [
    {
      titulo: 'Identificação',
      icone: 'car',
      campos: [
        {
          id: 'marca',
          label: 'Marca',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Toyota, Honda, Mercedes',
          maxLength: 40,
          icone: 'tag',
        },
        {
          id: 'modelo',
          label: 'Modelo',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Corolla, Civic, C-Class',
          maxLength: 40,
          icone: 'car-info',
        },
        {
          id: 'ano',
          label: 'Ano',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 2018',
          min: 1960,
          max: 2030,
          icone: 'calendar',
        },
        {
          id: 'cor',
          label: 'Cor',
          tipo: 'texto',
          dica: 'Ex: Preto, Branco pérola',
          maxLength: 30,
          icone: 'palette',
        },
        {
          id: 'matricula',
          label: 'Matrícula (opcional)',
          tipo: 'texto',
          dica: 'Visível só para contactos desbloqueados',
          maxLength: 15,
        },
      ],
    },
    {
      titulo: 'Características técnicas',
      icone: 'engine',
      campos: [
        {
          id: 'combustivel',
          label: 'Combustível',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'gasolina', label: 'Gasolina' },
            { valor: 'gasoleo', label: 'Gasóleo' },
            { valor: 'gpl', label: 'GPL' },
            { valor: 'hibrido', label: 'Híbrido' },
            { valor: 'eletrico', label: 'Eléctrico' },
          ],
        },
        {
          id: 'caixa',
          label: 'Caixa de velocidades',
          tipo: 'chip',
          opcoes: [
            { valor: 'manual', label: 'Manual' },
            { valor: 'automatica', label: 'Automática' },
            { valor: 'semi_automatica', label: 'Semi-automática' },
          ],
        },
        {
          id: 'quilometragem',
          label: 'Quilometragem',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 85000',
          sufixo: 'km',
          icone: 'speedometer',
        },
        {
          id: 'cilindrada',
          label: 'Cilindrada (opcional)',
          tipo: 'numero',
          dica: 'Ex: 1600',
          sufixo: 'cc',
        },
        {
          id: 'potencia',
          label: 'Potência (opcional)',
          tipo: 'numero',
          dica: 'Ex: 120',
          sufixo: 'cv',
        },
      ],
    },
    {
      titulo: 'Carroçaria',
      icone: 'car-side',
      campos: [
        {
          id: 'tipoCarrocaria',
          label: 'Tipo',
          tipo: 'chip',
          opcoes: [
            { valor: 'sedan', label: 'Sedan' },
            { valor: 'hatchback', label: 'Hatchback' },
            { valor: 'suv', label: 'SUV' },
            { valor: 'pickup', label: 'Pick-up' },
            { valor: 'carrinha', label: 'Carrinha' },
            { valor: 'coupe', label: 'Coupé' },
            { valor: 'conversivel', label: 'Conversível' },
          ],
        },
        {
          id: 'portas',
          label: 'Nº de portas',
          tipo: 'chip',
          opcoes: [
            { valor: '2', label: '2' },
            { valor: '3', label: '3' },
            { valor: '4', label: '4' },
            { valor: '5', label: '5' },
          ],
        },
        {
          id: 'lugares',
          label: 'Nº de lugares',
          tipo: 'contador',
          valorInicial: 5,
          min: 2,
          max: 9,
          icone: 'account-group',
        },
      ],
    },
    {
      titulo: 'Estado e documentação',
      icone: 'file-document',
      campos: [
        {
          id: 'estado',
          label: 'Estado geral',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'novo', label: 'Novo (0 km)' },
            { valor: 'semi_novo', label: 'Semi-novo' },
            { valor: 'usado_bom', label: 'Usado — bom' },
            { valor: 'usado_razoavel', label: 'Usado — razoável' },
            { valor: 'para_pecas', label: 'Para peças' },
          ],
        },
        { id: 'documentacaoEmDia', label: 'Documentação em dia', tipo: 'switch', valorInicial: true },
        { id: 'inspecaoValida', label: 'Inspecção válida', tipo: 'switch' },
        { id: 'seguroActivo', label: 'Seguro activo', tipo: 'switch' },
        { id: 'livroRevisoes', label: 'Livro de revisões', tipo: 'switch' },
        {
          id: 'proveniencia',
          label: 'Proveniência',
          tipo: 'chip',
          opcoes: [
            { valor: 'local', label: 'Comprado em MZ' },
            { valor: 'importado', label: 'Importado' },
            { valor: 'africa_sul', label: 'África do Sul' },
            { valor: 'japao', label: 'Japão' },
          ],
        },
      ],
    },
    {
      titulo: 'Equipamento e extras',
      icone: 'star-outline',
      campos: [
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch', icone: 'air-conditioner' },
        { id: 'direcaoAssistida', label: 'Direcção assistida', tipo: 'switch' },
        { id: 'vidrosElectricos', label: 'Vidros eléctricos', tipo: 'switch' },
        { id: 'fecho', label: 'Fecho centralizado', tipo: 'switch' },
        { id: 'airbag', label: 'Airbags', tipo: 'switch' },
        { id: 'abs', label: 'Travões ABS', tipo: 'switch' },
        { id: 'alarme', label: 'Alarme / imobilizador', tipo: 'switch' },
        { id: 'bluetooth', label: 'Rádio Bluetooth', tipo: 'switch' },
        { id: 'cameraRé', label: 'Câmara de ré', tipo: 'switch' },
        { id: 'sensoresEstacionamento', label: 'Sensores estacionamento', tipo: 'switch' },
        { id: 'tectoAbrir', label: 'Tecto de abrir', tipo: 'switch' },
        { id: 'bancoCouro', label: 'Bancos em couro', tipo: 'switch' },
        { id: 'jantesLiga', label: 'Jantes em liga', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Negociação',
      icone: 'handshake',
      campos: [
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
        { id: 'aceitaTroca', label: 'Aceita troca por outro veículo', tipo: 'switch' },
        { id: 'aceitaFinanciamento', label: 'Aceita financiamento', tipo: 'switch' },
      ],
    },
  ],
};

// ============================================================
// MOTORIZADA (MOTA)
// ============================================================
export const CAMPOS_MOTA: FormularioCategoria = {
  categoriaId: 'motorizada',
  categoriaLabel: 'Mota',
  seccoes: [
    {
      titulo: 'Identificação',
      icone: 'motorbike',
      campos: [
        {
          id: 'marca',
          label: 'Marca',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Honda, Yamaha, Haojue',
          maxLength: 40,
          icone: 'tag',
        },
        {
          id: 'modelo',
          label: 'Modelo',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: CG 125, Fazer 250',
          maxLength: 40,
        },
        {
          id: 'ano',
          label: 'Ano',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 2022',
          min: 1980,
          max: 2030,
          icone: 'calendar',
        },
        {
          id: 'cor',
          label: 'Cor',
          tipo: 'texto',
          dica: 'Ex: Vermelha',
          maxLength: 30,
          icone: 'palette',
        },
      ],
    },
    {
      titulo: 'Características técnicas',
      icone: 'engine',
      campos: [
        {
          id: 'tipoMota',
          label: 'Tipo',
          tipo: 'chip',
          opcoes: [
            { valor: 'street', label: 'Street' },
            { valor: 'scooter', label: 'Scooter' },
            { valor: 'trail', label: 'Trail / off-road' },
            { valor: 'desportiva', label: 'Desportiva' },
            { valor: 'cruiser', label: 'Cruiser' },
            { valor: 'eletrica', label: 'Eléctrica' },
          ],
        },
        {
          id: 'cilindrada',
          label: 'Cilindrada',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 125',
          sufixo: 'cc',
          icone: 'engine',
        },
        {
          id: 'combustivel',
          label: 'Combustível',
          tipo: 'chip',
          opcoes: [
            { valor: 'gasolina', label: 'Gasolina' },
            { valor: 'eletrica', label: 'Eléctrica' },
          ],
        },
        {
          id: 'quilometragem',
          label: 'Quilometragem',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 15000',
          sufixo: 'km',
          icone: 'speedometer',
        },
      ],
    },
    {
      titulo: 'Estado e documentação',
      icone: 'file-document',
      campos: [
        {
          id: 'estado',
          label: 'Estado',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'nova', label: 'Nova' },
            { valor: 'semi_nova', label: 'Semi-nova' },
            { valor: 'usada_bom', label: 'Usada — bom estado' },
            { valor: 'usada_razoavel', label: 'Usada — razoável' },
            { valor: 'para_pecas', label: 'Para peças' },
          ],
        },
        { id: 'documentacaoEmDia', label: 'Documentação em dia', tipo: 'switch', valorInicial: true },
        { id: 'inspecaoValida', label: 'Inspecção válida', tipo: 'switch' },
        { id: 'seguroActivo', label: 'Seguro activo', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Acessórios incluídos',
      icone: 'package-variant',
      campos: [
        { id: 'capacete', label: 'Capacete(s)', tipo: 'switch', icone: 'motorbike' },
        { id: 'bauTras', label: 'Baú traseiro', tipo: 'switch' },
        { id: 'alarme', label: 'Alarme', tipo: 'switch' },
        { id: 'protecoes', label: 'Protecções (crash bars)', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Negociação',
      icone: 'handshake',
      campos: [
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
        { id: 'aceitaTroca', label: 'Aceita troca', tipo: 'switch' },
      ],
    },
  ],
};

// ============================================================
// CARRINHA / CAMIÃO
// ============================================================
export const CAMPOS_CARRINHA_CAMIAO: FormularioCategoria = {
  categoriaId: 'carrinha_caminhao',
  categoriaLabel: 'Carrinha / camião',
  seccoes: [
    {
      titulo: 'Identificação',
      icone: 'truck',
      campos: [
        {
          id: 'marca',
          label: 'Marca',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Toyota, Isuzu, Mercedes',
          maxLength: 40,
          icone: 'tag',
        },
        {
          id: 'modelo',
          label: 'Modelo',
          tipo: 'texto',
          obrigatorio: true,
          dica: 'Ex: Hilux, D-Max, Actros',
          maxLength: 40,
        },
        {
          id: 'ano',
          label: 'Ano',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 2019',
          min: 1960,
          max: 2030,
          icone: 'calendar',
        },
        {
          id: 'cor',
          label: 'Cor',
          tipo: 'texto',
          maxLength: 30,
        },
      ],
    },
    {
      titulo: 'Classificação',
      icone: 'truck-cargo-container',
      campos: [
        {
          id: 'tipoVeiculo',
          label: 'Tipo de veículo',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'carrinha_passageiros', label: 'Carrinha passageiros' },
            { valor: 'carrinha_carga', label: 'Carrinha de carga' },
            { valor: 'pickup', label: 'Pick-up' },
            { valor: 'camiao_pequeno', label: 'Camião ligeiro' },
            { valor: 'camiao_medio', label: 'Camião médio' },
            { valor: 'camiao_pesado', label: 'Camião pesado' },
            { valor: 'tractor', label: 'Trator / semi-reboque' },
          ],
        },
        {
          id: 'tipoCarga',
          label: 'Carga',
          tipo: 'chip',
          opcoes: [
            { valor: 'aberta', label: 'Caixa aberta' },
            { valor: 'fechada', label: 'Caixa fechada' },
            { valor: 'frigorifica', label: 'Frigorífica' },
            { valor: 'cisterna', label: 'Cisterna' },
            { valor: 'basculante', label: 'Basculante' },
            { valor: 'na', label: 'Não aplicável' },
          ],
        },
      ],
    },
    {
      titulo: 'Capacidade e dimensões',
      icone: 'weight',
      campos: [
        {
          id: 'capacidadeCarga',
          label: 'Capacidade de carga',
          tipo: 'texto',
          dica: 'Ex: 3 toneladas, 1500 kg',
          maxLength: 30,
        },
        {
          id: 'volumeCarga',
          label: 'Volume da caixa (opcional)',
          tipo: 'texto',
          dica: 'Ex: 15 m³',
          maxLength: 20,
        },
        {
          id: 'lugaresCabine',
          label: 'Lugares na cabine',
          tipo: 'contador',
          valorInicial: 3,
          min: 1,
          max: 20,
          icone: 'account-group',
        },
      ],
    },
    {
      titulo: 'Características técnicas',
      icone: 'engine',
      campos: [
        {
          id: 'combustivel',
          label: 'Combustível',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'gasoleo', label: 'Gasóleo' },
            { valor: 'gasolina', label: 'Gasolina' },
          ],
        },
        {
          id: 'caixa',
          label: 'Caixa',
          tipo: 'chip',
          opcoes: [
            { valor: 'manual', label: 'Manual' },
            { valor: 'automatica', label: 'Automática' },
          ],
        },
        {
          id: 'traccao',
          label: 'Tracção',
          tipo: 'chip',
          opcoes: [
            { valor: '4x2', label: '4x2' },
            { valor: '4x4', label: '4x4' },
            { valor: '6x4', label: '6x4' },
          ],
        },
        {
          id: 'quilometragem',
          label: 'Quilometragem',
          tipo: 'numero',
          obrigatorio: true,
          dica: 'Ex: 120000',
          sufixo: 'km',
          icone: 'speedometer',
        },
      ],
    },
    {
      titulo: 'Estado e documentação',
      icone: 'file-document',
      campos: [
        {
          id: 'estado',
          label: 'Estado',
          tipo: 'chip',
          obrigatorio: true,
          opcoes: [
            { valor: 'novo', label: 'Novo' },
            { valor: 'semi_novo', label: 'Semi-novo' },
            { valor: 'usado_bom', label: 'Usado — bom' },
            { valor: 'usado_razoavel', label: 'Usado — razoável' },
            { valor: 'para_pecas', label: 'Para peças' },
          ],
        },
        { id: 'documentacaoEmDia', label: 'Documentação em dia', tipo: 'switch', valorInicial: true },
        { id: 'inspecaoValida', label: 'Inspecção válida', tipo: 'switch' },
        { id: 'seguroActivo', label: 'Seguro activo', tipo: 'switch' },
        { id: 'alvaraTransporte', label: 'Alvará de transporte', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Equipamento',
      icone: 'tools',
      campos: [
        { id: 'arCondicionado', label: 'Ar condicionado', tipo: 'switch' },
        { id: 'direcaoAssistida', label: 'Direcção assistida', tipo: 'switch' },
        { id: 'guincho', label: 'Guincho', tipo: 'switch' },
        { id: 'ganchoReboque', label: 'Gancho de reboque', tipo: 'switch' },
        { id: 'gps', label: 'GPS', tipo: 'switch' },
      ],
    },
    {
      titulo: 'Negociação',
      icone: 'handshake',
      campos: [
        { id: 'precoNegociavel', label: 'Preço negociável', tipo: 'switch' },
        { id: 'aceitaTroca', label: 'Aceita troca', tipo: 'switch' },
        { id: 'alugaveltambem', label: 'Também disponível para aluguer', tipo: 'switch' },
      ],
    },
  ],
};