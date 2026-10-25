/**
 * Motor de detecção de contactos — Camada 1 (Regex)
 * DDR 1.2 — Protecção do modelo de negócio GoHome
 *
 * Objectivo: impedir que anunciantes partilhem contactos directos
 * (telefone, WhatsApp, email, redes sociais) nos campos de texto.
 */

export type TipoDeteccao =
  | 'telefone'
  | 'email'
  | 'url'
  | 'rede_social'
  | 'palavra_chave'
  | 'ofuscacao';

export interface Deteccao {
  tipo: TipoDeteccao;
  valor: string;        // Texto exacto encontrado
  posicao: number;      // Índice no texto original
  confianca: number;    // 0-100 (quanto mais alto, mais certo)
  motivo: string;       // Explicação legível
}

export interface ResultadoDeteccao {
  temContactos: boolean;
  deteccoes: Deteccao[];
  textoLimpo: string;   // Texto com matches destacados [MATCH]...[/MATCH]
}

// ============================================================
// REGEX — NÚMEROS DE TELEFONE MOÇAMBICANOS
// ============================================================

// Prefixos válidos de operadoras moçambicanas (82-87)
const PREFIXOS_VALIDOS = ['82', '83', '84', '85', '86', '87'];

/**
 * Regex para números com código internacional +258
 * Captura: +258841234567, +258 84 123 4567, +258-84-1234567, etc.
 */
const REGEX_TELEFONE_INTERNACIONAL = /(?:\+|00)\s*258[\s.\-]*((?:8[2-7])[\s.\-]*\d{3}[\s.\-]*\d{4})/gi;

/**
 * Regex para números sem código (apenas 9 dígitos começando por 82-87)
 * Captura: 841234567, 84 123 4567, 84-1234567, (84) 1234567
 * REQUER contexto para evitar falsos positivos com áreas (84 m²)
 */
const REGEX_TELEFONE_LOCAL = /(?<![0-9])\(?(8[2-7])\)?[\s.\-]*(\d{3})[\s.\-]*(\d{4})(?![0-9])/g;

/**
 * Contextos que indicam que o número é mesmo telefone (não área, preço, etc.)
 */
const CONTEXTOS_TELEFONE = [
  'tel', 'tele', 'telef', 'telefone', 'telemóvel', 'telem',
  'cel', 'celular', 'num', 'número', 'numero',
  'contact', 'contacto', 'contactar',
  'liga', 'ligue', 'ligar', 'chama', 'chamar',
  'whats', 'whatsapp', 'wpp', 'zap',
  'messa', 'mensagem', 'sms',
  'fala', 'falar',
];

/**
 * Contextos que indicam que NÃO é telefone (área, m², número de porta, etc.)
 */
const CONTEXTOS_NAO_TELEFONE = [
  'm²', 'm2', 'metros', 'metro quadrado', 'quadrados',
  'quartos', 'wc', 'casas de banho',
  'andar', 'piso', 'apartamento n',
  'ano', 'anos', 'mes', 'meses',
  'mt', 'meticais', 'preço',
];

// ============================================================
// REGEX — EMAILS
// ============================================================

const REGEX_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// ============================================================
// REGEX — URLs
// ============================================================

