import { Anuncio } from '../types';

export const ANUNCIOS_MOCK: Anuncio[] = [
  // ========================================================
  // IMÓVEIS
  // ========================================================
  {
    id: 'a001',
    titulo: 'Quarto individual mobilado perto da UZ',
    descricaoCurta: 'Quarto ideal para estudantes, próximo da Universidade Zambeze.',
    descricao: 'Quarto individual totalmente mobilado num apartamento partilhado com 2 outros estudantes. Casa de banho partilhada, cozinha equipada. Internet Wi-Fi de alta velocidade incluída. Água e energia incluídas no preço.',
    categoria: 'quarto',
    grupo: 'imoveis',
    finalidade: 'arrendar',
    preco: 8000,
    periodicidade: 'mensal',
    fotos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Macúti',
    latitude: -19.8296,
    longitude: 34.8541,
    moradaCompleta: 'Rua da Universidade, nº 45, Macúti, Beira',
    anuncianteId: 'adv-1',
    anuncianteNome: 'Maria Chissano',
    anuncianteRating: 4.8,
    anuncianteAvaliacoes: 24,
    anuncianteVerificado: true,
    anuncianteTelefone1: '841234567',
    anuncianteTelefone2: '871234567',
    estado: 'disponivel',
    publicadoEm: '2026-10-10T08:00:00Z',
    expiraEm: '2026-11-09T08:00:00Z',
    visualizacoes: 147,
    favoritos: 23,
    caracteristicas: {
      tipo: 'imovel',
      quartos: 1,
      casasBanho: 1,
      area: 20,
      mobilado: true,
      agua: true,
      energia: true,
      wifi: true,
      estacionamento: false,
    },
  },
  {
    id: 'a002',
    titulo: 'Apartamento T2 mobilado com vista mar',
    descricaoCurta: 'Apartamento moderno em Ponta-Gêa com vista para o mar.',
    descricao: 'Apartamento T2 totalmente mobilado, com sala ampla, cozinha equipada, 2 quartos e 1 casa de banho. Vista para o mar. Elevador no edifício. Localizado em zona nobre da Beira.',
    categoria: 'apartamento',
    grupo: 'imoveis',
    finalidade: 'arrendar',
    preco: 25000,
    periodicidade: 'mensal',
    fotos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Ponta-Gêa',
    latitude: -19.8436,
    longitude: 34.8389,
    moradaCompleta: 'Av. Eduardo Mondlane, Edifício Mar Azul, 3º andar, Ponta-Gêa',
    anuncianteId: 'adv-2',
    anuncianteNome: 'Imobiliária Costa Sol',
    anuncianteRating: 4.9,
    anuncianteAvaliacoes: 86,
    anuncianteVerificado: true,
    anuncianteTelefone1: '843456789',
    anuncianteTelefone2: '873456789',
    estado: 'disponivel',
    publicadoEm: '2026-10-08T10:30:00Z',
    expiraEm: '2026-11-07T10:30:00Z',
    visualizacoes: 342,
    favoritos: 67,
    caracteristicas: {
      tipo: 'imovel',
      quartos: 2,
      casasBanho: 1,
      area: 75,
      mobilado: true,
      agua: true,
      energia: true,
      wifi: true,
      estacionamento: true,
      elevador: true,
      arCondicionado: true,
    },
  },
  {
    id: 'a003',
    titulo: 'Casa T3 com quintal e garagem',
    descricaoCurta: 'Casa espaçosa em Matacuane, ideal para família.',
    descricao: 'Casa T3 com sala, cozinha, 3 quartos, 2 casas de banho, quintal e garagem para 2 viaturas. Bairro residencial tranquilo. Perto de escolas e supermercados.',
    categoria: 'casa',
    grupo: 'imoveis',
    finalidade: 'arrendar',
    preco: 35000,
    periodicidade: 'mensal',
    fotos: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Matacuane',
    latitude: -19.8215,
    longitude: 34.8398,
    moradaCompleta: 'Rua 7 de Abril, nº 128, Matacuane, Beira',
    anuncianteId: 'adv-3',
    anuncianteNome: 'João Nhamirre',
    anuncianteRating: 4.5,
    anuncianteAvaliacoes: 12,
    anuncianteVerificado: false,
    anuncianteTelefone1: '845678912',
    anuncianteTelefone2: '875678912',
    estado: 'disponivel',
    publicadoEm: '2026-10-05T14:20:00Z',
    expiraEm: '2026-11-04T14:20:00Z',
    visualizacoes: 89,
    favoritos: 15,
    caracteristicas: {
      tipo: 'imovel',
      quartos: 3,
      casasBanho: 2,
      area: 180,
      mobilado: false,
      agua: true,
      energia: true,
      wifi: false,
      estacionamento: true,
      jardim: true,
      seguranca: true,
    },
  },
  {
    id: 'a004',
    titulo: 'Loja comercial no centro da cidade',
    descricaoCurta: 'Loja pronta a usar no centro de Beira, excelente localização.',
    descricao: 'Loja comercial com 40m², montra ampla, ar condicionado, casa de banho privada. Zona de alto movimento, perfeita para retalho, serviços ou escritório.',
    categoria: 'loja',
    grupo: 'comercial',
    finalidade: 'arrendar',
    preco: 45000,
    periodicidade: 'mensal',
    fotos: [
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800',
      'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Centro',
    latitude: -19.8436,
    longitude: 34.8389,
    moradaCompleta: 'Av. Poder Popular, nº 56, Centro, Beira',
    anuncianteId: 'adv-2',
    anuncianteNome: 'Imobiliária Costa Sol',
    anuncianteRating: 4.9,
    anuncianteAvaliacoes: 86,
    anuncianteVerificado: true,
    anuncianteTelefone1: '843456789',
    anuncianteTelefone2: '873456789',
    estado: 'disponivel',
    publicadoEm: '2026-10-11T09:00:00Z',
    expiraEm: '2026-11-10T09:00:00Z',
    visualizacoes: 54,
    favoritos: 8,
    caracteristicas: {
      tipo: 'imovel',
      area: 40,
      arCondicionado: true,
      agua: true,
      energia: true,
      estacionamento: false,
      seguranca: true,
    },
  },

  // ========================================================
  // VEÍCULOS
  // ========================================================
  {
    id: 'a005',
    titulo: 'Toyota Corolla 2019 — Impecável',
    descricaoCurta: 'Carro em excelente estado, único dono, documentos em dia.',
    descricao: 'Toyota Corolla 2019, 60.000 km, único dono, sem acidentes. Manutenção toda feita na concessionária. Ar condicionado, câmara de ré, bluetooth. Documentos todos em dia.',
    categoria: 'carro',
    grupo: 'veiculos',
    finalidade: 'vender',
    preco: 1850000,
    periodicidade: 'unico',
    fotos: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Macúti',
    latitude: -19.8296,
    longitude: 34.8541,
    moradaCompleta: 'Av. das FPLM, Macúti, Beira',
    anuncianteId: 'adv-4',
    anuncianteNome: 'Carlos Matola',
    anuncianteRating: 4.6,
    anuncianteAvaliacoes: 7,
    anuncianteVerificado: true,
    anuncianteTelefone1: '846789012',
    anuncianteTelefone2: '876789012',
    estado: 'disponivel',
    publicadoEm: '2026-10-09T16:00:00Z',
    expiraEm: '2026-11-08T16:00:00Z',
    visualizacoes: 203,
    favoritos: 34,
    caracteristicas: {
      tipo: 'veiculo',
      marca: 'Toyota',
      modelo: 'Corolla',
      ano: 2019,
      kilometragem: 60000,
      combustivel: 'gasolina',
      transmissao: 'automatica',
      cor: 'Prateado',
      condicao: 'usado',
      documentos: true,
      arCondicionado: true,
    },
  },
  {
    id: 'a006',
    titulo: 'Mota Yamaha 125cc 2022',
    descricaoCurta: 'Mota semi-nova, excelente consumo, ideal para o dia-a-dia.',
    descricao: 'Yamaha YBR 125cc, ano 2022, 12.000 km. Em perfeito estado. Óptimo consumo de combustível. Ideal para deslocações diárias ou entregas.',
    categoria: 'mota',
    grupo: 'veiculos',
    finalidade: 'vender',
    preco: 95000,
    periodicidade: 'unico',
    fotos: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Manga',
    latitude: -19.8150,
    longitude: 34.8650,
    moradaCompleta: 'Rua da Manga, Manga, Beira',
    anuncianteId: 'adv-5',
    anuncianteNome: 'Pedro Nhantumbo',
    anuncianteRating: 4.3,
    anuncianteAvaliacoes: 4,
    anuncianteVerificado: false,
    anuncianteTelefone1: '847890123',
    anuncianteTelefone2: '877890123',
    estado: 'disponivel',
    publicadoEm: '2026-10-07T11:15:00Z',
    expiraEm: '2026-11-06T11:15:00Z',
    visualizacoes: 76,
    favoritos: 11,
    caracteristicas: {
      tipo: 'veiculo',
      marca: 'Yamaha',
      modelo: 'YBR 125',
      ano: 2022,
      kilometragem: 12000,
      combustivel: 'gasolina',
      transmissao: 'manual',
      cor: 'Preto',
      condicao: 'seminovo',
      documentos: true,
    },
  },

  // ========================================================
  // ESPAÇOS
  // ========================================================
  {
    id: 'a007',
    titulo: 'Salão para casamentos e eventos',
    descricaoCurta: 'Salão amplo para até 300 pessoas, com estacionamento.',
    descricao: 'Salão de eventos com capacidade para 300 pessoas. Equipamento de som e luzes incluído. Catering opcional. Estacionamento amplo. Ar condicionado. Reservas com antecedência mínima de 30 dias.',
    categoria: 'espaco_eventos',
    grupo: 'espacos',
    finalidade: 'reservar',
    preco: 50000,
    periodicidade: 'diaria',
    fotos: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Palmeiras',
    latitude: -19.8352,
    longitude: 34.8215,
    moradaCompleta: 'Rua das Palmeiras, nº 23, Palmeiras, Beira',
    anuncianteId: 'adv-6',
    anuncianteNome: 'Centro de Eventos Beira',
    anuncianteRating: 4.7,
    anuncianteAvaliacoes: 42,
    anuncianteVerificado: true,
    anuncianteTelefone1: '848901234',
    anuncianteTelefone2: '878901234',
    estado: 'disponivel',
    publicadoEm: '2026-10-06T13:00:00Z',
    expiraEm: '2026-11-05T13:00:00Z',
    visualizacoes: 128,
    favoritos: 29,
    caracteristicas: {
      tipo: 'espaco',
      capacidade: 300,
      area: 400,
      wifi: true,
      arCondicionado: true,
      estacionamento: true,
      catering: true,
      equipamentoSom: true,
      equipamentoProjeccao: true,
    },
  },

  // ========================================================
  // ALOJAMENTO
  // ========================================================
  {
    id: 'a008',
    titulo: 'Hotel Beira Mar — Quartos desde 2.500 MT',
    descricaoCurta: 'Hotel 3 estrelas com piscina, perto da praia.',
    descricao: 'Hotel Beira Mar oferece quartos confortáveis a partir de 2.500 MT por noite. Piscina, restaurante, pequeno-almoço incluído. Localização privilegiada perto da praia. Wi-Fi grátis em todo o hotel. Suporta reservas por pernoite ou longa duração.',
    categoria: 'hotel',
    grupo: 'alojamento',
    finalidade: 'reservar',
    preco: 2500,
    periodicidade: 'diaria',
    fotos: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Macúti',
    latitude: -19.8296,
    longitude: 34.8541,
    moradaCompleta: 'Av. das FPLM, Macúti, Beira',
    anuncianteId: 'adv-7',
    anuncianteNome: 'Hotel Beira Mar',
    anuncianteRating: 4.5,
    anuncianteAvaliacoes: 156,
    anuncianteVerificado: true,
    anuncianteTelefone1: '849012345',
    anuncianteTelefone2: '879012345',
    estado: 'disponivel',
    publicadoEm: '2026-10-04T08:00:00Z',
    expiraEm: '2026-11-03T08:00:00Z',
    visualizacoes: 487,
    favoritos: 89,
    caracteristicas: {
      tipo: 'alojamento',
      tiposQuarto: ['Standard', 'Deluxe', 'Suite'],
      wifi: true,
      arCondicionado: true,
      estacionamento: true,
      piscina: true,
      restaurante: true,
      pequenoAlmoco: true,
      horasReservas: false,
    },
  },

  // ========================================================
  // EQUIPAMENTOS
  // ========================================================
  {
    id: 'a009',
    titulo: 'Gerador 5kVA — Honda, seminovo',
    descricaoCurta: 'Gerador Honda em óptimo estado, ideal para empresa ou casa.',
    descricao: 'Gerador Honda 5kVA, ano 2024, apenas 150 horas de uso. Em perfeitas condições. Garantia de 6 meses do vendedor. Entrega disponível na Beira.',
    categoria: 'equipamento',
    grupo: 'equipamentos',
    finalidade: 'vender',
    preco: 85000,
    periodicidade: 'unico',
    fotos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Chaimite',
    latitude: -19.8400,
    longitude: 34.8300,
    moradaCompleta: 'Av. da Industria, Chaimite, Beira',
    anuncianteId: 'adv-8',
    anuncianteNome: 'Equipamentos Beira Lda.',
    anuncianteRating: 4.4,
    anuncianteAvaliacoes: 18,
    anuncianteVerificado: true,
    anuncianteTelefone1: '850123456',
    anuncianteTelefone2: '870123456',
    estado: 'disponivel',
    publicadoEm: '2026-10-03T15:30:00Z',
    expiraEm: '2026-11-02T15:30:00Z',
    visualizacoes: 42,
    favoritos: 6,
    caracteristicas: {
      tipo: 'equipamento',
      marca: 'Honda',
      modelo: 'EG5000',
      ano: 2024,
      condicao: 'seminovo',
      horasUso: 150,
      garantia: true,
    },
  },

  // ========================================================
  // TERRENO (para venda)
  // ========================================================
  {
    id: 'a010',
    titulo: 'Terreno 1000m² — Zona de expansão',
    descricaoCurta: 'Terreno plano em Chipangara, zona de expansão da cidade.',
    descricao: 'Terreno de 1000m² em zona de expansão da cidade, documentos regularizados (DUAT). Ideal para construção de moradia ou pequeno condomínio. Com acesso a estrada principal.',
    categoria: 'terreno',
    grupo: 'terrenos',
    finalidade: 'vender',
    preco: 3500000,
    periodicidade: 'unico',
    fotos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
      'https://images.unsplash.com/photo-1591789270571-70f8e35b5bbe?w=800',
    ],
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Chipangara',
    latitude: -19.7950,
    longitude: 34.8800,
    moradaCompleta: 'Zona de Chipangara, Beira',
    anuncianteId: 'adv-3',
    anuncianteNome: 'João Nhamirre',
    anuncianteRating: 4.5,
    anuncianteAvaliacoes: 12,
    anuncianteVerificado: false,
    anuncianteTelefone1: '845678912',
    anuncianteTelefone2: '875678912',
    estado: 'disponivel',
    publicadoEm: '2026-10-01T10:00:00Z',
    expiraEm: '2026-10-31T10:00:00Z',
    visualizacoes: 67,
    favoritos: 14,
    caracteristicas: {
      tipo: 'imovel',
      area: 1000,
      agua: false,
      energia: false,
    },
  },
];

