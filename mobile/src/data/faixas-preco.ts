export interface FaixaPreco {
  id: string;
  label: string;
  labelCurto: string;
  min: number;
  max: number | null; // null = sem limite (última faixa)
  icone: string; // nome de ícone (traduzido para Ionicons pelo componente Icone)
  publicoAlvo: string;
  descricao: string;
}

export const FAIXAS_PRECO: FaixaPreco[] = [
  {
    id: 'todos',
    label: 'Todos os preços',
    labelCurto: 'Todos',
    min: 0,
    max: null,
    icone: 'view-grid',
    publicoAlvo: 'Todos os públicos',
    descricao: 'Ver todos os imóveis disponíveis',
  },
  {
    id: 'estudante',
    label: 'Até 2.000 MT',
    labelCurto: '≤ 2K MT',
    min: 0,
    max: 2000,
    icone: 'school',
    publicoAlvo: 'Estudantes',
    descricao: 'Quartos partilhados e opções económicas',
  },
  {
    id: 'jovem',
    label: '2.001 - 5.000 MT',
    labelCurto: '2K - 5K MT',
    min: 2001,
    max: 5000,
    icone: 'account-multiple',
    publicoAlvo: 'Jovens profissionais',
    descricao: 'Quartos individuais e apartamentos partilhados',
  },
  {
    id: 'casal',
    label: '5.001 - 10.000 MT',
    labelCurto: '5K - 10K MT',
    min: 5001,
    max: 10000,
    icone: 'heart',
    publicoAlvo: 'Casais e T1',
    descricao: 'Apartamentos T1 para casais',
  },
  {
    id: 'familia',
    label: '10.001 - 20.000 MT',
    labelCurto: '10K - 20K MT',
    min: 10001,
    max: 20000,
    icone: 'home-heart',
    publicoAlvo: 'Famílias',
    descricao: 'T2 e T3 espaçosos para família',
  },
  {
    id: 'confortavel',
    label: '20.001 - 35.000 MT',
    labelCurto: '20K - 35K MT',
    min: 20001,
    max: 35000,
    icone: 'city',
    publicoAlvo: 'Classe média-alta',
    descricao: 'Zonas nobres e imóveis modernos',
  },
  {
    id: 'alto',
    label: '35.001 - 60.000 MT',
    labelCurto: '35K - 60K MT',
    min: 35001,
    max: 60000,
    icone: 'castle',
    publicoAlvo: 'Alto padrão',
    descricao: 'Imóveis de alto padrão em zonas premium',
  },
  {
    id: 'luxo',
    label: 'Acima 60.000 MT',
    labelCurto: '60K+ MT',
    min: 60001,
    max: null,
    icone: 'crown',
    publicoAlvo: 'Luxo & Premium',
    descricao: 'Villas, penthouses e imóveis exclusivos',
  },
];

// Função auxiliar: filtrar imóveis por faixa
export const filtrarPorFaixa = <T extends { preco: number }>(
  imoveis: T[],
  faixaId: string
): T[] => {
  const faixa = FAIXAS_PRECO.find(f => f.id === faixaId);
  if (!faixa || faixa.id === 'todos') return imoveis;

  return imoveis.filter(imovel => {
    if (faixa.max === null) return imovel.preco >= faixa.min;
    return imovel.preco >= faixa.min && imovel.preco <= faixa.max;
  });
};

// Função auxiliar: contar imóveis em cada faixa
export const contarPorFaixa = <T extends { preco: number }>(
  imoveis: T[],
  faixaId: string
): number => {
  return filtrarPorFaixa(imoveis, faixaId).length;
};