const REGEX_URL = /(?:https?:\/\/|www\.)[^\s<>"]+|[a-zA-Z0-9.-]+\.(?:com|co\.mz|net|org|co|me|io|pt|br)(?:\/[^\s]*)?/gi;

// ============================================================
// REGEX — REDES SOCIAIS (handles @)
// ============================================================

const REGEX_HANDLE_REDE_SOCIAL = /@[a-zA-Z0-9_.]{3,}/g;
const REGEX_URL_REDE_SOCIAL = /(?:instagram|facebook|fb|tiktok|twitter|x\.com|snapchat|telegram|linkedin|youtube)[.\/]/gi;

// ============================================================
// PALAVRAS-CHAVE SUSPEITAS
// ============================================================

const PALAVRAS_SUSPEITAS: Record<string, { confianca: number; motivo: string }> = {
  'whatsapp': { confianca: 95, motivo: 'Menção a WhatsApp' },
  'whats': { confianca: 90, motivo: 'Menção a WhatsApp (abreviado)' },
  'wpp': { confianca: 85, motivo: 'Abreviatura de WhatsApp' },
  'zap': { confianca: 70, motivo: 'Abreviatura informal de WhatsApp' },

  'contacte': { confianca: 70, motivo: 'Pede para contactar' },
  'contactar fora': { confianca: 95, motivo: 'Pede para contactar fora da app' },
  'fala comigo': { confianca: 75, motivo: 'Pede contacto directo' },
  'liga para': { confianca: 80, motivo: 'Pede chamada' },
  'ligue para': { confianca: 80, motivo: 'Pede chamada' },
  'ligar para mim': { confianca: 85, motivo: 'Pede chamada directa' },
  'chama no': { confianca: 70, motivo: 'Pede contacto directo' },
  'chamar no': { confianca: 70, motivo: 'Pede contacto directo' },

  'meu numero': { confianca: 90, motivo: 'Partilha número directo' },
  'meu número': { confianca: 90, motivo: 'Partilha número directo' },
  'meu tel': { confianca: 85, motivo: 'Partilha telefone directo' },
  'meu telefone': { confianca: 90, motivo: 'Partilha telefone directo' },
  'meu celular': { confianca: 90, motivo: 'Partilha celular directo' },
  'nº:': { confianca: 70, motivo: 'Possível partilha de número' },
  'tel:': { confianca: 85, motivo: 'Possível partilha de telefone' },
  'cel:': { confianca: 85, motivo: 'Possível partilha de celular' },

  'instagram': { confianca: 80, motivo: 'Menção a rede social externa' },
  'facebook': { confianca: 80, motivo: 'Menção a rede social externa' },
  'tiktok': { confianca: 80, motivo: 'Menção a rede social externa' },
  'telegram': { confianca: 80, motivo: 'Menção a app de mensagens externa' },
};

// ============================================================
// OFUSCAÇÃO — DÍGITOS ESCRITOS POR EXTENSO
// ============================================================

const DIGITOS_EXTENSO: Record<string, string> = {
  'zero': '0', 'um': '1', 'uma': '1', 'dois': '2', 'duas': '2',
  'três': '3', 'tres': '3', 'quatro': '4', 'cinco': '5',
  'seis': '6', 'sete': '7', 'oito': '8', 'nove': '9',
};

/**
 * Detecta sequências como "oito quatro um dois três" ou "8 4 1 2 3"
 */
function detectarOfuscacao(texto: string): Deteccao[] {
  const deteccoes: Deteccao[] = [];
  const textoLower = texto.toLowerCase();

  // 1. Dígitos escritos por extenso em sequência (≥5 em sequência)
  const padraoExtenso = new RegExp(
    `(?:${Object.keys(DIGITOS_EXTENSO).join('|')})(?:[\\s\\-,]+(?:${Object.keys(DIGITOS_EXTENSO).join('|')})){4,}`,
    'gi'
  );
  let match;
  while ((match = padraoExtenso.exec(textoLower)) !== null) {
    deteccoes.push({
      tipo: 'ofuscacao',
      valor: match[0],
      posicao: match.index,
      confianca: 90,
      motivo: 'Sequência de dígitos escritos por extenso (possível telefone)',
    });
  }

  // 2. Dígitos isolados separados por espaços: "8 4 1 2 3 4 5 6 7"
  const padraoDigitosEspacados = /(?<![0-9])(\d\s+){5,}\d(?![0-9])/g;
  while ((match = padraoDigitosEspacados.exec(texto)) !== null) {
    const soDigitos = match[0].replace(/\s/g, '');
    if (soDigitos.length >= 7 && PREFIXOS_VALIDOS.includes(soDigitos.substring(0, 2))) {
      deteccoes.push({
        tipo: 'ofuscacao',
        valor: match[0].trim(),
        posicao: match.index,
        confianca: 85,
        motivo: 'Dígitos separados por espaços (possível telefone ofuscado)',
      });
    }
  }

  return deteccoes;
}

// ============================================================
// DETECÇÃO DE TELEFONES (COM VALIDAÇÃO DE CONTEXTO)
// ============================================================

/**
 * Verifica se os caracteres em volta sugerem que é mesmo telefone
 * ou um falso positivo (área, preço, nº de porta)
 */
function analisarContextoNumero(texto: string, posicao: number, tamanho: number): {
  pareceTelefone: boolean;
  motivo: string;
} {
  const antes = texto.substring(Math.max(0, posicao - 40), posicao).toLowerCase();
  const depois = texto.substring(posicao + tamanho, posicao + tamanho + 20).toLowerCase();

  // Verifica contextos que NÃO são telefone
  for (const contexto of CONTEXTOS_NAO_TELEFONE) {
    if (depois.includes(contexto) || antes.includes(contexto)) {
      return { pareceTelefone: false, motivo: `Contexto indica ${contexto}, não telefone` };
    }
  }

  // Verifica contextos que SÃO telefone
  for (const contexto of CONTEXTOS_TELEFONE) {
    if (antes.includes(contexto)) {
      return { pareceTelefone: true, motivo: `Precedido por "${contexto}"` };
    }
  }

  // Sem contexto claro — depende do formato
  // 9 dígitos consecutivos começando por 82-87 é muito provavelmente telefone
  return { pareceTelefone: true, motivo: 'Formato de número de telemóvel moçambicano' };
}

function detectarTelefones(texto: string): Deteccao[] {
  const deteccoes: Deteccao[] = [];
  let match;

  // 1. Telefones internacionais (+258) — alta confiança
  REGEX_TELEFONE_INTERNACIONAL.lastIndex = 0;
  while ((match = REGEX_TELEFONE_INTERNACIONAL.exec(texto)) !== null) {
    deteccoes.push({
      tipo: 'telefone',
      valor: match[0],
      posicao: match.index,
      confianca: 100,
      motivo: 'Número com código internacional (+258)',
    });
  }

  // 2. Telefones locais (9 dígitos) — validar contexto
  REGEX_TELEFONE_LOCAL.lastIndex = 0;
  while ((match = REGEX_TELEFONE_LOCAL.exec(texto)) !== null) {
    const prefixo = match[1];
    if (!PREFIXOS_VALIDOS.includes(prefixo)) continue;

    // Evitar duplicação com os internacionais já detectados
    const jaDetectado = deteccoes.some(d =>
      d.posicao <= match!.index && d.posicao + d.valor.length >= match!.index + match![0].length
    );
    if (jaDetectado) continue;

    const contexto = analisarContextoNumero(texto, match.index, match[0].length);
    if (contexto.pareceTelefone) {
      deteccoes.push({
        tipo: 'telefone',
        valor: match[0],
        posicao: match.index,
        confianca: contexto.motivo.includes('Precedido por') ? 95 : 80,
        motivo: contexto.motivo,
      });
    }
  }

  return deteccoes;
}

// ============================================================
// DETECÇÃO DE EMAILS, URLs E REDES SOCIAIS
// ============================================================

function detectarEmails(texto: string): Deteccao[] {
  const deteccoes: Deteccao[] = [];
  let match;
  REGEX_EMAIL.lastIndex = 0;
  while ((match = REGEX_EMAIL.exec(texto)) !== null) {
    deteccoes.push({
      tipo: 'email',
      valor: match[0],
      posicao: match.index,
      confianca: 100,
      motivo: 'Endereço de email',
    });
  }
  return deteccoes;
}

function detectarURLs(texto: string): Deteccao[] {
  const deteccoes: Deteccao[] = [];
  let match;

  REGEX_URL.lastIndex = 0;
  while ((match = REGEX_URL.exec(texto)) !== null) {
    deteccoes.push({
      tipo: 'url',
      valor: match[0],
      posicao: match.index,
      confianca: 90,
      motivo: 'Link ou website',
    });
  }

  REGEX_HANDLE_REDE_SOCIAL.lastIndex = 0;
  while ((match = REGEX_HANDLE_REDE_SOCIAL.exec(texto)) !== null) {
    // Evitar @email que já foi apanhado
    const antes = texto.substring(Math.max(0, match.index - 1), match.index);
    if (antes === '.' || /[a-zA-Z]/.test(antes)) continue;

    deteccoes.push({
      tipo: 'rede_social',
      valor: match[0],
      posicao: match.index,
      confianca: 75,
      motivo: 'Handle de rede social (@)',
    });
  }

  return deteccoes;
}

// ============================================================
// DETECÇÃO DE PALAVRAS-CHAVE SUSPEITAS
// ============================================================

function detectarPalavrasChave(texto: string): Deteccao[] {
  const deteccoes: Deteccao[] = [];
  const textoLower = texto.toLowerCase();

  for (const [palavra, info] of Object.entries(PALAVRAS_SUSPEITAS)) {
    let indice = 0;
    while ((indice = textoLower.indexOf(palavra, indice)) !== -1) {
      // Verificar que é palavra inteira (word boundary)
      const antes = indice > 0 ? textoLower[indice - 1] : ' ';
      const depois = indice + palavra.length < textoLower.length ? textoLower[indice + palavra.length] : ' ';
      const limitePalavra = /[\s.,!?;:()\[\]{}'"]/;

      if (
        (limitePalavra.test(antes) || indice === 0) &&
        (limitePalavra.test(depois) || indice + palavra.length === textoLower.length)
      ) {
        deteccoes.push({
          tipo: 'palavra_chave',
          valor: texto.substring(indice, indice + palavra.length),
          posicao: indice,
          confianca: info.confianca,
          motivo: info.motivo,
        });
      }
      indice += palavra.length;
    }
  }

  return deteccoes;
}

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

/**
 * Analisa um texto e detecta todas as tentativas de partilha de contactos.
 * @param texto Texto a analisar (título, descrição, etc.)
 * @param limiarConfianca Confiança mínima para considerar válido (default 70)
 */
export function detectarContactos(texto: string, limiarConfianca: number = 70): ResultadoDeteccao {
  if (!texto || texto.trim().length < 3) {
    return { temContactos: false, deteccoes: [], textoLimpo: texto };
  }

  const todasDeteccoes: Deteccao[] = [
    ...detectarTelefones(texto),
    ...detectarEmails(texto),
    ...detectarURLs(texto),
    ...detectarPalavrasChave(texto),
    ...detectarOfuscacao(texto),
  ];

  // Filtrar por limiar de confiança
  const deteccoesValidas = todasDeteccoes.filter(d => d.confianca >= limiarConfianca);

  // Ordenar por posição no texto
  deteccoesValidas.sort((a, b) => a.posicao - b.posicao);

  // Remover duplicados sobrepostos (manter o de maior confiança)
  const unicos: Deteccao[] = [];
  for (const d of deteccoesValidas) {
    const sobreposto = unicos.find(u =>
      (d.posicao >= u.posicao && d.posicao < u.posicao + u.valor.length) ||
      (u.posicao >= d.posicao && u.posicao < d.posicao + d.valor.length)
    );
    if (!sobreposto) {
      unicos.push(d);
    } else if (d.confianca > sobreposto.confianca) {
      const index = unicos.indexOf(sobreposto);
      unicos[index] = d;
    }
  }

  // Construir texto com marcações
  let textoLimpo = texto;
  const ordenadosDescendente = [...unicos].sort((a, b) => b.posicao - a.posicao);
  for (const d of ordenadosDescendente) {
    textoLimpo =
      textoLimpo.substring(0, d.posicao) +
      `[MATCH]${d.valor}[/MATCH]` +
      textoLimpo.substring(d.posicao + d.valor.length);
  }

  return {
    temContactos: unicos.length > 0,
    deteccoes: unicos,
    textoLimpo,
  };
}

// ============================================================
// HELPERS DE APRESENTAÇÃO
// ============================================================

export function labelTipoDeteccao(tipo: TipoDeteccao): string {
  const labels: Record<TipoDeteccao, string> = {
    telefone: 'Telefone',
    email: 'Email',
    url: 'Link / website',
    rede_social: 'Rede social',
    palavra_chave: 'Palavra suspeita',
    ofuscacao: 'Número ofuscado',
  };
  return labels[tipo];
}

export function iconeTipoDeteccao(tipo: TipoDeteccao): string {
  const icones: Record<TipoDeteccao, string> = {
    telefone: 'phone',
    email: 'email',
    url: 'link-variant',
    rede_social: 'account-circle',
    palavra_chave: 'alert-circle',
    ofuscacao: 'eye-off',
  };
  return icones[tipo];
}

export function corTipoDeteccao(tipo: TipoDeteccao): string {
  const cores: Record<TipoDeteccao, string> = {
    telefone: '#D32F2F',
    email: '#D32F2F',
    url: '#F57C00',
    rede_social: '#F57C00',
    palavra_chave: '#FBC02D',
    ofuscacao: '#D32F2F',
  };
  return cores[tipo];
}