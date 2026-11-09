export type EstadoConversa = 'confirmada' | 'visita' | 'pedido' | 'consulta' | 'concluida';

export interface Conversa {
  id: string;
  nome: string;
  anuncio: string;
  contexto?: string;
  estado: EstadoConversa;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
  verificado: boolean;
}

export const CONVERSAS_MOCK: Conversa[] = [
  { id: '1', nome: 'Maria Chissano', anuncio: 'Quarto individual perto da UZ', estado: 'confirmada', ultimaMensagem: 'Sim, ainda está disponível. Quando queres visitar?', hora: '14:30', naoLidas: 2, verificado: true },
  { id: '2', nome: 'Imobiliária Costa Sol', anuncio: 'Apartamento T2 Ponta-Gêa', estado: 'visita', ultimaMensagem: 'Podemos marcar visita esta semana.', hora: '11:45', naoLidas: 1, verificado: true },
  { id: '3', nome: 'João Nhamirre', anuncio: 'Casa T3 com quintal', estado: 'pedido', ultimaMensagem: 'Você: A casa tem 3 quartos e 2 casas de banho?', hora: 'Ontem', naoLidas: 0, verificado: false },
  { id: '4', nome: 'Ana Muchanga', anuncio: 'Quarto partilhado Manga', estado: 'concluida', ultimaMensagem: 'Perfeito, aguardo a tua visita amanhã às 10h', hora: 'Segunda', naoLidas: 0, verificado: false },
];
