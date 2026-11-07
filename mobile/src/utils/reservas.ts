/**
 * Utilitários de reserva (protótipo "Marketplace de Aluguer").
 * Regras do protótipo:
 *  - taxa de serviço de 8% sobre o subtotal
 *  - valor retido pela plataforma até 24 h após o check-in
 *  - cancelamento gratuito até 48 h antes da entrada
 */

export const TAXA_SERVICO = 0.08;
export const HORAS_CANCELAMENTO_GRATIS = 48;

export type MetodoPagamento = 'mpesa' | 'emola';

/** Datas como string ISO "YYYY-MM-DD" (sem fuso horário, evita saltos de dia). */
export function paraISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function deISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function noitesEntre(entrada: string, saida: string): number {
  const ms = deISO(saida).getTime() - deISO(entrada).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MESES_LONGOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function formatarDataCurta(iso: string): string {
  const d = deISO(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function formatarIntervalo(entrada: string, saida: string): string {
  const a = deISO(entrada);
  const b = deISO(saida);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MESES[a.getMonth()]}`;
  return `${formatarDataCurta(entrada)} – ${formatarDataCurta(saida)}`;
}

export function formatarMT(valor: number): string {
  return `${Math.round(valor).toLocaleString('pt-PT').replace(/\s/g, '.')} MT`;
}

export interface ResumoPreco {
  noites: number;
  precoDia: number;
  subtotal: number;
  taxa: number;
  total: number;
}

export function calcularPreco(precoDia: number, noites: number): ResumoPreco {
  const subtotal = precoDia * noites;
  const taxa = Math.round(subtotal * TAXA_SERVICO);
  return { noites, precoDia, subtotal, taxa, total: subtotal + taxa };
}

/** Número móvel moçambicano: 8[2-7] + 7 dígitos (aceita espaços e +258). */
export function telefoneValido(valor: string): boolean {
  const limpo = valor.replace(/[\s+()-]/g, '').replace(/^258/, '');
  return /^8[2-7]\d{7}$/.test(limpo);
}

/** M-Pesa → 84/85 (Vodacom); e-Mola → 86/87 (Movitel). */
export function operadoraDoNumero(valor: string): MetodoPagamento | null {
  const limpo = valor.replace(/[\s+()-]/g, '').replace(/^258/, '');
  if (/^8[45]/.test(limpo)) return 'mpesa';
  if (/^8[67]/.test(limpo)) return 'emola';
  return null;
}

/** Cancelamento gratuito enquanto faltarem mais de 48 h para a entrada (14h). */
export function cancelamentoGratis(entrada: string, agora = new Date()): boolean {
  const checkin = deISO(entrada);
  checkin.setHours(14, 0, 0, 0);
  return checkin.getTime() - agora.getTime() > HORAS_CANCELAMENTO_GRATIS * 3_600_000;
}

/**
 * Datas ocupadas de demonstração, determinísticas por anúncio
 * (até haver backend de disponibilidade).
 */
export function datasOcupadasMock(anuncioId: string, base = new Date()): string[] {
  let h = 0;
  for (const c of String(anuncioId)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out: string[] = [];
  for (let bloco = 0; bloco < 4; bloco++) {
    const inicio = 6 + ((h >> (bloco * 3)) % 9) + bloco * 14;
    const dur = 2 + ((h >> (bloco + 2)) % 3);
    for (let i = 0; i < dur; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + inicio + i);
      out.push(paraISO(d));
    }
  }
  return out;
}

export function intervaloLivre(entrada: string, saida: string, ocupadas: string[]): boolean {
  const set = new Set(ocupadas);
  const n = noitesEntre(entrada, saida);
  for (let i = 0; i < n; i++) {
    const d = deISO(entrada);
    d.setDate(d.getDate() + i);
    if (set.has(paraISO(d))) return false;
  }
  return true;
}