// ============================================================
// HELPERS PARA FILTRAGEM
// ============================================================

/**
 * Formatar preço em MT com separadores de milhares
 */
export function formatarPreco(preco: number): string {
  return preco.toLocaleString('pt-PT').replace(/,/g, '.');
}

/**
 * Formatar preço com periodicidade
 */
export function formatarPrecoCompleto(anuncio: Anuncio): string {
  const precoFormatado = formatarPreco(anuncio.preco);
  const sufixo = {
    mensal: '/mês',
    diaria: '/dia',
    horaria: '/hora',
    unico: '',
  }[anuncio.periodicidade || 'unico'];
  return `${precoFormatado} MT${sufixo}`;
}

/**
 * Tempo relativo desde publicação (ex: "há 2 dias")
 */
export function tempoDesde(dataISO: string): string {
  const agora = new Date();
  const publicacao = new Date(dataISO);
  const diffMs = agora.getTime() - publicacao.getTime();
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) return 'agora mesmo';
  if (diffHoras < 24) return `há ${diffHoras}h`;
  if (diffDias < 30) return `há ${diffDias}${diffDias === 1 ? ' dia' : ' dias'}`;
  const diffMeses = Math.floor(diffDias / 30);
  return `há ${diffMeses}${diffMeses === 1 ? ' mês' : ' meses'}`;
}

