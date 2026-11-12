/**
 * Gerador determinístico de nomes verosímeis (apelidos e nomes comuns em Moçambique) para os
 * dados de desenvolvimento. As combinações são inventadas: não correspondem a pessoas reais.
 */
const PRIMEIROS = [
  'Abel', 'Adelina', 'Alberto', 'Albertina', 'Amélia', 'António', 'Arlete', 'Augusto', 'Benedita', 'Bernardo',
  'Carlos', 'Celeste', 'Cláudio', 'Cristina', 'Daniel', 'Deolinda', 'Domingos', 'Edna', 'Elias', 'Esperança',
  'Felisberto', 'Filomena', 'Gaspar', 'Graça', 'Hélio', 'Inês', 'Isaías', 'Jaime', 'Joana', 'Júlio',
  'Lídia', 'Luís', 'Manuel', 'Margarida', 'Nádia', 'Orlando', 'Palmira', 'Rafael', 'Salvador', 'Sónia',
  'Teresa', 'Valentim', 'Zélia', 'Aurélio', 'Berta', 'Dércio', 'Emília', 'Frederico', 'Gisela', 'Hortênsia',
];
const APELIDOS = [
  'Mabote', 'Chongo', 'Mavie', 'Mate', 'Nhampossa', 'Chitlango', 'Macamo', 'Ussene', 'Massango', 'Sumbana',
  'Khosa', 'Maluleque', 'Mulungo', 'Zimba', 'Bahule', 'Dengo', 'Manjate', 'Novela', 'Chirindza', 'Tamele',
  'Vilanculos', 'Chaúque', 'Mahumane', 'Nhamuave', 'Maibaze', 'Cossa', 'Baloi', 'Come', 'Dimande', 'Ernesto',
  'Francisco', 'Gove', 'Honwana', 'Inguane', 'Jossefa', 'Langa', 'Magaia', 'Nhatave', 'Ouana', 'Pinto',
  'Quissico', 'Rungo', 'Sambo', 'Tauzene', 'Uamusse', 'Vasco', 'Xavier', 'Zacarias', 'Matavele', 'Nkomo',
];

export const semAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Devolve `n` nomes completos únicos, sem repetir os de `usados` (que é actualizado). Determinístico:
 * `deslocamento` separa sequências independentes (docentes vs. estudantes) para que voltar a correr
 * o seed não mude os nomes já atribuídos.
 */
export function gerarNomes(n: number, usados: Set<string>, deslocamento = 0): string[] {
  const out: string[] = [];
  for (let i = deslocamento; out.length < n; i++) {
    const nome = `${PRIMEIROS[(i * 7) % PRIMEIROS.length]} ${APELIDOS[(i * 11 + Math.floor(i / PRIMEIROS.length)) % APELIDOS.length]}`;
    if (usados.has(nome)) continue;
    usados.add(nome);
    out.push(nome);
  }
  return out;
}

export const emailDe = (nome: string, dominio: string) =>
  `${semAcentos(nome).toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).join('.')}@${dominio}`;
