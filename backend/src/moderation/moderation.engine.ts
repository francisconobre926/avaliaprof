import { createHash } from 'crypto';
import {
  AMBIGUOUS_TERMS,
  MAX_COMMENT_LENGTH,
  OFFENSIVE_TERMS,
  PERSONAL_DATA_PATTERNS,
  SERIOUS_ACCUSATION_TERMS,
  THREAT_OR_HATE_TERMS,
} from './moderation.rules';

export type ModerationStatus = 'PUBLISHED' | 'BLOCKED' | 'PENDING_REVIEW';
export type ModerationReason =
  | 'OFFENSIVE' | 'THREAT_OR_HATE' | 'PERSONAL_DATA' | 'SPAM' | 'TOO_LONG' | 'SERIOUS_ACCUSATION' | 'POSSIBLE_PERSONAL_ATTACK';

export interface ModerationResult {
  status: ModerationStatus;
  reason?: ModerationReason;
  /** Mensagem para o estudante (só quando o comentário não é publicado). */
  message?: string;
}

const MESSAGES: Record<ModerationReason, string> = {
  OFFENSIVE: 'O comentário contém linguagem ofensiva. Reformula-o focando-te na aula, na matéria ou na avaliação.',
  THREAT_OR_HATE: 'O comentário contém ameaças ou linguagem discriminatória e não pode ser publicado.',
  PERSONAL_DATA: 'O comentário contém dados pessoais (email, telefone, ligação ou número). Remove-os para o publicares.',
  SPAM: 'O comentário parece repetido ou sem conteúdo útil. Escreve algo novo sobre a tua experiência.',
  TOO_LONG: `O comentário excede o limite de ${MAX_COMMENT_LENGTH} caracteres.`,
  SERIOUS_ACCUSATION: 'O comentário contém uma acusação grave e foi enviado para análise da administração antes de ser publicado.',
  POSSIBLE_PERSONAL_ATTACK: 'O comentário pode conter um ataque pessoal e foi enviado para análise da administração antes de ser publicado.',
};

/** Minúsculas, sem acentos, leetspeak básico, pontuação -> espaço, letras repetidas (3+) reduzidas a 1. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[@4]/g, (c) => (c === '4' ? 'a' : '@'))
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .replace(/(.)\1{2,}/g, '$1')
    .replace(/[^a-z0-9@\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Procura termos como palavra (ou expressão) inteira, para não bloquear "puta" dentro de "computador". */
function containsTerm(normalized: string, terms: string[]): boolean {
  const padded = ` ${normalized.replace(/-/g, ' ')} `;
  return terms.some((t) => padded.includes(` ${t.replace(/-/g, ' ')} `));
}

export class ModerationEngine {
  hash(text: string): string {
    return createHash('sha256').update(normalize(text)).digest('hex');
  }

  /**
   * Classifica um comentário. Ordem: tamanho → dados pessoais → ameaças/ódio → ofensas → spam
   * → acusações graves → juízos ambíguos → publicado. `isRepeat` indica que o mesmo autor já
   * enviou este texto recentemente (decidido pelo chamador, que tem acesso à base de dados).
   */
  classify(text: string, isRepeat = false): ModerationResult {
    const original = text.trim();
    const done = (status: ModerationStatus, reason?: ModerationReason): ModerationResult =>
      reason ? { status, reason, message: MESSAGES[reason] } : { status };

    if (original.length > MAX_COMMENT_LENGTH) return done('BLOCKED', 'TOO_LONG');

    const lowered = original.toLowerCase();
    if (PERSONAL_DATA_PATTERNS.some((p) => p.regex.test(lowered))) return done('BLOCKED', 'PERSONAL_DATA');

    const n = normalize(original);
    if (containsTerm(n, THREAT_OR_HATE_TERMS)) return done('BLOCKED', 'THREAT_OR_HATE');
    if (containsTerm(n, OFFENSIVE_TERMS)) return done('BLOCKED', 'OFFENSIVE');
    if (this.looksLikeSpam(original, n) || isRepeat) return done('BLOCKED', 'SPAM');
    if (containsTerm(n, SERIOUS_ACCUSATION_TERMS)) return done('PENDING_REVIEW', 'SERIOUS_ACCUSATION');
    if (containsTerm(n, AMBIGUOUS_TERMS)) return done('PENDING_REVIEW', 'POSSIBLE_PERSONAL_ATTACK');
    return done('PUBLISHED');
  }

  private looksLikeSpam(original: string, n: string): boolean {
    const words = n.split(' ').filter(Boolean);
    if (words.length === 0) return true;
    // Quase sem letras (só símbolos/números)
    if ((n.match(/[a-z]/g) ?? []).length < 3) return true;
    // Uma palavra repetida muitas vezes ("bom bom bom bom bom")
    if (words.length >= 5 && new Set(words).size / words.length < 0.4) return true;
    // Letras repetidas em excesso no original ("aaaaaaaa", "booooom" é aceite: só 6+ iguais)
    if (/(.)\1{5,}/.test(original)) return true;
    // Texto longo todo em maiúsculas (gritar)
    const letters = original.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (letters.length >= 25 && letters === letters.toUpperCase()) return true;
    return false;
  }
}
