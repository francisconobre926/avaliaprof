/**
 * Filtros de pesquisa partilhados entre "Explorar" e o painel "Pesquisa"
 * (protótipo, páginas 1 e 4).
 */
import { create } from 'zustand';
import { Anuncio } from '../types';
import { datasOcupadasMock, intervaloLivre } from '../utils/reservas';

export type TipoEspaco = 'casa' | 'apartamento' | 'salao';
export type TipoAluguer = 'diario' | 'mensal' | 'evento';
export type Comodidade = 'wifi' | 'arCondicionado' | 'piscina' | 'gerador' | 'estacionamento';

export const PRECO_MIN = 0;
export const PRECO_MAX = 30000;

export interface Filtros {
  termo: string;
  tipo: TipoEspaco | null;
  entrada: string | null;
  saida: string | null;
  pessoas: number;
  precoMin: number;
  precoMax: number;
  quartos: number;            // 0 = qualquer; 4 = "4+"
  aluguer: TipoAluguer | null;
  perto: string | null;       // universidade | trabalho | praia | evento
  distanciaKm: number;
  verificados: boolean;
  instantanea: boolean;
  comodidades: Comodidade[];
}

export const FILTROS_INICIAIS: Filtros = {
  termo: '', tipo: null, entrada: null, saida: null, pessoas: 1,
  precoMin: PRECO_MIN, precoMax: PRECO_MAX, quartos: 0, aluguer: null,
  perto: null, distanciaKm: 3, verificados: false, instantanea: false, comodidades: [],
};

interface Store {
  filtros: Filtros;
  definir: (parcial: Partial<Filtros>) => void;
  limpar: () => void;
}

export const useFiltrosStore = create<Store>(set => ({
  filtros: FILTROS_INICIAIS,
  definir: parcial => set(s => ({ filtros: { ...s.filtros, ...parcial } })),
  limpar: () => set({ filtros: FILTROS_INICIAIS }),
}));

/** Nº de filtros ativos (mostrado no chip "Filtros"). */
export function contarFiltros(f: Filtros): number {
  return [
    f.tipo, f.entrada && f.saida, f.pessoas > 1, f.precoMin > PRECO_MIN || f.precoMax < PRECO_MAX,
    f.quartos > 0, f.aluguer, f.perto, f.verificados, f.comodidades.length > 0,
  ].filter(Boolean).length;
}

const CATEGORIAS_TIPO: Record<TipoEspaco, string[]> = {
  casa: ['casa', 'moradia', 'quarto'],
  apartamento: ['apartamento'],
  salao: ['salao', 'salao_festas', 'espaco_eventos', 'espaco_casamento', 'espaco_reuniao', 'espaco_formacao'],
};

/**
 * Aplica os filtros a uma lista. Os critérios "perto de" e "reserva instantânea"
 * ainda não têm dados no catálogo, por isso só ficam guardados (não excluem nada).
 */
export function aplicarFiltros(lista: Anuncio[], f: Filtros): Anuncio[] {
  const termo = f.termo.trim().toLocaleLowerCase('pt-PT');
  return lista.filter(a => {
    const car: any = a.caracteristicas || {};
    if (termo) {
      const alvo = [a.titulo, a.descricaoCurta, a.descricao, a.categoria, a.cidade, a.bairro, a.provincia]
        .filter(Boolean).some(v => String(v).toLocaleLowerCase('pt-PT').includes(termo));
      if (!alvo) return false;
    }
    if (f.tipo && !CATEGORIAS_TIPO[f.tipo].includes(String(a.categoria))) return false;
    if (a.preco < f.precoMin) return false;
    if (f.precoMax < PRECO_MAX && a.preco > f.precoMax) return false;
    if (f.quartos > 0 && Number(car.quartos || 0) < f.quartos) return false;
    if (f.pessoas > 1) {
      const cap = Number(car.hospedes || car.capacidade || 0);
      if (cap && cap < f.pessoas) return false;
    }
    if (f.aluguer === 'diario' && String(a.periodicidade) === 'mensal') return false;
    if (f.aluguer === 'mensal' && String(a.periodicidade) !== 'mensal') return false;
    if (f.verificados && !(a.anuncianteVerificado || a.donoVerificado)) return false;
    for (const c of f.comodidades) if (!car[c]) return false;
    if (f.entrada && f.saida && !intervaloLivre(f.entrada, f.saida, datasOcupadasMock(a.id))) return false;
    return true;
  });
}
