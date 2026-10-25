import AsyncStorage from '@react-native-async-storage/async-storage';

export type AnuncioLocal = {
  id: string; titulo: string; categoria: string; finalidade: string; descricao: string;
  bairro: string; cidade: string; moradaCompleta: string; preco: number; fotos: string[];
  video?: string | null; publicadoEm: string; caracteristicas: Record<string, any>;
  anuncianteNome: string; anuncianteTelefone1: string; anuncianteTelefone2: string;
  anuncianteVerificado: boolean; anuncianteRating: number; anuncianteAvaliacoes: number;
  latitude?: number | null; longitude?: number | null; valorPago?: number; estadoPagamento?: string; estadoAnuncio?: 'activo' | 'pausado' | 'expirado' | 'pendente';
};

const KEY = '@gohome/anuncios-local-v1';

async function lerTodos(): Promise<AnuncioLocal[]> {
  try { const raw = await AsyncStorage.getItem(KEY); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : []; }
  catch { return []; }
}

export async function guardarAnuncioLocal(anuncio: AnuncioLocal): Promise<void> {
  const todos = await lerTodos();
  const restantes = todos.filter(item => item.id !== anuncio.id);
  await AsyncStorage.setItem(KEY, JSON.stringify([anuncio, ...restantes]));
}

export async function obterAnuncioLocal(id: string): Promise<AnuncioLocal | null> {
  if (!id) return null;
  const todos = await lerTodos();
  return todos.find(item => item.id === id) ?? null;
}

export async function listarAnunciosLocais(): Promise<AnuncioLocal[]> { return lerTodos(); }

export async function eliminarAnuncioLocal(id: string): Promise<void> {
  const todos = await lerTodos();
  await AsyncStorage.setItem(KEY, JSON.stringify(todos.filter(item => item.id !== id)));
}