/**
 * Filtrar anúncios por grupo (imóveis, veículos, etc)
 */
export function filtrarPorGrupo(anuncios: Anuncio[], grupo: string): Anuncio[] {
  if (grupo === 'todos') return anuncios;
  return anuncios.filter(a => a.grupo === grupo);
}

/**
 * Filtrar anúncios por categoria específica (casa, apartamento, carro, etc)
 */
export function filtrarPorCategoria(anuncios: Anuncio[], categoria: string): Anuncio[] {
  if (categoria === 'todos') return anuncios;
  return anuncios.filter(a => a.categoria === categoria);
}

/**
 * Filtrar por finalidade (arrendar, vender, reservar)
 */
export function filtrarPorFinalidade(anuncios: Anuncio[], finalidade: string): Anuncio[] {
  if (finalidade === 'todos') return anuncios;
  return anuncios.filter(a => a.finalidade === finalidade);
}

/**
 * Filtrar por província
 */
export function filtrarPorProvincia(anuncios: Anuncio[], provincia: string): Anuncio[] {
  if (provincia === 'todos') return anuncios;
  return anuncios.filter(a => a.provincia === provincia);
}

/**
 * Procurar por texto no título ou descrição
 */
export function procurarAnuncios(anuncios: Anuncio[], texto: string): Anuncio[] {
  if (!texto.trim()) return anuncios;
  const textoLower = texto.toLowerCase();
  return anuncios.filter(a =>
    a.titulo.toLowerCase().includes(textoLower) ||
    a.descricaoCurta.toLowerCase().includes(textoLower) ||
    a.bairro.toLowerCase().includes(textoLower) ||
    a.cidade.toLowerCase().includes(textoLower)
  );
}

/**
 * Contar anúncios por grupo
 */
export function contarPorGrupo(anuncios: Anuncio[], grupo: string): number {
  return filtrarPorGrupo(anuncios, grupo).length;
}

/**
 * Contar anúncios por categoria
 */
export function contarPorCategoria(anuncios: Anuncio[], categoria: string): number {
  return filtrarPorCategoria(anuncios, categoria).length;
}

/**
 * Obter apenas anúncios disponíveis (que aparecem na pesquisa)
 */
export function apenasDisponiveis(anuncios: Anuncio[]): Anuncio[] {
  return anuncios.filter(a =>
    a.estado === 'disponivel' || a.estado === 'em_negociacao'
  );
}