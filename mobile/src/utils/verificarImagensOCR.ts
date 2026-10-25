/**
 * Verificação OCR das imagens — Simulação (Fase C.2)
 *
 * Em produção, esta função chamará um backend com Tesseract/EasyOCR
 * que devolve o texto extraído de cada imagem.
 * Por agora, SIMULA o processo durante 3-5s.
 *
 * O texto "extraído" é passado pelo motor de regex já existente
 * (detectarContactos) para encontrar telefones, emails, etc.
 */

import { detectarContactos, Deteccao } from './detectarContactos';

export type EstadoFotoOCR = 'limpa' | 'suspeita' | 'bloqueada';
export type ModoSimulacao = 'auto' | 'limpo' | 'suspeito' | 'bloqueado';

export interface EtapaProcessamento {
  nome: string;
  duracaoMs: number;
}

export interface ResultadoFotoOCR {
  uri: string;
  indice: number;              // 0-based
  estado: EstadoFotoOCR;
  textoDetectado: string;      // Texto "OCR" extraído da foto
  deteccoes: Deteccao[];       // Contactos detectados pelo regex
  confiancaMedia: number;      // 0-100
}

export interface ResultadoVerificacaoOCR {
  totalFotos: number;
  fotos: ResultadoFotoOCR[];
  temBloqueadas: boolean;
  temSuspeitas: boolean;
  todasLimpas: boolean;
}

/**
 * Etapas visuais do processamento de cada foto.
 * Total ≈ 800ms por foto (ajustável).
 */
export const ETAPAS_OCR: EtapaProcessamento[] = [
  { nome: 'A analisar imagem...', duracaoMs: 300 },
  { nome: 'A extrair texto (OCR)...', duracaoMs: 350 },
  { nome: 'A verificar contactos...', duracaoMs: 250 },
];

/**
 * Textos simulados para cada cenário de teste.
 * Em produção, viriam do OCR real.
 */
const TEXTOS_SIMULADOS = {
  limpo: [
    '',
    'Rua da Beira',
    'Cozinha equipada',
    'Vista para o mar',
    'Zona tranquila',
    'Garagem fechada',
  ],
  suspeito: [
    'contacte-me para mais informações',
    'liga sem compromisso',
    'informações pela app',
    'disponível para visitar',
  ],
  bloqueado: [
    'WhatsApp: 84 123 4567',
    'Tel: +258 85 987 6543',
    'Chama 841234567',
    'Instagram: @casa.beira',
    'Email: dono@gmail.com',
  ],
};

/**
 * Decide o modo de cada foto consoante o modoSimulacao.
 */
function escolherModoFoto(
  indice: number,
  modo: ModoSimulacao
): 'limpo' | 'suspeito' | 'bloqueado' {
  if (modo === 'limpo') return 'limpo';
  if (modo === 'suspeito') {
    // Primeira foto suspeita, resto limpo
    return indice === 0 ? 'suspeito' : 'limpo';
  }
  if (modo === 'bloqueado') {
    // Primeira foto bloqueada, resto limpo
    return indice === 0 ? 'bloqueado' : 'limpo';
  }
  // Modo auto: aleatório ponderado (90% limpo, 7% suspeito, 3% bloqueado)
  const r = Math.random();
  if (r < 0.9) return 'limpo';
  if (r < 0.97) return 'suspeito';
  return 'bloqueado';
}

/**
 * Simula a análise de UMA foto.
 */
function simularAnaliseFoto(
  uri: string,
  indice: number,
  modo: ModoSimulacao
): ResultadoFotoOCR {
  const modoFoto = escolherModoFoto(indice, modo);
  const textos = TEXTOS_SIMULADOS[modoFoto];
  const textoDetectado = textos[indice % textos.length];

  // Passa o texto "extraído" pelo motor regex
  const resultadoRegex = textoDetectado
    ? detectarContactos(textoDetectado, 60) // Limiar mais baixo para fotos
    : { temContactos: false, deteccoes: [], textoLimpo: '' };

  let estado: EstadoFotoOCR = 'limpa';
  let confiancaMedia = 0;

  if (resultadoRegex.temContactos) {
    confiancaMedia = Math.max(...resultadoRegex.deteccoes.map(d => d.confianca));
    estado = confiancaMedia >= 80 ? 'bloqueada' : 'suspeita';
  }

  return {
    uri,
    indice,
    estado,
    textoDetectado,
    deteccoes: resultadoRegex.deteccoes,
    confiancaMedia,
  };
}

/**
 * Função principal — analisa todas as fotos em sequência.
 *
 * @param fotos URIs das fotos
 * @param modo  Modo de simulação (auto por defeito)
 * @param onProgresso Callback chamado a cada foto processada:
 *                    (indiceFoto, totalFotos, resultadoFoto) => void
 */
export async function verificarImagensOCR(
  fotos: string[],
  modo: ModoSimulacao = 'auto',
  onProgresso?: (
    indice: number,
    total: number,
    resultado: ResultadoFotoOCR
  ) => void
): Promise<ResultadoVerificacaoOCR> {
  const resultados: ResultadoFotoOCR[] = [];
  const duracaoPorFoto = ETAPAS_OCR.reduce((soma, e) => soma + e.duracaoMs, 0);

  for (let i = 0; i < fotos.length; i++) {
    // Simula o tempo de processamento
    await new Promise(resolve => setTimeout(resolve, duracaoPorFoto));

    const resultadoFoto = simularAnaliseFoto(fotos[i], i, modo);
    resultados.push(resultadoFoto);

    if (onProgresso) {
      onProgresso(i + 1, fotos.length, resultadoFoto);
    }
  }

  return {
    totalFotos: fotos.length,
    fotos: resultados,
    temBloqueadas: resultados.some(r => r.estado === 'bloqueada'),
    temSuspeitas: resultados.some(r => r.estado === 'suspeita'),
    todasLimpas: resultados.every(r => r.estado === 'limpa'),
  };
}

/**
 * Devolve o número de fotos por estado.
 */
export function contarPorEstado(resultado: ResultadoVerificacaoOCR) {
  return {
    limpas: resultado.fotos.filter(f => f.estado === 'limpa').length,
    suspeitas: resultado.fotos.filter(f => f.estado === 'suspeita').length,
    bloqueadas: resultado.fotos.filter(f => f.estado === 'bloqueada').length,
  };
}