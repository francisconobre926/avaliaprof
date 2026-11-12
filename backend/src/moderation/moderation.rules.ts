/**
 * Regras da moderação automática (filtros locais, sem IA).
 *
 * Todas as listas estão em texto NORMALIZADO: minúsculas, sem acentos, sem pontuação
 * colada e com letras repetidas reduzidas (ver `normalize`). Para afinar a moderação
 * basta editar este ficheiro; na Fase 6 o administrador passa a poder geri-las.
 *
 * Princípio: criticar o desempenho profissional é permitido ("explica mal", "devia
 * melhorar a metodologia"). Insultar a pessoa, ameaçar, discriminar ou expor dados não.
 * Em caso de dúvida o comentário vai para revisão (PENDING_REVIEW), não é publicado.
 */

export const MAX_COMMENT_LENGTH = 500;

/** Insultos e palavrões: o comentário é bloqueado e o estudante reformula. */
export const OFFENSIVE_TERMS: string[] = [
  'idiota', 'imbecil', 'estupido', 'estupida', 'burro', 'burra', 'cretino', 'cretina', 'palhaco', 'palhaca',
  'merda', 'bosta', 'porra', 'caralho', 'foda', 'foder', 'fodido', 'puta', 'puto', 'cabrao', 'cabra',
  'filho da puta', 'filha da puta', 'vai-te lixar', 'vai te lixar', 'vai a merda', 'otario', 'otaria',
  'desgracado', 'desgracada', 'lixo', 'nojento', 'nojenta', 'vagabundo', 'vagabunda', 'arrombado',
  'anormal', 'mongoloide', 'atrasado mental', 'retardado', 'retardada', 'badalhoco', 'badalhoca',
];

/** Ameaças e discurso discriminatório: bloqueado. */
export const THREAT_OR_HATE_TERMS: string[] = [
  'vou te matar', 'vou-te matar', 'vamos matar', 'mereces morrer', 'merece morrer', 'devia morrer', 'devias morrer',
  'vais pagar', 'vai pagar por isto', 'vou partir', 'partir a cara', 'te dar uma tareia', 'vou te apanhar', 'vou-te apanhar',
  'vou denunciar a tua familia', 'acabar com a tua vida',
  'preto de merda', 'macaco', 'negro de merda', 'maricas', 'paneleiro', 'viado', 'sapatao',
  'aleijado', 'deficiente mental', 'volta para a tua terra', 'esses pretos', 'essas mulheres nao servem',
];

/** Acusações graves: não se publicam sem análise de um administrador. */
export const SERIOUS_ACCUSATION_TERMS: string[] = [
  'assedio', 'assediou', 'assediar', 'assediada', 'abuso sexual', 'abusou', 'violou', 'violacao', 'importunou',
  'corrupcao', 'corrupto', 'corrupta', 'suborno', 'subornar', 'vende notas', 'vendeu notas', 'vende positivas',
  'compra de nota', 'troca notas por', 'pediu dinheiro', 'pede dinheiro', 'extorsao', 'chantagem', 'chantageou',
  'discrimina', 'discriminou', 'racista', 'machista', 'xenofobo',
  'fraude', 'plagiou', 'plagio do professor', 'roubou', 'furtou', 'bebado', 'embriagado', 'drogado',
];

/** Juízos duros sobre a pessoa, ambíguos entre crítica profissional e ataque: vão para revisão. */
export const AMBIGUOUS_TERMS: string[] = [
  'incompetente', 'inutil', 'ignorante', 'preguicoso', 'preguicosa', 'desonesto', 'desonesta', 'mentiroso', 'mentirosa',
  'arrogante', 'prepotente', 'ridiculo', 'ridicula', 'patetico', 'patetica', 'tirano', 'tirana',
  'deviam despedir', 'devia ser despedido', 'devia ser despedida', 'nao presta', 'nao serve para nada', 'e uma vergonha',
];

/** Padrões de dados pessoais (aplicados ao texto original em minúsculas, não ao normalizado). */
export const PERSONAL_DATA_PATTERNS: { code: string; regex: RegExp }[] = [
  { code: 'EMAIL', regex: /[\w.+-]+\s?(@|\(at\)|\[at\])\s?[\w-]+(\.[\w-]+)+/i },
  { code: 'URL', regex: /(https?:\/\/|www\.)\S+/i },
  { code: 'PHONE', regex: /(\+?\s?258[\s.-]?)?\b8[2-7][\s.-]?\d{3}[\s.-]?\d{4}\b/ },
  { code: 'LONG_NUMBER', regex: /\b\d{7,}\b/ },
  { code: 'HANDLE', regex: /(^|\s)@[a-z0-9_.]{3,}/i },
  { code: 'MESSENGER', regex: /\b(whatsapp|whats app|telegram|instagram|facebook|messenger)\b.{0,15}\d/i },
];
