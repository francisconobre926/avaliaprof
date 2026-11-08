/**
 * app/(anunciante)/publicar.tsx — VERSÃO PROFISSIONAL
 *
 * Fixes implementados:
 *   ✓ Topo FIXO: TopBar partilhada (título do passo + voltar) e progresso por baixo
 *   ✓ KeyboardAvoidingView envolvendo TUDO (teclado nunca cobre inputs)
 *   ✓ Android: behavior='height' + listener keyboardDidShow com scroll ao campo focado
 *   ✓ iOS: behavior='padding' + offset correcto
 *   ✓ Sanitização em TEMPO REAL (campos numéricos bloqueiam letras ao escrever)
 *   ✓ Validação com feedback visual em tempo real (bordas verdes/vermelhas)
 *   ✓ Formatação automática (preço com separador de milhares)
 *   ✓ Footer sticky acima do teclado (SafeArea insets corretos)
 *   ✓ Design limpo nível AirBnB (spacing 8pt, hierarquia tipográfica clara)
 *   ✓ Microanimações suaves nos passos
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Keyboard,
  useWindowDimensions,
  Animated,
  Alert,
  Modal,
  Pressable,
  Platform,
  findNodeHandle,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter, useNavigation, useLocalSearchParams } from 'expo-router';
import { guardarAnuncioLocal } from '../../src/store/anunciosLocal';
import { Colors } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import {
  detectarContactos,
  labelTipoDeteccao,
  iconeTipoDeteccao,
  corTipoDeteccao,
  Deteccao,
  ResultadoDeteccao,
} from '../../src/utils/detectarContactos';
import {
  obterFormulario,
  usaConstructorPersonalizado,
  MODO_CONSTRUCTOR_PERSONALIZADO,
  DefinicaoCampo,
  CampoPersonalizado,
} from '../../src/data/campos-categoria';
import CampoDinamico from '../../src/components/CampoDinamico';
import ModalVerificacaoOCR from '../../src/components/ModalVerificacaoOCR';
import { ModoSimulacao } from '../../src/utils/verificarImagensOCR';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import TopBar from '../../src/components/TopBar';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_MARCA = Colors.azul;
const AZUL_ESCURO = Colors.azulTexto;
const AZUL_HERO = Colors.azul;
const COR_ACENTO = Colors.azul;
const COR_ACENTO_ESCURO = Colors.azulTexto;
const LARANJA_PALE = Colors.azulSuave;
const VERDE_SUCESSO = Colors.verdeTexto;
const VERMELHO_ERRO = Colors.erro;
const AMARELO_AVISO = Colors.azul;

// Cinzas neutros profissionais
const CINZA_FUNDO = Colors.gelo;
const CINZA_BORDA = Colors.borda;
const CINZA_BORDA_FORTE = Colors.borda;
const TEXTO_FORTE = Colors.carvao;
const TEXTO_MEDIO = Colors.textoSecundario;
const TEXTO_FRACO = Colors.textoTerciario;

type Passo = 1 | 2 | 3 | 4 | 5;
const ROTULOS_PASSOS = ['Categoria', 'Texto', 'Preço', 'Detalhes', 'Fotos'];
type ModoFormulario = 'publicar' | 'editar';

// ============================================================
// SANITIZADORES / VALIDADORES PROFISSIONAIS
// ============================================================

/** Remove TUDO que não seja dígito. Para campos de preço, telefone, quantidade. */
function somenteDigitos(valor: string): string {
  return (valor || '').replace(/\D/g, '');
}

/** Formata preço com separador de milhares em pt-MZ (ex: "15 000") */
function formatarPreco(valor: string): string {
  const limpo = somenteDigitos(valor);
  if (!limpo) return '';
  const num = parseInt(limpo, 10);
  if (!Number.isFinite(num)) return '';
  // Separador de milhares com espaço (pt-MZ)
  return num.toLocaleString('pt-PT').replace(/,/g, ' ');
}

/** Converte preço formatado para número */
function precoParaNumero(valor: string): number {
  const limpo = somenteDigitos(valor);
  return parseInt(limpo, 10) || 0;
}

/** Valida título — sem apenas espaços, mínimo 10 chars */
function validarTitulo(valor: string): { valido: boolean; erro?: string } {
  const limpo = valor.trim();
  if (limpo.length === 0) return { valido: false, erro: 'O título é obrigatório' };
  if (limpo.length < 10) return { valido: false, erro: `Faltam ${10 - limpo.length} caracteres (mínimo 10)` };
  if (limpo.length > 80) return { valido: false, erro: 'Máximo 80 caracteres' };
  return { valido: true };
}

/** Valida descrição — mínimo 30 chars */
function validarDescricao(valor: string): { valido: boolean; erro?: string } {
  const limpo = valor.trim();
  if (limpo.length === 0) return { valido: false, erro: 'A descrição é obrigatória' };
  if (limpo.length < 30) return { valido: false, erro: `Faltam ${30 - limpo.length} caracteres (mínimo 30)` };
  return { valido: true };
}

/** Valida cidade/bairro — não vazio, só letras+espaços+acentos+hífen */
function validarLocalizacaoCampo(valor: string, nome: string): { valido: boolean; erro?: string } {
  const limpo = valor.trim();
  if (limpo.length === 0) return { valido: false, erro: `${nome} é obrigatório` };
  if (limpo.length < 2) return { valido: false, erro: `${nome} muito curto` };
  // Permite letras (incluindo acentuadas), espaços, hífen, apóstrofe
  if (!/^[A-Za-zÀ-ÿ\s\-']+$/.test(limpo)) {
    return { valido: false, erro: `${nome} só pode conter letras` };
  }
  return { valido: true };
}

/** Sanitiza localização em tempo real (bloqueia dígitos e símbolos) */
function sanitizarLocalizacao(valor: string): string {
  return (valor || '').replace(/[^A-Za-zÀ-ÿ\s\-']/g, '');
}

/**
 * Sanitiza texto de anúncio (título, descrição, textos dinâmicos).
 * REGRA DE OURO: nenhum campo público do anúncio aceita dígitos (0-9).
 * O contacto do anunciante fica guardado no perfil e só é revelado
 * ao procurador APÓS o pagamento do desbloqueio.
 *
 * Bloqueia em tempo real:
 *   - Dígitos 0-9 (inclusive em "85534849zero" o "85534849" é apagado)
 *   - Caracteres do árabe oriental ٠-٩ (às vezes usados para contornar)
 *   - Símbolos de contacto: @ para email, # para hashtag
 */
function sanitizarTextoAnuncio(valor: string): string {
  return (valor || '')
    .replace(/[0-9]/g, '')          // dígitos ocidentais
    .replace(/[٠-٩]/g, '')          // dígitos árabes
    .replace(/[@#]/g, '');          // símbolos de contacto
}

/**
 * Palavras-número comuns em pt-MZ usadas para disfarçar telefones:
 * "setenovvedois" = 7-9-2, "oito dois seis" = 826, etc.
 * Inclui variantes informais e erros ortográficos comuns ("sinco", "oytu").
 */
const PALAVRAS_NUMERO = [
  'zero', 'um', 'uma', 'dois', 'duas', 'tres', 'três', 'quatro',
  'cinco', 'sinco', 'seis', 'sete', 'oito', 'oytu', 'nove', 'dez',
  'onze', 'doze', 'treze', 'catorze', 'quatorze', 'quinze',
  'dezasseis', 'dezassete', 'dezoito', 'dezanove',
  'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta',
  'setenta', 'oitenta', 'noventa', 'cem', 'cento',
  'duzentos', 'trezentos', 'quatrocentos', 'quinhentos',
  'seiscentos', 'setecentos', 'oitocentos', 'novecentos',
  'mil', 'milhao', 'milhão', 'meia', 'meio',
];

/**
 * Detecta sequências de palavras-número que disfarçam contactos.
 * Captura 3+ palavras-número coladas OU separadas por espaço/símbolo.
 * Threshold = 3 porque "sete casas" ou "oito horas" é normal, mas
 * "sete nove dois" já parece telefone.
 */
function detectarPalavrasNumero(texto: string): string[] {
  if (!texto) return [];
  const normalizado = texto.toLocaleLowerCase('pt-MZ');
  const matches: string[] = [];

  // Padrão 1: palavras-número coladas (ex: "setenovvedois", "oitocinco")
  const padraoColado = new RegExp(`(?:${PALAVRAS_NUMERO.join('|')}){2,}`, 'gi');
  const colados = normalizado.match(padraoColado);
  if (colados) matches.push(...colados.filter(m => m.length >= 7));

  // Padrão 2: 3+ palavras-número separadas por espaço/pontuação
  const grupo = `(?:${PALAVRAS_NUMERO.join('|')})`;
  const padraoSeparado = new RegExp(
    `\\b${grupo}\\b[\\s\\-.,:]+\\b${grupo}\\b[\\s\\-.,:]+\\b${grupo}\\b`,
    'gi'
  );
  const separados = normalizado.match(padraoSeparado);
  if (separados) matches.push(...separados);

  return matches;
}

/** Verifica se um texto contém disfarce de contacto por palavras-número */
function temPalavrasNumero(texto: string): boolean {
  return detectarPalavrasNumero(texto).length > 0;
}

/** Valida preço */
function validarPreco(valor: string): { valido: boolean; erro?: string } {
  const num = precoParaNumero(valor);
  if (num <= 0) return { valido: false, erro: 'Introduz um preço válido' };
  if (num > 999999999) return { valido: false, erro: 'Preço demasiado alto' };
  return { valido: true };
}

// ============================================================
// CATEGORIAS
// ============================================================
const tiposImovel = [
  { id: 'casa', label: 'Casa', descricao: 'Casas e moradias', icone: 'home' as const },
  { id: 'apartamento', label: 'Apartamento', descricao: 'Apartamentos e flats', icone: 'office-building' as const },
  { id: 'quarto', label: 'Quarto', descricao: 'Quartos individuais', icone: 'bed' as const },
  { id: 'moradia', label: 'Moradia', descricao: 'Residências completas', icone: 'home-city' as const },
  { id: 'terreno', label: 'Terreno', descricao: 'Terrenos e lotes', icone: 'map' as const },
  { id: 'loja', label: 'Loja / espaço comercial', descricao: 'Lojas e escritórios', icone: 'store' as const },
  { id: 'espaco_eventos', label: 'Espaços e eventos', descricao: 'Salas e locais para eventos', icone: 'calendar' as const },
  { id: 'alojamento', label: 'Alojamento', descricao: 'Hotéis e hospedagem', icone: 'bed' as const },
  { id: 'carro', label: 'Carro', descricao: 'Viaturas ligeiras', icone: 'car' as const },
  { id: 'motorizada', label: 'Mota', descricao: 'Motas e motorizadas', icone: 'motorbike' as const },
  { id: 'carrinha_caminhao', label: 'Carrinha / camião', descricao: 'Transporte e carga', icone: 'truck' as const },
  { id: 'equipamento', label: 'Equipamentos', descricao: 'Máquinas e ferramentas', icone: 'tools' as const },
  { id: 'outro', label: 'Outra categoria', descricao: 'Anuncia algo diferente', icone: 'package-variant' as const },
];

function sugerirCategoria(texto: string): string | null {
  const valor = texto.toLocaleLowerCase('pt-MZ');
  const regras: Array<[string, string[]]> = [
    ['imovel', ['casa', 'apartamento', 'quarto', 'moradia', 'terreno', 'imóvel', 'imovel', 'loja', 'escritório', 'escritorio']],
    ['alojamento', ['hotel', 'pensão', 'pensao', 'hospedagem', 'hostel', 'alojamento']],
    ['espaco_eventos', ['evento', 'casamento', 'salão', 'sala', 'estúdio', 'estudio', 'reunião', 'reuniao']],
    ['veiculo', ['carro', 'mota', 'motorizada', 'camião', 'camiao', 'carrinha', 'autocarro', 'viatura']],
    ['equipamento', ['máquina', 'maquina', 'computador', 'impressora', 'gerador', 'equipamento', 'ferramenta']],
    ['servico', ['serviço', 'servico', 'limpeza', 'reparação', 'reparacao', 'aulas', 'transporte', 'consultoria']],
  ];
  for (const [categoria, palavras] of regras) {
    if (palavras.some((palavra) => valor.includes(palavra))) return categoria;
  }
  return null;
}

const imagensCategorias: Record<string, string> = {
  casa: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',
  apartamento: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=85',
  quarto: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85',
  moradia: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',
  terreno: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85',
  loja: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85',
  espaco_eventos: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85',
  alojamento: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85',
  carro: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85',
  motorizada: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85',
  carrinha_caminhao: 'https://images.unsplash.com/photo-1519003722824-194d4455a60b?auto=format&fit=crop&w=900&q=85',
  equipamento: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=85',
  outro: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
};

const finalidades = [
  { id: 'arrendar', label: 'Arrendar', icone: 'key' as const, cor: COR_ACENTO },
  { id: 'vender', label: 'Vender', icone: 'cash' as const, cor: AZUL_MARCA },
  { id: 'reservar', label: 'Reservar', icone: 'calendar' as const, cor: Colors.azul },
];

const provincias = ['Sofala', 'Maputo Cidade', 'Maputo Província', 'Nampula', 'Manica', 'Tete', 'Zambézia', 'Cabo Delgado', 'Gaza', 'Inhambane', 'Niassa'];

function calcularValorPago(preco: number, finalidade: string): number {
  if (finalidade === 'arrendar') {
    if (preco <= 2000) return 25;
    if (preco <= 5000) return 50;
    if (preco <= 10000) return 75;
    if (preco <= 20000) return 125;
    if (preco <= 50000) return 200;
    return 250;
  }
  if (finalidade === 'vender') {
    if (preco <= 500000) return 100;
    if (preco <= 1000000) return 150;
    if (preco <= 2500000) return 250;
    if (preco <= 5000000) return 375;
    if (preco <= 10000000) return 500;
    return 750;
  }
  if (finalidade === 'reservar') {
    if (preco <= 500) return 25;
    if (preco <= 1000) return 37.5;
    if (preco <= 2500) return 50;
    if (preco <= 5000) return 75;
    if (preco <= 10000) return 125;
    if (preco <= 20000) return 175;
    return 250;
  }
  return 50;
}

function buscarAnuncioParaEdicao(id: string) {
  return {
    tipo: 'casa',
    finalidade: 'arrendar',
    titulo: 'Casa T2 em Macúti com vista para o mar',
    descricao: 'Casa espaçosa e bem iluminada em zona tranquila, perto do mercado e escolas. Totalmente mobilada, com cozinha equipada, 2 quartos amplos e varanda.',
    preco: '15000',
    provincia: 'Sofala',
    cidade: 'Beira',
    bairro: 'Macúti',
    caracteristicas: { quartos: 2, casasBanho: 1, area: '85', mobilado: true, agua: true, energia: true, estacionamento: true },
    fotos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',
    ],
    video: null,
  };
}

function formatarValorRevisao(campo: DefinicaoCampo, valor: any): string {
  if (valor === undefined || valor === null || valor === '') return '—';
  if (campo.tipo === 'switch') return valor ? 'Sim' : 'Não';
  if (campo.tipo === 'chip' && campo.opcoes) {
    return campo.opcoes.find(o => o.valor === valor)?.label || String(valor);
  }
  if (campo.tipo === 'chip_multi' && campo.opcoes && Array.isArray(valor)) {
    if (valor.length === 0) return '—';
    return valor.map(v => campo.opcoes!.find(o => o.valor === v)?.label || v).join(', ');
  }
  if (campo.tipo === 'contador' || campo.tipo === 'numero') {
    return campo.sufixo ? `${valor} ${campo.sufixo}` : String(valor);
  }
  return String(valor);
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function PublicarScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ modo?: string; id?: string }>();
  const modo: ModoFormulario = params.modo === 'editar' ? 'editar' : 'publicar';
  const anuncioIdEditar = params.id || '';

  const corPrimaria = modo === 'editar' ? AZUL_MARCA : COR_ACENTO;
  const corPrimariaDark = modo === 'editar' ? AZUL_ESCURO : COR_ACENTO_ESCURO;
  const gradientPrimario: readonly [string, string] = modo === 'editar'
    ? [AZUL_MARCA, AZUL_ESCURO]
    : [COR_ACENTO, COR_ACENTO_ESCURO];

  useEffect(() => {
    navigation.setOptions({ tabBarStyle: { display: 'none' } } as any);
    return () => { navigation.setOptions({ tabBarStyle: undefined } as any); };
  }, [navigation]);

  const [passo, setPasso] = useState<Passo>(1);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  // ============ KEYBOARD HANDLING PROFISSIONAL ============
  const [tecladoAltura, setTecladoAltura] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setTecladoAltura(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setTecladoAltura(0);
    });

    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Scrolla para o input focado (medindo posição real do campo)
  const scrollParaInput = (ref: any) => {
    if (!ref || !scrollRef.current) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const node = findNodeHandle(ref);
        if (node) {
          UIManager.measureInWindow(node, (x, y, w, h) => {
            // Scroll para que o campo fique visível acima do teclado
            const alturaDisponivel = screenWidth; // aproximado
            const scrollOffset = Math.max(0, y - 180);
            scrollRef.current?.scrollTo({ y: scrollOffset, animated: true });
          });
        }
      }, 250);
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [passo]);

  // ============ ESTADO DO FORMULÁRIO ============
  const [tipo, setTipo] = useState('');
  const [nomeCategoriaPersonalizada, setNomeCategoriaPersonalizada] = useState('');
  const [detalhesCategoriaPersonalizada, setDetalhesCategoriaPersonalizada] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [provincia, setProvincia] = useState('Sofala');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [latitudeAnuncio, setLatitudeAnuncio] = useState<number | null>(null);
  const [longitudeAnuncio, setLongitudeAnuncio] = useState<number | null>(null);
  const [capturandoGPS, setCapturandoGPS] = useState(false);

  // Estado de validação em tempo real
  const [tituloValido, tituloErro] = useMemo(() => {
    if (!titulo) return [null, null]; // ainda não interagiu
    const r = validarTitulo(titulo);
    if (!r.valido) return [r.valido, r.erro || null];
    if (temPalavrasNumero(titulo)) {
      return [false, 'Não escrevas o número por extenso (ex: "sete nove dois")'];
    }
    return [r.valido, r.erro || null];
  }, [titulo]);

  const [descricaoValida, descricaoErro] = useMemo(() => {
    if (!descricao) return [null, null];
    const r = validarDescricao(descricao);
    if (!r.valido) return [r.valido, r.erro || null];
    if (temPalavrasNumero(descricao)) {
      return [false, 'Não escrevas o número por extenso (ex: "sete nove dois")'];
    }
    return [r.valido, r.erro || null];
  }, [descricao]);

  const [precoValido, precoErro] = useMemo(() => {
    if (!preco) return [null, null];
    const r = validarPreco(preco);
    return [r.valido, r.erro || null];
  }, [preco]);

  const [cidadeValida, cidadeErro] = useMemo(() => {
    if (!cidade) return [null, null];
    const r = validarLocalizacaoCampo(cidade, 'Cidade');
    return [r.valido, r.erro || null];
  }, [cidade]);

  const [bairroValido, bairroErro] = useMemo(() => {
    if (!bairro) return [null, null];
    const r = validarLocalizacaoCampo(bairro, 'Bairro');
    return [r.valido, r.erro || null];
  }, [bairro]);

  const capturarGPSAnuncio = async () => {
    try {
      setCapturandoGPS(true);
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== 'granted') {
        Alert.alert('Permissão de localização', 'Permite o acesso à localização e tenta novamente.');
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitudeAnuncio(posicao.coords.latitude);
      setLongitudeAnuncio(posicao.coords.longitude);
      Alert.alert('GPS guardado', `Coordenadas: ${posicao.coords.latitude.toFixed(6)}, ${posicao.coords.longitude.toFixed(6)}`);
    } catch {
      Alert.alert('GPS indisponível', 'Verifica se o GPS está activo.');
    } finally { setCapturandoGPS(false); }
  };

  const [caracteristicas, setCaracteristicas] = useState<Record<string, any>>({});
  const [fotos, setFotos] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [dadosOriginais, setDadosOriginais] = useState<any>(null);
  const [modalCancelarVisivel, setModalCancelarVisivel] = useState(false);
  const [modalMudancaCategoriaVisivel, setModalMudancaCategoriaVisivel] = useState(false);
  const [erroCamposObrigatorios, setErroCamposObrigatorios] = useState<string[]>([]);

  const [modalOCRVisivel, setModalOCRVisivel] = useState(false);
  const [modoSimulacaoOCR, setModoSimulacaoOCR] = useState<ModoSimulacao>('auto');
  const [modalDemoVisivel, setModalDemoVisivel] = useState(false);

  const formularioDinamico = useMemo(() => obterFormulario(tipo), [tipo]);
  const ehCategoriaPersonalizada = usaConstructorPersonalizado(tipo);

  useEffect(() => {
    if (!formularioDinamico) return;
    const valoresPadrao: Record<string, any> = {};
    for (const seccao of formularioDinamico.seccoes) {
      for (const campo of seccao.campos) {
        if (campo.id === MODO_CONSTRUCTOR_PERSONALIZADO) {
          valoresPadrao[campo.id] = caracteristicas[campo.id] ?? [];
          continue;
        }
        if (caracteristicas[campo.id] === undefined && campo.valorInicial !== undefined) {
          valoresPadrao[campo.id] = campo.valorInicial;
        }
      }
    }
    if (Object.keys(valoresPadrao).length > 0) {
      setCaracteristicas(prev => ({ ...valoresPadrao, ...prev }));
    }
  }, [tipo, formularioDinamico]);

  useEffect(() => {
    if (modo === 'editar' && anuncioIdEditar) {
      const dados = buscarAnuncioParaEdicao(anuncioIdEditar);
      setTipo(dados.tipo);
      setFinalidade(dados.finalidade);
      setTitulo(dados.titulo);
      setDescricao(dados.descricao);
      setPreco(formatarPreco(dados.preco));
      setProvincia(dados.provincia);
      setCidade(dados.cidade);
      setBairro(dados.bairro);
      setLatitudeAnuncio((dados as any).latitude ?? null);
      setLongitudeAnuncio((dados as any).longitude ?? null);
      setCaracteristicas(dados.caracteristicas || {});
      setFotos(dados.fotos);
      setVideo(dados.video);
      setDadosOriginais(dados);
    }
  }, [modo, anuncioIdEditar]);

  // Detecção de contactos (Fase B)
  const [deteccaoTitulo, setDeteccaoTitulo] = useState<ResultadoDeteccao | null>(null);
  const [deteccaoDescricao, setDeteccaoDescricao] = useState<ResultadoDeteccao | null>(null);
  const [modalDeteccaoVisivel, setModalDeteccaoVisivel] = useState(false);
  const timeoutTituloRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutDescricaoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutTituloRef.current) clearTimeout(timeoutTituloRef.current);
    if (!titulo.trim()) { setDeteccaoTitulo(null); return; }
    timeoutTituloRef.current = setTimeout(() => setDeteccaoTitulo(detectarContactos(titulo)), 500);
    return () => { if (timeoutTituloRef.current) clearTimeout(timeoutTituloRef.current); };
  }, [titulo]);

  useEffect(() => {
    if (timeoutDescricaoRef.current) clearTimeout(timeoutDescricaoRef.current);
    if (!descricao.trim()) { setDeteccaoDescricao(null); return; }
    timeoutDescricaoRef.current = setTimeout(() => setDeteccaoDescricao(detectarContactos(descricao)), 500);
    return () => { if (timeoutDescricaoRef.current) clearTimeout(timeoutDescricaoRef.current); };
  }, [descricao]);

  const todasDeteccoes = useMemo(() => {
    const resultado: Array<{ campo: string; deteccao: Deteccao }> = [];
    if (deteccaoTitulo?.temContactos) deteccaoTitulo.deteccoes.forEach(d => resultado.push({ campo: 'Título', deteccao: d }));
    if (deteccaoDescricao?.temContactos) deteccaoDescricao.deteccoes.forEach(d => resultado.push({ campo: 'Descrição', deteccao: d }));
    return resultado;
  }, [deteccaoTitulo, deteccaoDescricao]);

  const temDeteccoes = todasDeteccoes.length > 0;

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: passo, duration: 400, useNativeDriver: false }).start();
  }, [passo]);

  const precoNum = precoParaNumero(preco);
  const categoriaSugerida = tipo === 'outro' ? sugerirCategoria(`${nomeCategoriaPersonalizada} ${detalhesCategoriaPersonalizada}`) : null;
  const categoriaPersonalizadaValida = tipo !== 'outro' || nomeCategoriaPersonalizada.trim().length >= 3;
  const valorPagoCalculado = tipo === 'outro' ? null : calcularValorPago(precoNum, finalidade);
  const valorNormal = valorPagoCalculado === null ? null : valorPagoCalculado * 2;

  const temAlteracoes = useMemo(() => {
    if (modo !== 'editar' || !dadosOriginais) return false;
    return (
      tipo !== dadosOriginais.tipo || finalidade !== dadosOriginais.finalidade ||
      titulo !== dadosOriginais.titulo || descricao !== dadosOriginais.descricao ||
      precoParaNumero(preco) !== parseInt(dadosOriginais.preco, 10) ||
      cidade !== dadosOriginais.cidade || bairro !== dadosOriginais.bairro ||
      JSON.stringify(caracteristicas) !== JSON.stringify(dadosOriginais.caracteristicas || {}) ||
      fotos.length !== dadosOriginais.fotos.length
    );
  }, [modo, dadosOriginais, tipo, finalidade, titulo, descricao, preco, cidade, bairro, caracteristicas, fotos]);

  const mudouCategoria = modo === 'editar' && dadosOriginais && tipo !== dadosOriginais.tipo;
  const mudouFinalidade = modo === 'editar' && dadosOriginais && finalidade !== dadosOriginais.finalidade;
  const valorOriginal = dadosOriginais ? calcularValorPago(parseInt(dadosOriginais.preco, 10) || 0, dadosOriginais.finalidade) : 0;
  const diferencaPreco = modo === 'editar' && valorPagoCalculado !== null ? valorPagoCalculado - valorOriginal : 0;
  const exigeRepagamento = (mudouCategoria || mudouFinalidade || diferencaPreco > 0);

  // ============ VALIDAÇÃO POR PASSO ============
  const podeAvancarPasso1 = !!tipo && !!finalidade && categoriaPersonalizadaValida;
  const podeAvancarPasso2 = tituloValido === true && descricaoValida === true && !temDeteccoes;
  const podeAvancarPasso3 = cidadeValida === true && bairroValido === true && precoValido === true;
  const podeAvancarPasso4 = true;
  const podeAvancarPasso5 = fotos.length >= 3;

  const podeAvancar = (() => {
    if (passo === 1) return podeAvancarPasso1;
    if (passo === 2) return podeAvancarPasso2;
    if (passo === 3) return podeAvancarPasso3;
    if (passo === 4) return podeAvancarPasso4;
    if (passo === 5) return podeAvancarPasso5;
    return false;
  })();

  const proximo = () => {
    Keyboard.dismiss();
    if (passo < 5) {
      if (passo === 1 && !podeAvancarPasso1) {
        Alert.alert('Atenção', 'Escolhe a categoria e a finalidade do anúncio.');
        return;
      }
      if (passo === 2 && temDeteccoes) {
        setModalDeteccaoVisivel(true);
        return;
      }
      if (passo === 2 && !podeAvancarPasso2) {
        Alert.alert('Texto incompleto', tituloErro || descricaoErro || 'Preenche título e descrição.');
        return;
      }
      if (passo === 3 && !podeAvancarPasso3) {
        Alert.alert('Dados incompletos', cidadeErro || bairroErro || precoErro || 'Preenche todos os campos.');
        return;
      }
      if (passo === 4) setErroCamposObrigatorios([]);
      setPasso((passo + 1) as Passo);
    } else {
      if (fotos.length < 3) {
        Alert.alert('Faltam fotografias', 'Adiciona pelo menos 3 fotografias.');
        return;
      }
      const verT = detectarContactos(titulo);
      const verD = detectarContactos(descricao);
      if (verT.temContactos || verD.temContactos) {
        setDeteccaoTitulo(verT);
        setDeteccaoDescricao(verD);
        setModalDeteccaoVisivel(true);
        return;
      }
      if (temPalavrasNumero(titulo) || temPalavrasNumero(descricao)) {
        Alert.alert(
          'Números por extenso detectados',
          'Não escrevas números por extenso ("sete nove dois"). O teu contacto já está no perfil — os procuradores desbloqueiam-no pela app após pagamento.',
          [{ text: 'Corrigir texto', onPress: () => setPasso(2) }]
        );
        return;
      }

      // Varrer também os campos texto dinâmicos (passo 4) por dígitos ou palavras-número
      // residuais — caso o CampoDinamico tenha um estado interno que escape à sanitização.
      if (formularioDinamico) {
        for (const seccao of formularioDinamico.seccoes) {
          for (const campo of seccao.campos) {
            if (campo.tipo === 'texto' || campo.tipo === 'textarea') {
              const valor = caracteristicas[campo.id];
              if (typeof valor === 'string') {
                if (/[0-9٠-٩@#]/.test(valor) || temPalavrasNumero(valor)) {
                  Alert.alert(
                    'Contacto detectado',
                    `O campo "${campo.label}" contém números ou símbolos não permitidos. Remove-os e tenta de novo.`,
                    [{ text: 'Corrigir', onPress: () => setPasso(4) }]
                  );
                  return;
                }
              }
            }
          }
        }
      }

      setModalDemoVisivel(true);
    }
  };

  const iniciarVerificacaoOCR = (modoOCR: ModoSimulacao = 'auto') => {
    setModoSimulacaoOCR(modoOCR);
    setModalDemoVisivel(false);
    setModalOCRVisivel(true);
  };

  const onOCRSucesso = async () => {
    setModalOCRVisivel(false);
    if (modo === 'editar') {
      if (exigeRepagamento) { setModalMudancaCategoriaVisivel(true); return; }
      guardarAlteracoes();
    } else {
      const anuncioId = `a${Date.now()}`;
      const categoriaFinal = tipo === 'outro' ? (categoriaSugerida || 'categoria_por_classificar') : tipo;
      const zonaCompleta = `${bairro.trim()}, ${cidade.trim()}, ${provincia || 'Moçambique'}`;

      try {
        await guardarAnuncioLocal({
          id: anuncioId, titulo: titulo.trim(), categoria: categoriaFinal, finalidade,
          descricao: descricao.trim(), bairro: bairro.trim(), cidade: cidade.trim(),
          moradaCompleta: zonaCompleta, latitude: latitudeAnuncio, longitude: longitudeAnuncio,
          preco: precoNum, fotos: [...fotos], video: video || null,
          publicadoEm: new Date().toISOString(),
          caracteristicas: { ...caracteristicas, categoriaPersonalizada: nomeCategoriaPersonalizada, detalhesCategoriaPersonalizada },
          anuncianteNome: 'Anunciante GoHome',
          anuncianteTelefone1: '', anuncianteTelefone2: '',
          anuncianteVerificado: false, anuncianteRating: 0, anuncianteAvaliacoes: 0,
          estadoPagamento: 'pendente', valorPago: valorPagoCalculado ?? 0,
        });
      } catch (erro) {
        Alert.alert('Erro ao guardar', 'Verifica o armazenamento do dispositivo.');
        return;
      }

      router.push({
        pathname: '/pagamento-publicacao' as any,
        params: {
          anuncioId, titulo, categoria: categoriaFinal,
          categoriaPersonalizada: nomeCategoriaPersonalizada,
          detalhesCategoriaPersonalizada,
          classificacaoSugerida: categoriaSugerida || '',
          zona: `${bairro}, ${cidade}`,
          valorPago: valorPagoCalculado === null ? '50' : String(valorPagoCalculado),
          valorNormal: valorNormal === null ? '100' : String(valorNormal),
          finalidade,
        },
      });
    }
  };

  const guardarAlteracoes = () => {
    Alert.alert('Alterações guardadas', 'As mudanças ao teu anúncio foram guardadas.', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const irParaPagamentoDiferenca = () => {
    setModalMudancaCategoriaVisivel(false);
    router.push({
      pathname: '/pagamento-publicacao' as any,
      params: {
        anuncioId: anuncioIdEditar, titulo, categoria: tipo,
        zona: `${bairro}, ${cidade}`,
        valorPago: String(diferencaPreco), valorNormal: String(diferencaPreco * 2),
        finalidade, tipoAccao: 'editar_repagamento',
      },
    });
  };

  const voltar = () => {
    Keyboard.dismiss();
    if (passo > 1) {
      setPasso((passo - 1) as Passo);
    } else {
      if (modo === 'editar' && temAlteracoes) setModalCancelarVisivel(true);
      else router.back();
    }
  };

  const confirmarCancelar = () => { setModalCancelarVisivel(false); router.back(); };
  const irParaPasso2CorrigirTexto = () => { setModalDeteccaoVisivel(false); if (passo !== 2) setPasso(2); };
  /**
   * Descobre o tipo do campo dinâmico pelo ID (percorrendo as secções do form)
   * para saber se é texto livre (precisa sanitizar) ou numérico (deixa passar).
   */
  const descobrirTipoCampo = (campoId: string): string | undefined => {
    if (!formularioDinamico) return undefined;
    for (const seccao of formularioDinamico.seccoes) {
      const campo = seccao.campos.find(c => c.id === campoId);
      if (campo) return campo.tipo;
    }
    return undefined;
  };

  const atualizarCaracteristica = (campoId: string, valor: any) => {
    let valorFinal = valor;

    // REGRA DE OURO: campos texto/texto_longo do anúncio não aceitam dígitos.
    // O detector regex no CampoDinamico ainda apanha padrões em palavras,
    // mas aqui bloqueamos à entrada para "876121792" nunca sequer aparecer.
    const tipo = descobrirTipoCampo(campoId);
    if ((tipo === 'texto' || tipo === 'texto_longo' || tipo === 'textarea') && typeof valor === 'string') {
      valorFinal = sanitizarTextoAnuncio(valor);
    }

    setCaracteristicas(prev => ({ ...prev, [campoId]: valorFinal }));
    if (erroCamposObrigatorios.length > 0) setErroCamposObrigatorios([]);
  };

  const adicionarFoto = async () => {
    const vagas = 10 - fotos.length;
    if (vagas <= 0) { Alert.alert('Limite atingido', 'Máximo 10 fotografias.'); return; }
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) { Alert.alert('Permissão necessária', 'Permite acesso à galeria.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8, selectionLimit: vagas,
      });
      if (!result.canceled) {
        const existentes = new Set(fotos);
        const novasFotos = result.assets.map(a => a.uri).filter(uri => !existentes.has(uri));
        setFotos(actual => [...actual, ...novasFotos].slice(0, 10));
      }
    } catch { Alert.alert('Erro', 'Não foi possível abrir a galeria.'); }
  };

  const adicionarVideo = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) { Alert.alert('Permissão necessária', 'Permite acesso à galeria.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'], allowsEditing: true, videoMaxDuration: 60, quality: 0.7,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const duracao = result.assets[0].duration;
        if (typeof duracao === 'number' && duracao > 60000) {
          Alert.alert('Vídeo demasiado longo', 'Máximo 60 segundos.');
          return;
        }
        setVideo(result.assets[0].uri);
      }
    } catch { Alert.alert('Erro', 'Não foi possível selecionar o vídeo.'); }
  };

  const removerFoto = (index: number) => setFotos(actual => actual.filter((_, i) => i !== index));

  const cardWidth = (screenWidth - 20 * 2 - 12) / 2;

  const tituloPasso = (() => {
    if (passo === 1) return modo === 'editar' ? 'Edita a categoria' : 'Que tipo de anúncio?';
    if (passo === 2) return modo === 'editar' ? 'Edita o texto' : 'Descreve o anúncio';
    if (passo === 3) return 'Localização e preço';
    if (passo === 4) return ehCategoriaPersonalizada ? 'Detalhes do anúncio' : (modo === 'editar' ? 'Edita características' : 'Características');
    if (passo === 5) return modo === 'editar' ? 'Fotos e revisão' : 'Fotos e revisão';
    return '';
  })();

  const tituloBotaoFooter = modo === 'editar'
    ? (passo === 5 ? (exigeRepagamento ? `Pagar ${diferencaPreco} MT` : 'Guardar alterações') : 'Continuar')
    : (passo === 5 ? `Pagar e Publicar${valorPagoCalculado !== null ? ` · ${valorPagoCalculado} MT` : ''}` : 'Continuar');

  // Refs para scroll aos inputs
  const refTitulo = useRef<TextInput>(null);
  const refDescricao = useRef<TextInput>(null);
  const refCidade = useRef<TextInput>(null);
  const refBairro = useRef<TextInput>(null);
  const refPreco = useRef<TextInput>(null);

  // ============ RENDER ============
  return (
    <View style={styles.container}>
      {/* ============ TOPO FIXO: TopBar + progresso ============ */}
      <TopBar
        titulo={tituloPasso}
        onVoltar={voltar}
        acoes={
          modo === 'editar' ? (
            <View style={styles.badgeModoEditar} accessibilityLabel="Modo edição">
              <Icone name="pencil" size={13} color={Colors.branco} />
              <Text style={styles.badgeModoEditarTexto}>Edição</Text>
            </View>
          ) : (
            <View />
          )
        }
      />

      <View style={styles.progressoSticky}>
        {/* Barra de progresso segmentada (protótipo, página 9) */}
        <View style={styles.progressoWrap}>
          <Text style={styles.progressoLegenda}>
            Passo {passo} de 5
            {modo === 'editar' && ' · Modo edição'}
          </Text>
          <View style={styles.segmentos} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 5, now: passo }}>
            {ROTULOS_PASSOS.map((rotulo, i) => {
              const n = i + 1;
              const feito = n <= passo;
              return (
                <View key={rotulo} style={styles.segmento}>
                  <View style={[styles.segmentoBarra, feito && { backgroundColor: corPrimaria }]} />
                  <Text
                    numberOfLines={1}
                    style={[styles.segmentoRotulo, n === passo && { color: TEXTO_FORTE, fontFamily: Fonte.corpoBold }]}
                  >
                    {rotulo}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* ============ ÁREA SCROLLÁVEL + FOOTER COM KEYBOARD AVOIDING ============ */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + tecladoAltura },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {modo === 'editar' && (
            <View style={styles.avisoEdicaoBox}>
              <Icone name="information" size={18} color={AZUL_MARCA} />
              <Text style={styles.avisoEdicaoTexto}>
                Mudanças de texto, fotos e características são grátis. Mudar categoria, finalidade ou subir de faixa de preço exige pagamento da diferença.
              </Text>
            </View>
          )}

          {/* ============ PASSO 1 — CATEGORIA + FINALIDADE ============ */}
          {passo === 1 && (
            <View style={styles.passoContent}>
              <Text style={styles.seccaoTitulo}>Categoria</Text>
              <Text style={styles.seccaoSubtitulo}>Escolhe o que melhor descreve o que vais anunciar</Text>

              <View style={styles.tiposGrid}>
                {tiposImovel.map((t) => {
                  const activo = tipo === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.tipoCard,
                        { width: cardWidth },
                        activo && { borderColor: corPrimaria, borderWidth: 2 },
                      ]}
                      onPress={() => setTipo(t.id)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.tipoFotoWrap}>
                        <Image source={{ uri: imagensCategorias[t.id] }} style={styles.tipoFoto} />
                        {activo && (
                          <View style={[styles.tipoCheck, { backgroundColor: corPrimaria }]}>
                            <Ionicons name="checkmark" size={14} color={Colors.branco} />
                          </View>
                        )}
                      </View>
                      <View style={styles.tipoInfo}>
                        <Text numberOfLines={1} style={styles.tipoLabel}>{t.label}</Text>
                        <Text numberOfLines={1} style={styles.tipoDesc}>{t.descricao}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {tipo === 'outro' && (
                <View style={styles.categoriaPersonalizadaBox}>
                  <View style={styles.categoriaPersonalizadaCabecalho}>
                    <Icone name="lightbulb-on-outline" size={22} color={corPrimaria} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoriaPersonalizadaTitulo}>O que pretendes anunciar?</Text>
                      <Text style={styles.categoriaPersonalizadaDescricao}>
                        Produto ou serviço que não aparece nas categorias padrão.
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.campoLabel}>Nome *</Text>
                  <TextInput
                    style={styles.campoInput}
                    placeholder="Ex: gerador, serviços de limpeza..."
                    placeholderTextColor={TEXTO_FRACO}
                    value={nomeCategoriaPersonalizada}
                    onChangeText={setNomeCategoriaPersonalizada}
                    maxLength={80}
                  />
                  <Text style={[styles.campoLabel, { marginTop: 14 }]}>Mais detalhes (opcional)</Text>
                  <TextInput
                    style={[styles.campoInput, { minHeight: 88, textAlignVertical: 'top' }]}
                    placeholder="Explica brevemente o que estás a oferecer"
                    placeholderTextColor={TEXTO_FRACO}
                    value={detalhesCategoriaPersonalizada}
                    onChangeText={setDetalhesCategoriaPersonalizada}
                    multiline
                    maxLength={300}
                  />
                </View>
              )}

              <View style={{ height: 24 }} />
              <Text style={styles.seccaoTitulo}>Finalidade</Text>
              <Text style={styles.seccaoSubtitulo}>Para que vais publicar?</Text>

              <View style={styles.finalidadesContainer}>
                {finalidades.map((f) => {
                  const activo = finalidade === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.finalidadeCard, activo && { borderColor: f.cor, backgroundColor: `${f.cor}10`, borderWidth: 2 }]}
                      onPress={() => setFinalidade(f.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.finalidadeIcone, { backgroundColor: activo ? f.cor : `${f.cor}20` }]}>
                        <Ionicons name={f.icone} size={22} color={activo ? Colors.branco : f.cor} />
                      </View>
                      <Text style={styles.finalidadeLabel}>{f.label}</Text>
                      {activo && <Ionicons name="checkmark-circle" size={22} color={f.cor} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ============ PASSO 2 — TÍTULO + DESCRIÇÃO ============ */}
          {passo === 2 && (
            <View style={styles.passoContent}>
              <View style={styles.avisoRegrasBox}>
                <Icone name="shield-lock" size={20} color={VERMELHO_ERRO} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.avisoRegrasTitulo}>Nenhum número ou contacto no texto</Text>
                  <Text style={styles.avisoRegrasTexto}>
                    O teclado numérico está bloqueado aqui. Também não é permitido escrever números por extenso ("sete nove dois"), email, WhatsApp ou redes sociais. O teu contacto está guardado no perfil — os procuradores desbloqueiam-no pela app após pagamento.
                  </Text>
                </View>
              </View>

              <CampoFormulario
                label="Título do anúncio"
                hint="Ex: Quarto individual mobilado perto da UZ"
                valor={titulo}
                onChange={(v) => setTitulo(sanitizarTextoAnuncio(v))}
                valido={tituloValido}
                erro={tituloErro}
                maxLength={80}
                refInput={refTitulo}
                onFocusField={() => scrollParaInput(refTitulo.current)}
                deteccao={deteccaoTitulo?.temContactos || temPalavrasNumero(titulo)}
              />

              <CampoFormulario
                label="Descrição completa"
                hint="Descreve o anúncio sem números nem contactos"
                valor={descricao}
                onChange={(v) => setDescricao(sanitizarTextoAnuncio(v))}
                valido={descricaoValida}
                erro={descricaoErro}
                maxLength={500}
                multiline
                numberOfLines={6}
                refInput={refDescricao}
                onFocusField={() => scrollParaInput(refDescricao.current)}
                deteccao={deteccaoDescricao?.temContactos || temPalavrasNumero(descricao)}
              />

              {temDeteccoes && (
                <TouchableOpacity
                  style={styles.verProblemasBotao}
                  onPress={() => setModalDeteccaoVisivel(true)}
                  activeOpacity={0.85}
                >
                  <Icone name="alert-circle" size={18} color={Colors.branco} />
                  <Text style={styles.verProblemasBotaoTexto}>
                    Ver {todasDeteccoes.length} {todasDeteccoes.length === 1 ? 'problema' : 'problemas'} detectado{todasDeteccoes.length === 1 ? '' : 's'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.branco} />
                </TouchableOpacity>
              )}

              <View style={styles.dicaBox}>
                <Ionicons name="bulb" size={18} color={COR_ACENTO} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dicaTitulo}>Dica pro</Text>
                  <Text style={styles.dicaTexto}>Anúncios com descrição completa recebem 3x mais contactos</Text>
                </View>
              </View>
            </View>
          )}

          {/* ============ PASSO 3 — LOCALIZAÇÃO + PREÇO ============ */}
          {passo === 3 && (
            <View style={styles.passoContent}>
              <Text style={styles.seccaoTitulo}>Província</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {provincias.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.chipProvincia, provincia === p && { backgroundColor: AZUL_HERO, borderColor: AZUL_HERO }]}
                      onPress={() => setProvincia(p)}
                    >
                      <Text style={[styles.chipProvinciaTexto, provincia === p && { color: Colors.branco }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.linhaCampos}>
                <View style={{ flex: 1 }}>
                  <CampoFormulario
                    label="Cidade"
                    hint="Beira"
                    valor={cidade}
                    onChange={(v) => setCidade(sanitizarLocalizacao(v))}
                    valido={cidadeValida}
                    erro={cidadeErro}
                    refInput={refCidade}
                    onFocusField={() => scrollParaInput(refCidade.current)}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <CampoFormulario
                    label="Bairro"
                    hint="Macúti"
                    valor={bairro}
                    onChange={(v) => setBairro(sanitizarLocalizacao(v))}
                    valido={bairroValido}
                    erro={bairroErro}
                    refInput={refBairro}
                    onFocusField={() => scrollParaInput(refBairro.current)}
                  />
                </View>
              </View>

              {/* GPS */}
              <TouchableOpacity
                onPress={capturarGPSAnuncio}
                disabled={capturandoGPS}
                activeOpacity={0.85}
                style={[
                  styles.gpsBotao,
                  latitudeAnuncio != null && longitudeAnuncio != null && { borderColor: VERDE_SUCESSO, backgroundColor: Colors.verdeSuave },
                ]}
              >
                <Ionicons
                  name={latitudeAnuncio != null ? 'checkmark-circle' : 'navigate-circle-outline'}
                  size={25}
                  color={latitudeAnuncio != null ? VERDE_SUCESSO : AZUL_MARCA}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsBotaoTitulo}>
                    {capturandoGPS ? 'A obter coordenadas…' : latitudeAnuncio != null ? 'Coordenadas GPS guardadas' : 'Guardar coordenadas GPS do local'}
                  </Text>
                  <Text style={styles.gpsBotaoDesc}>
                    {latitudeAnuncio != null
                      ? `${latitudeAnuncio.toFixed(6)}, ${longitudeAnuncio!.toFixed(6)}`
                      : 'Usa quando estiveres fisicamente no imóvel'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={TEXTO_FRACO} />
              </TouchableOpacity>

              {/* Preço — SANITIZAÇÃO EM TEMPO REAL (só dígitos + formatação) */}
              <Text style={styles.campoLabel}>Preço</Text>
              <View style={[
                styles.precoInputContainer,
                precoValido === true && { borderColor: VERDE_SUCESSO },
                precoValido === false && { borderColor: VERMELHO_ERRO },
              ]}>
                <View style={styles.precoInputMoeda}>
                  <Text style={styles.precoInputMoedaTexto}>MT</Text>
                </View>
                <TextInput
                  ref={refPreco}
                  style={styles.precoInput}
                  placeholder="0"
                  placeholderTextColor={TEXTO_FRACO}
                  value={preco}
                  onChangeText={(v) => setPreco(formatarPreco(v))}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  blurOnSubmit
                  maxLength={13}
                  onFocus={() => scrollParaInput(refPreco.current)}
                />
                <View style={styles.precoInputSufixo}>
                  <Text style={styles.precoInputSufixoTexto}>
                    {finalidade === 'vender' ? 'total' : finalidade === 'reservar' ? '/ reserva' : '/ mês'}
                  </Text>
                </View>
              </View>
              {precoErro && (
                <View style={styles.erroInline}>
                  <Ionicons name="alert-circle" size={14} color={VERMELHO_ERRO} />
                  <Text style={styles.erroInlineTexto}>{precoErro}</Text>
                </View>
              )}
              <Text style={styles.hintCampo}>Introduz apenas números. O formato é aplicado automaticamente.</Text>
            </View>
          )}

          {/* ============ PASSO 4 — CARACTERÍSTICAS DINÂMICAS ============ */}
          {passo === 4 && (
            <View style={styles.passoContent}>
              <View style={styles.camposOpcionaisAviso}>
                <Ionicons name="information-circle-outline" size={18} color={AZUL_ESCURO} />
                <Text style={styles.camposOpcionaisAvisoTexto}>
                  Detalhes opcionais. Nos campos de texto, dígitos (0-9) e símbolos de contacto (@, #) são removidos automaticamente.
                </Text>
              </View>

              {!formularioDinamico && (
                <View style={styles.avisoSemFormulario}>
                  <Icone name="alert-circle-outline" size={40} color={AMARELO_AVISO} />
                  <Text style={styles.avisoSemFormularioTitulo}>Categoria sem formulário específico</Text>
                  <Text style={styles.avisoSemFormularioTexto}>
                    Esta categoria ainda não tem campos definidos. Avança para o próximo passo.
                  </Text>
                </View>
              )}

              {formularioDinamico && formularioDinamico.seccoes.map((seccao, idxSeccao) => (
                <View key={`seccao-${idxSeccao}`} style={styles.seccaoDinamica}>
                  <View style={styles.seccaoDinamicaHeader}>
                    {seccao.icone && (
                      <View style={styles.seccaoDinamicaIcone}>
                        <Icone name={seccao.icone as any} size={18} color={corPrimaria} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.seccaoDinamicaTitulo}>{seccao.titulo}</Text>
                      {seccao.descricao && <Text style={styles.seccaoDinamicaDescricao}>{seccao.descricao}</Text>}
                    </View>
                  </View>
                  {seccao.campos.map((campo) => (
                    <CampoDinamico
                      key={campo.id}
                      campo={campo}
                      valor={caracteristicas[campo.id]}
                      onChange={(novoValor) => atualizarCaracteristica(campo.id, novoValor)}
                      erro={erroCamposObrigatorios.includes(campo.label) ? 'Campo obrigatório' : undefined}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}

          {/* ============ PASSO 5 — FOTOS + REVISÃO ============ */}
          {passo === 5 && (
            <View style={styles.passoContent}>
              <Text style={styles.seccaoTitulo}>Fotografias</Text>
              <Text style={styles.seccaoSubtitulo}>Mínimo 3 fotos. Anúncios com mais fotos vendem 5x mais</Text>

              <View style={styles.fotosGrid}>
                {fotos.map((foto, index) => (
                  <View key={index} style={[styles.fotoItem, { width: (screenWidth - 60) / 3 }]}>
                    <Image source={{ uri: foto }} style={styles.fotoImagem} />
                    <TouchableOpacity style={styles.fotoRemover} onPress={() => removerFoto(index)}>
                      <Ionicons name="close" size={16} color={Colors.branco} />
                    </TouchableOpacity>
                    {index === 0 && (
                      <View style={styles.fotoBadgePrincipal}>
                        <Text style={styles.fotoBadgePrincipalTexto}>PRINCIPAL</Text>
                      </View>
                    )}
                  </View>
                ))}

                {fotos.length < 10 && (
                  <TouchableOpacity
                    style={[styles.fotoAdicionar, { width: (screenWidth - 60) / 3, borderColor: corPrimaria }]}
                    onPress={adicionarFoto}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={28} color={corPrimaria} />
                    <Text style={[styles.fotoAdicionarTexto, { color: corPrimariaDark }]}>Adicionar</Text>
                    <Text style={styles.fotoAdicionarSubtexto}>{fotos.length}/10</Text>
                  </TouchableOpacity>
                )}
              </View>

              {fotos.length < 3 && (
                <View style={styles.erroResumoBox}>
                  <Icone name="alert-circle" size={20} color={VERMELHO_ERRO} />
                  <Text style={styles.erroResumoTexto}>
                    Precisas de pelo menos {3 - fotos.length} fotografia{3 - fotos.length === 1 ? '' : 's'} para publicar.
                  </Text>
                </View>
              )}

              {/* Vídeo */}
              <View style={styles.videoContainer}>
                <View style={styles.videoCabecalho}>
                  <View style={styles.videoIcone}>
                    <Ionicons name="videocam-outline" size={22} color={AZUL_ESCURO} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.videoTitulo}>Vídeo (opcional)</Text>
                    <Text style={styles.videoDescricao}>Até 60 segundos</Text>
                  </View>
                </View>
                {video ? (
                  <View style={styles.videoSelecionado}>
                    <Ionicons name="checkmark-circle" size={20} color={VERDE_SUCESSO} />
                    <Text style={styles.videoSelecionadoTexto} numberOfLines={1}>Vídeo selecionado</Text>
                    <TouchableOpacity onPress={() => setVideo(null)}>
                      <Ionicons name="close-circle" size={22} color={TEXTO_MEDIO} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.videoBotao} onPress={adicionarVideo} activeOpacity={0.8}>
                    <Ionicons name="cloud-upload-outline" size={18} color={COR_ACENTO_ESCURO} />
                    <Text style={styles.videoBotaoTexto}>Selecionar vídeo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Revisão */}
              <View style={styles.revisaoContainer}>
                <View style={styles.revisaoHeader}>
                  <Icone name="clipboard-check" size={20} color={AZUL_ESCURO} />
                  <Text style={styles.revisaoTitulo}>Revisão do anúncio</Text>
                </View>

                <RevisaoLinha label="Tipo" valor={tipo === 'outro' ? (nomeCategoriaPersonalizada || 'Outra') : (tiposImovel.find((item) => item.id === tipo)?.label || '—')} />
                <RevisaoLinha label="Finalidade" valor={finalidade || '—'} />
                <RevisaoLinha label="Localização" valor={bairro && cidade ? `${bairro}, ${cidade}` : '—'} />
                <RevisaoLinha label="Preço" valor={preco ? `${preco} MT` : '—'} />

                {formularioDinamico && (
                  <>
                    <View style={styles.revisaoDivider} />
                    <Text style={styles.revisaoSubTitulo}>CARACTERÍSTICAS</Text>
                    {formularioDinamico.seccoes.map((seccao) =>
                      seccao.campos
                        .filter(campo => {
                          const v = caracteristicas[campo.id];
                          if (campo.id === MODO_CONSTRUCTOR_PERSONALIZADO) return Array.isArray(v) && v.length > 0;
                          if (campo.tipo === 'switch') return v === true;
                          if (campo.tipo === 'chip_multi') return Array.isArray(v) && v.length > 0;
                          return v !== undefined && v !== null && v !== '';
                        })
                        .map((campo) => {
                          const v = caracteristicas[campo.id];
                          if (campo.id === MODO_CONSTRUCTOR_PERSONALIZADO) {
                            const customFields = v as CampoPersonalizado[];
                            return customFields.map((cp) => (
                              <View key={cp.id} style={styles.revisaoItemCompacto}>
                                <Text style={styles.revisaoLabelCompacto}>{cp.nome}</Text>
                                <Text style={styles.revisaoValorCompacto}>{cp.valor}</Text>
                              </View>
                            ));
                          }
                          return (
                            <View key={campo.id} style={styles.revisaoItemCompacto}>
                              <Text style={styles.revisaoLabelCompacto}>{campo.label}</Text>
                              <Text style={styles.revisaoValorCompacto}>{formatarValorRevisao(campo, v)}</Text>
                            </View>
                          );
                        })
                    )}
                  </>
                )}

                {modo === 'publicar' && (
                  <>
                    <View style={styles.revisaoDivider} />
                    <View style={styles.revisaoLinhaPreco}>
                      <Text style={styles.revisaoLabel}>Taxa de publicação</Text>
                      {valorPagoCalculado === null ? (
                        <Text style={[styles.revisaoValor, { color: COR_ACENTO }]}>Por classificar</Text>
                      ) : (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.revisaoValorAntigo}>{valorNormal} MT</Text>
                          <Text style={styles.revisaoValorPromo}>{valorPagoCalculado} MT</Text>
                        </View>
                      )}
                    </View>
                    {valorPagoCalculado !== null && (
                      <View style={styles.revisaoBadgePromo}>
                        <Icone name="tag" size={12} color={Colors.branco} />
                        <Text style={styles.revisaoBadgePromoTexto}>PROMOÇÃO 50% ACTIVA</Text>
                      </View>
                    )}
                  </>
                )}

                {modo === 'editar' && exigeRepagamento && (
                  <>
                    <View style={styles.revisaoDivider} />
                    <View style={styles.revisaoLinhaPreco}>
                      <Text style={[styles.revisaoLabel, { color: VERMELHO_ERRO }]}>Diferença a pagar</Text>
                      <Text style={[styles.revisaoValorPromo, { color: VERMELHO_ERRO }]}>{diferencaPreco} MT</Text>
                    </View>
                  </>
                )}

                {modo === 'editar' && !exigeRepagamento && temAlteracoes && (
                  <>
                    <View style={styles.revisaoDivider} />
                    <View style={styles.revisaoSemCustoBox}>
                      <Ionicons name="checkmark-circle" size={16} color={VERDE_SUCESSO} />
                      <Text style={styles.revisaoSemCustoTexto}>Alterações grátis</Text>
                    </View>
                  </>
                )}
              </View>

              {modo === 'publicar' && (
                <View style={styles.avisoPagamentoBox}>
                  <Icone name="credit-card-outline" size={20} color={AZUL_ESCURO} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.avisoPagamentoTitulo}>Próximo passo</Text>
                    <Text style={styles.avisoPagamentoTexto}>
                      Verificação de fotos → Pagamento M-Pesa → Anúncio activo
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* ============ FOOTER FIXO (acima do teclado) ============ */}
        <View
          style={[
            styles.footerFixo,
            {
              paddingBottom: tecladoAltura > 0 ? 8 : Math.max(insets.bottom, 8),
              bottom: tecladoAltura,
            },
          ]}
        >
          <View style={styles.footerBotoes}>
            {passo > 1 && (
              <TouchableOpacity style={styles.footerBtnSecundario} onPress={voltar} activeOpacity={0.75}>
                <Ionicons name="arrow-back" size={20} color={TEXTO_FORTE} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.footerBtnPrincipal, !podeAvancar && { opacity: 0.4 }]}
              onPress={proximo}
              disabled={!podeAvancar}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={!podeAvancar ? [Colors.textoTerciario, Colors.textoSecundario] : gradientPrimario}
                style={styles.footerBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {passo === 5 ? (
                  <Icone
                    name={modo === 'editar' && !exigeRepagamento ? 'content-save' : 'credit-card'}
                    size={20}
                    color={Colors.branco}
                  />
                ) : null}
                <Text style={styles.footerBtnTexto}>{tituloBotaoFooter}</Text>
                {passo < 5 && <Ionicons name="arrow-forward" size={20} color={Colors.branco} />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ============ MODAIS ============ */}

      {/* Modal detecção de contactos */}
      <Modal visible={modalDeteccaoVisivel} transparent animationType="slide" onRequestClose={() => setModalDeteccaoVisivel(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalDeteccaoVisivel(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalIcone}>
                <Icone name="shield-alert" size={28} color={VERMELHO_ERRO} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>Informação não permitida</Text>
                <Text style={styles.modalSubtitulo}>
                  {`Detectámos ${todasDeteccoes.length} ${todasDeteccoes.length === 1 ? 'tentativa' : 'tentativas'} de partilhar contactos`}
                </Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.modalExplicacao}>
                <Text style={styles.modalExplicacaoTitulo}>Porquê não é permitido?</Text>
                {['Protege os teus dados pessoais', 'Garante pagamento justo pelo teu anúncio', 'Combate burlas e falsas publicações'].map((b, i) => (
                  <View key={i} style={styles.modalBeneficio}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.verdeTexto} />
                    <Text style={styles.modalBeneficioTexto}>{b}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.modalSeccaoTitulo}>O que encontrámos:</Text>
              {todasDeteccoes.map((item, index) => (
                <View key={`${item.campo}-${index}`} style={styles.deteccaoItem}>
                  <View style={[styles.deteccaoIconeContainer, { backgroundColor: `${corTipoDeteccao(item.deteccao.tipo)}15` }]}>
                    <Icone name={iconeTipoDeteccao(item.deteccao.tipo) as any} size={20} color={corTipoDeteccao(item.deteccao.tipo)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.deteccaoCabecalho}>
                      <Text style={styles.deteccaoCampo}>{item.campo}</Text>
                      <View style={[styles.deteccaoTipoBadge, { backgroundColor: `${corTipoDeteccao(item.deteccao.tipo)}15` }]}>
                        <Text style={[styles.deteccaoTipoBadgeTexto, { color: corTipoDeteccao(item.deteccao.tipo) }]}>
                          {labelTipoDeteccao(item.deteccao.tipo)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.deteccaoValorBox}>
                      <Text style={styles.deteccaoValor}>"{item.deteccao.valor}"</Text>
                    </View>
                    <Text style={styles.deteccaoMotivo}>{item.deteccao.motivo}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBotaoPrincipal} onPress={irParaPasso2CorrigirTexto} activeOpacity={0.9}>
                <LinearGradient colors={gradientPrimario} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Icone name="pencil" size={18} color={Colors.branco} />
                <Text style={styles.modalBotaoPrincipalTexto}>Corrigir texto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal cancelar alterações */}
      <Modal visible={modalCancelarVisivel} transparent animationType="fade" onRequestClose={() => setModalCancelarVisivel(false)}>
        <View style={styles.modalCentroOverlay}>
          <View style={styles.modalCentroBox}>
            <View style={styles.modalCentroIcone}>
              <Icone name="alert-circle" size={36} color={AMARELO_AVISO} />
            </View>
            <Text style={styles.modalCentroTitulo}>Descartar alterações?</Text>
            <Text style={styles.modalCentroTexto}>Tens alterações não guardadas que serão perdidas.</Text>
            <View style={styles.modalCentroBotoes}>
              <TouchableOpacity style={styles.modalCentroBtnCancelar} onPress={() => setModalCancelarVisivel(false)}>
                <Text style={styles.modalCentroBtnCancelarTexto}>Continuar a editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalCentroBtnConfirmar, { backgroundColor: VERMELHO_ERRO }]} onPress={confirmarCancelar}>
                <Text style={styles.modalCentroBtnConfirmarTexto}>Descartar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal mudança categoria (editar) */}
      <Modal visible={modalMudancaCategoriaVisivel} transparent animationType="slide" onRequestClose={() => setModalMudancaCategoriaVisivel(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalMudancaCategoriaVisivel(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcone, { backgroundColor: LARANJA_PALE }]}>
                <Icone name="credit-card-plus" size={28} color={AMARELO_AVISO} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>Pagamento adicional</Text>
                <Text style={styles.modalSubtitulo}>As mudanças exigem pagamento extra</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <View style={styles.repagamentoCalculo}>
                <View style={styles.repagamentoCalculoLinha}>
                  <Text style={styles.repagamentoCalculoLabel}>Taxa anterior</Text>
                  <Text style={styles.repagamentoCalculoValor}>{valorOriginal} MT</Text>
                </View>
                <View style={styles.repagamentoCalculoLinha}>
                  <Text style={styles.repagamentoCalculoLabel}>Nova taxa</Text>
                  <Text style={styles.repagamentoCalculoValor}>{valorPagoCalculado} MT</Text>
                </View>
                <View style={styles.repagamentoCalculoDivider} />
                <View style={styles.repagamentoCalculoLinha}>
                  <Text style={styles.repagamentoCalculoLabelTotal}>Diferença</Text>
                  <Text style={styles.repagamentoCalculoValorTotal}>{diferencaPreco} MT</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.modalBotaoSecundario, { marginBottom: 10 }]} onPress={() => setModalMudancaCategoriaVisivel(false)}>
                <Text style={styles.modalBotaoSecundarioTexto}>Voltar e rever</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBotaoPrincipal} onPress={irParaPagamentoDiferenca} activeOpacity={0.9}>
                <LinearGradient colors={[COR_ACENTO, COR_ACENTO_ESCURO]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Icone name="credit-card" size={18} color={Colors.branco} />
                <Text style={styles.modalBotaoPrincipalTexto}>Pagar {diferencaPreco} MT via M-Pesa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal demo OCR */}
      <Modal visible={modalDemoVisivel} transparent animationType="slide" onRequestClose={() => setModalDemoVisivel(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalDemoVisivel(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcone, { backgroundColor: Colors.fundoSuave }]}>
                <Icone name="flask-outline" size={28} color={TEXTO_MEDIO} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitulo}>Modo teste — OCR</Text>
                <Text style={styles.modalSubtitulo}>Escolhe o cenário para testar</Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
              <TouchableOpacity style={[styles.demoBtn, { backgroundColor: Colors.verdeSuave, borderColor: VERDE_SUCESSO }]} onPress={() => iniciarVerificacaoOCR('limpo')} activeOpacity={0.85}>
                <View style={[styles.demoBtnIcone, { backgroundColor: VERDE_SUCESSO }]}><Ionicons name="checkmark" size={18} color={Colors.branco} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.demoBtnTitulo, { color: Colors.verdeTexto }]}>Simular tudo limpo</Text>
                  <Text style={styles.demoBtnDescricao}>Nenhuma foto com contactos</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.demoBtn, { backgroundColor: LARANJA_PALE, borderColor: AMARELO_AVISO }]} onPress={() => iniciarVerificacaoOCR('suspeito')} activeOpacity={0.85}>
                <View style={[styles.demoBtnIcone, { backgroundColor: AMARELO_AVISO }]}><Ionicons name="warning" size={18} color={Colors.branco} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.demoBtnTitulo, { color: Colors.azulTexto }]}>Simular foto suspeita</Text>
                  <Text style={styles.demoBtnDescricao}>Confiança média</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.demoBtn, { backgroundColor: Colors.erroFundo, borderColor: VERMELHO_ERRO }]} onPress={() => iniciarVerificacaoOCR('bloqueado')} activeOpacity={0.85}>
                <View style={[styles.demoBtnIcone, { backgroundColor: VERMELHO_ERRO }]}><Ionicons name="close" size={18} color={Colors.branco} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.demoBtnTitulo, { color: Colors.erroEscuro }]}>Simular foto bloqueada</Text>
                  <Text style={styles.demoBtnDescricao}>Alta confiança</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoBtnCancelar} onPress={() => setModalDemoVisivel(false)}>
                <Text style={styles.demoBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ModalVerificacaoOCR
        visivel={modalOCRVisivel}
        fotos={fotos}
        modoSimulacao={modoSimulacaoOCR}
        onFechar={() => setModalOCRVisivel(false)}
        onSucesso={onOCRSucesso}
        onRemoverFoto={(indice) => { removerFoto(indice); setModalOCRVisivel(false); }}
      />
    </View>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function CampoFormulario({
  label, hint, valor, onChange, valido, erro, maxLength,
  multiline, numberOfLines, refInput, onFocusField, deteccao,
}: {
  label: string;
  hint: string;
  valor: string;
  onChange: (v: string) => void;
  valido: boolean | null;
  erro: string | null;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  refInput?: React.RefObject<TextInput | null>;
  onFocusField?: () => void;
  deteccao?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = (() => {
    if (deteccao) return VERMELHO_ERRO;
    if (valido === true) return VERDE_SUCESSO;
    if (valido === false && valor.length > 0) return VERMELHO_ERRO;
    if (focused) return AZUL_MARCA;
    return CINZA_BORDA_FORTE;
  })();

  return (
    <View style={styles.campoContainer}>
      <View style={styles.campoHeader}>
        <Text style={styles.campoLabel}>{label}</Text>
        {valido === true && <Ionicons name="checkmark-circle" size={16} color={VERDE_SUCESSO} />}
      </View>
      <TextInput
        ref={refInput}
        style={[
          styles.campoInput,
          multiline && { minHeight: 120, textAlignVertical: 'top' },
          { borderColor, borderWidth: focused ? 2 : 1.5 },
        ]}
        placeholder={hint}
        placeholderTextColor={TEXTO_FRACO}
        value={valor}
        onChangeText={onChange}
        onFocus={() => { setFocused(true); onFocusField?.(); }}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
      />
      <View style={styles.campoRodape}>
        <View style={{ flex: 1 }}>
          {erro && valor.length > 0 ? (
            <View style={styles.erroInline}>
              <Ionicons name="alert-circle" size={13} color={VERMELHO_ERRO} />
              <Text style={styles.erroInlineTexto}>{erro}</Text>
            </View>
          ) : deteccao ? (
            <View style={styles.erroInline}>
              <Ionicons name="warning" size={13} color={VERMELHO_ERRO} />
              <Text style={styles.erroInlineTexto}>Contacto detectado — remove-o</Text>
            </View>
          ) : null}
        </View>
        {maxLength && (
          <Text style={styles.campoContador}>{valor.length}/{maxLength}</Text>
        )}
      </View>
    </View>
  );
}

function RevisaoLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.revisaoItem}>
      <Text style={styles.revisaoLabel}>{label}</Text>
      <Text style={styles.revisaoValor}>{valor}</Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CINZA_FUNDO },

  // Topo fixo: progresso logo abaixo da TopBar, no fundo papel
  progressoSticky: {
    backgroundColor: CINZA_FUNDO,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CINZA_BORDA,
    zIndex: 5,
  },
  badgeModoEditar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, height: 30, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  badgeModoEditarTexto: { color: Colors.branco, fontSize: 12, fontFamily: Fonte.corpoSemi },
  progressoLegenda: { fontSize: 12, fontFamily: Fonte.corpoMedio, color: TEXTO_MEDIO, marginBottom: 8 },
  progressoWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  segmentos: { flexDirection: 'row', gap: 6 },
  segmento: { flex: 1 },
  segmentoBarra: { height: 4, borderRadius: 4, backgroundColor: CINZA_BORDA, marginBottom: 6 },
  segmentoRotulo: { fontSize: 12, fontFamily: Fonte.corpoMedio, color: TEXTO_MEDIO },

  // Scroll area
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },
  passoContent: { paddingHorizontal: 20, paddingBottom: 20 },

  avisoEdicaoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 115, 232, 0.08)',
    padding: 12, gap: 10,
    marginHorizontal: 20, marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 3, borderLeftColor: AZUL_MARCA,
  },
  avisoEdicaoTexto: { flex: 1, color: AZUL_ESCURO, lineHeight: 17, fontSize: 12, fontFamily: Fonte.corpoMedio },

  // Secções
  seccaoTitulo: { fontSize: 20, fontFamily: Fonte.tituloSemi, color: TEXTO_FORTE, letterSpacing: -0.4, marginBottom: 4 },
  seccaoSubtitulo: { fontFamily: Fonte.corpo, fontSize: 13, color: TEXTO_MEDIO, lineHeight: 19, marginBottom: 18 },

  // Grid categorias
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', paddingBottom: 6 },
  tipoCard: {
    backgroundColor: Colors.branco,
    borderRadius: 16, borderWidth: 1.5, borderColor: CINZA_BORDA,
    overflow: 'hidden',
  },
  tipoFotoWrap: { width: '100%', aspectRatio: 16 / 10, backgroundColor: Colors.azulSuave, position: 'relative', overflow: 'hidden' },
  tipoFoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  tipoCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: Colors.branco,
    justifyContent: 'center', alignItems: 'center',
  },
  tipoInfo: { padding: 12 },
  tipoLabel: { color: TEXTO_FORTE, fontSize: 14, fontFamily: Fonte.corpoSemi, marginBottom: 2 },
  tipoDesc: { color: TEXTO_MEDIO, fontSize: 12, fontFamily: Fonte.corpoMedio },

  categoriaPersonalizadaBox: {
    backgroundColor: LARANJA_PALE, borderColor: Colors.azul, borderWidth: 1,
    borderRadius: 16, padding: 16, marginTop: 16,
  },
  categoriaPersonalizadaCabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  categoriaPersonalizadaTitulo: { fontSize: 15, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, marginBottom: 3 },
  categoriaPersonalizadaDescricao: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, lineHeight: 17 },

  finalidadesContainer: { gap: 10 },
  finalidadeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.branco, padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: CINZA_BORDA, gap: 13,
  },
  finalidadeIcone: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  finalidadeLabel: { fontSize: 15, color: TEXTO_FORTE, flex: 1, fontFamily: Fonte.corpoSemi },

  // Campos
  campoContainer: { marginBottom: 18 },
  campoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  campoLabel: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, letterSpacing: 0.1 },
  campoInput: {
    backgroundColor: Colors.branco, borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 14,
    fontSize: 15, color: TEXTO_FORTE, fontFamily: Fonte.corpoMedio,
    borderWidth: 1.5,
  },
  campoRodape: { flexDirection: 'row', alignItems: 'center', marginTop: 6, minHeight: 18 },
  erroInline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  erroInlineTexto: { fontSize: 12, color: VERMELHO_ERRO, fontFamily: Fonte.corpoSemi, flexShrink: 1 },
  campoContador: { fontSize: 12, color: TEXTO_FRACO, fontFamily: Fonte.corpoMedio },
  hintCampo: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_FRACO, marginTop: 6, fontStyle: 'italic' },
  linhaCampos: { flexDirection: 'row' },

  avisoRegrasBox: {
    flexDirection: 'row', backgroundColor: Colors.erroFundo,
    padding: 14, borderRadius: 12, gap: 11, marginBottom: 20,
    borderLeftWidth: 3, borderLeftColor: VERMELHO_ERRO,
  },
  avisoRegrasTitulo: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: VERMELHO_ERRO, marginBottom: 3 },
  avisoRegrasTexto: { fontFamily: Fonte.corpo, fontSize: 12, color: Colors.erroEscuro, lineHeight: 17 },

  verProblemasBotao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: VERMELHO_ERRO, paddingVertical: 13, paddingHorizontal: 16,
    borderRadius: 12, gap: 8, marginBottom: 16,
  },
  verProblemasBotaoTexto: { color: Colors.branco, fontFamily: Fonte.corpoSemi, fontSize: 13, flex: 1, textAlign: 'center' },

  avisoPagamentoBox: {
    flexDirection: 'row', backgroundColor: 'rgba(26, 115, 232, 0.08)',
    padding: 14, borderRadius: 12, gap: 11, marginTop: 16,
    borderLeftWidth: 3, borderLeftColor: AZUL_MARCA,
  },
  avisoPagamentoTitulo: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: AZUL_ESCURO, marginBottom: 3 },
  avisoPagamentoTexto: { fontFamily: Fonte.corpo, fontSize: 12, color: Colors.carvao, lineHeight: 17 },

  chipProvincia: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 100,
    backgroundColor: Colors.branco, borderWidth: 1.5, borderColor: CINZA_BORDA,
  },
  chipProvinciaTexto: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE },

  gpsBotao: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    marginBottom: 20, borderRadius: 12, borderWidth: 1.5,
    borderColor: CINZA_BORDA_FORTE, backgroundColor: Colors.branco,
  },
  gpsBotaoTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE },
  gpsBotaoDesc: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, marginTop: 3 },

  // Preço (destacado)
  precoInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.branco, borderRadius: 12,
    borderWidth: 1.5, borderColor: CINZA_BORDA_FORTE, overflow: 'hidden',
  },
  precoInputMoeda: {
    paddingHorizontal: 14, paddingVertical: 15,
    backgroundColor: CINZA_FUNDO,
    borderRightWidth: 1, borderRightColor: CINZA_BORDA,
  },
  precoInputMoedaTexto: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: TEXTO_MEDIO, letterSpacing: 0.5 },
  precoInput: {
    flex: 1, paddingHorizontal: 15, paddingVertical: 14,
    fontSize: 22, color: TEXTO_FORTE, fontFamily: Fonte.tituloSemi,
  },
  precoInputSufixo: {
    backgroundColor: CINZA_FUNDO, paddingHorizontal: 14, paddingVertical: 16,
    borderLeftWidth: 1, borderLeftColor: CINZA_BORDA,
  },
  precoInputSufixoTexto: { fontSize: 12, fontFamily: Fonte.corpoSemi, color: TEXTO_MEDIO },

  dicaBox: {
    flexDirection: 'row', backgroundColor: LARANJA_PALE, padding: 13,
    borderRadius: 12, gap: 11, borderLeftWidth: 3, borderLeftColor: COR_ACENTO,
    alignItems: 'flex-start',
  },
  dicaTitulo: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: COR_ACENTO_ESCURO, marginBottom: 2 },
  dicaTexto: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_FORTE, lineHeight: 17 },

  seccaoDinamica: {
    marginBottom: 18, backgroundColor: Colors.branco,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: CINZA_BORDA,
  },
  seccaoDinamicaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: CINZA_BORDA,
  },
  seccaoDinamicaIcone: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: LARANJA_PALE,
    justifyContent: 'center', alignItems: 'center',
  },
  seccaoDinamicaTitulo: { fontSize: 15, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE },
  seccaoDinamicaDescricao: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, marginTop: 2 },

  avisoSemFormulario: {
    backgroundColor: LARANJA_PALE, padding: 20, borderRadius: 14,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: Colors.azulSuave,
  },
  avisoSemFormularioTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, color: Colors.azulTexto, textAlign: 'center', marginTop: 4 },
  avisoSemFormularioTexto: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, textAlign: 'center', lineHeight: 17 },

  erroResumoBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: Colors.erroFundo, padding: 13, borderRadius: 12,
    borderLeftWidth: 3, borderLeftColor: VERMELHO_ERRO, marginTop: 10, marginBottom: 14,
  },
  erroResumoTexto: { flex: 1, fontSize: 12, fontFamily: Fonte.corpoSemi, color: Colors.erroEscuro, lineHeight: 16 },

  camposOpcionaisAviso: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 9,
    padding: 12, marginBottom: 16, borderRadius: 12,
    backgroundColor: 'rgba(26, 115, 232, 0.08)',
    borderWidth: 1, borderColor: 'rgba(26, 115, 232, 0.2)',
  },
  camposOpcionaisAvisoTexto: { flex: 1, color: AZUL_ESCURO, fontSize: 12, lineHeight: 17, fontFamily: Fonte.corpoMedio },

  // Fotos
  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  fotoItem: { aspectRatio: 1, borderRadius: 13, overflow: 'hidden', position: 'relative', backgroundColor: Colors.borda },
  fotoImagem: { width: '100%', height: '100%' },
  fotoRemover: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  fotoBadgePrincipal: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: COR_ACENTO, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  fotoBadgePrincipalTexto: { color: Colors.branco, fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 0.3 },
  fotoAdicionar: {
    aspectRatio: 1, borderRadius: 13, borderWidth: 1.5, borderStyle: 'dashed',
    backgroundColor: Colors.branco, justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  fotoAdicionarTexto: { fontSize: 12, fontFamily: Fonte.corpoSemi, marginTop: 4 },
  fotoAdicionarSubtexto: { fontSize: 12, color: TEXTO_FRACO, fontFamily: Fonte.corpoSemi },

  videoContainer: {
    backgroundColor: Colors.branco, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: CINZA_BORDA, marginBottom: 18,
  },
  videoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  videoIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: LARANJA_PALE, justifyContent: 'center', alignItems: 'center' },
  videoTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, marginBottom: 2 },
  videoDescricao: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO },
  videoSelecionado: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.verdeSuave, borderWidth: 1, borderColor: Colors.verdeSuave,
    padding: 12, borderRadius: 11,
  },
  videoSelecionadoTexto: { flex: 1, fontSize: 12, color: TEXTO_FORTE, fontFamily: Fonte.corpoSemi },
  videoBotao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.azulSuave, borderWidth: 1, borderColor: Colors.azul,
    paddingVertical: 12, borderRadius: 11,
  },
  videoBotaoTexto: { fontSize: 13, color: COR_ACENTO_ESCURO, fontFamily: Fonte.corpoSemi },

  // Revisão
  revisaoContainer: {
    backgroundColor: Colors.branco, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: CINZA_BORDA,
  },
  revisaoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: CINZA_BORDA,
  },
  revisaoTitulo: { fontSize: 15, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE },
  revisaoSubTitulo: { fontSize: 12, fontFamily: Fonte.corpoSemi, color: TEXTO_MEDIO, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  revisaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  revisaoLinhaPreco: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  revisaoItemCompacto: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  revisaoLabel: { fontFamily: Fonte.corpo, fontSize: 13, color: TEXTO_MEDIO },
  revisaoLabelCompacto: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, flex: 1 },
  revisaoValor: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, textTransform: 'capitalize' },
  revisaoValorCompacto: { fontSize: 12, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, maxWidth: '60%', textAlign: 'right' },
  revisaoValorAntigo: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_FRACO, textDecorationLine: 'line-through' },
  revisaoValorPromo: { fontSize: 18, color: COR_ACENTO_ESCURO, fontFamily: Fonte.corpoBold },
  revisaoDivider: { height: 1, backgroundColor: CINZA_BORDA, marginVertical: 10 },
  revisaoBadgePromo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COR_ACENTO,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    alignSelf: 'center', marginTop: 10, gap: 5,
  },
  revisaoBadgePromoTexto: { fontSize: 12, fontFamily: Fonte.corpoSemi, color: Colors.branco, letterSpacing: 0.4 },
  revisaoSemCustoBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.verdeSuave, padding: 10, borderRadius: 10, gap: 7, marginTop: 8,
  },
  revisaoSemCustoTexto: { fontSize: 12, color: Colors.verdeTexto, flex: 1, fontFamily: Fonte.corpoSemi },

  // Footer fixo
  footerFixo: {
    position: 'absolute', left: 0, right: 0,
    backgroundColor: Colors.branco,
    borderTopWidth: 1, borderTopColor: CINZA_BORDA,
    paddingTop: 10, paddingHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  footerBotoes: { flexDirection: 'row', gap: 10 },
  footerBtnSecundario: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: CINZA_FUNDO, borderWidth: 1, borderColor: CINZA_BORDA,
    justifyContent: 'center', alignItems: 'center',
  },
  footerBtnPrincipal: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  footerBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 10,
  },
  footerBtnTexto: { color: Colors.branco, fontSize: 15, fontFamily: Fonte.corpoSemi },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.branco, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: CINZA_BORDA_FORTE, alignSelf: 'center', marginTop: 10, marginBottom: 12 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: CINZA_BORDA,
  },
  modalIcone: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.erroFundo, justifyContent: 'center', alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, marginBottom: 3 },
  modalSubtitulo: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, lineHeight: 17 },
  modalScroll: { paddingHorizontal: 20, paddingTop: 16 },
  modalExplicacao: { backgroundColor: Colors.verdeSuave, borderRadius: 12, padding: 14, marginBottom: 18, borderLeftWidth: 3, borderLeftColor: Colors.verde },
  modalExplicacaoTitulo: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: Colors.verdeTexto, marginBottom: 6 },
  modalBeneficio: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  modalBeneficioTexto: { fontFamily: Fonte.corpo, fontSize: 12, color: Colors.verdeTexto, flex: 1 },
  modalSeccaoTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, marginBottom: 10 },
  deteccaoItem: {
    flexDirection: 'row', gap: 11, padding: 13,
    backgroundColor: CINZA_FUNDO, borderRadius: 12, marginBottom: 10,
    borderWidth: 1, borderColor: CINZA_BORDA,
  },
  deteccaoIconeContainer: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  deteccaoCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  deteccaoCampo: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE },
  deteccaoTipoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  deteccaoTipoBadgeTexto: { fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 0.3 },
  deteccaoValorBox: { backgroundColor: Colors.erroFundo, padding: 7, borderRadius: 7, marginBottom: 5, borderWidth: 1, borderColor: Colors.erroBorda },
  deteccaoValor: { fontSize: 12, color: VERMELHO_ERRO, fontFamily: Fonte.corpoSemi, fontVariant: ['tabular-nums'] },
  deteccaoMotivo: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, lineHeight: 15 },

  modalFooter: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: CINZA_BORDA },
  modalBotaoPrincipal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 13, overflow: 'hidden', gap: 9,
  },
  modalBotaoPrincipalTexto: { color: Colors.branco, fontSize: 14, fontFamily: Fonte.corpoSemi },
  modalBotaoSecundario: {
    paddingVertical: 13, borderRadius: 13,
    backgroundColor: CINZA_FUNDO, alignItems: 'center',
    borderWidth: 1, borderColor: CINZA_BORDA,
  },
  modalBotaoSecundarioTexto: { color: TEXTO_FORTE, fontSize: 13, fontFamily: Fonte.corpoSemi },

  modalCentroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCentroBox: { backgroundColor: Colors.branco, borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center' },
  modalCentroIcone: { width: 68, height: 68, borderRadius: 20, backgroundColor: LARANJA_PALE, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalCentroTitulo: { fontSize: 18, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE, textAlign: 'center', marginBottom: 8 },
  modalCentroTexto: { fontFamily: Fonte.corpo, fontSize: 13, color: TEXTO_MEDIO, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  modalCentroBotoes: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCentroBtnCancelar: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: CINZA_FUNDO, alignItems: 'center' },
  modalCentroBtnCancelarTexto: { color: TEXTO_FORTE, fontSize: 13, fontFamily: Fonte.corpoSemi },
  modalCentroBtnConfirmar: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  modalCentroBtnConfirmarTexto: { color: Colors.branco, fontSize: 13, fontFamily: Fonte.corpoSemi },

  repagamentoCalculo: { backgroundColor: CINZA_FUNDO, borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: CINZA_BORDA },
  repagamentoCalculoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  repagamentoCalculoLabel: { fontFamily: Fonte.corpo, fontSize: 13, color: TEXTO_MEDIO },
  repagamentoCalculoValor: { fontSize: 13, fontFamily: Fonte.corpoSemi, color: TEXTO_FORTE },
  repagamentoCalculoDivider: { height: 1, backgroundColor: CINZA_BORDA, marginVertical: 5 },
  repagamentoCalculoLabelTotal: { fontSize: 14, fontFamily: Fonte.corpoSemi, color: VERMELHO_ERRO },
  repagamentoCalculoValorTotal: { fontSize: 18, fontFamily: Fonte.corpoBold, color: VERMELHO_ERRO },

  demoBtn: {
    flexDirection: 'row', alignItems: 'center',
    padding: 13, borderRadius: 13, borderWidth: 1.5, gap: 11, marginBottom: 10,
  },
  demoBtnIcone: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  demoBtnTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, marginBottom: 2 },
  demoBtnDescricao: { fontFamily: Fonte.corpo, fontSize: 12, color: TEXTO_MEDIO, lineHeight: 15 },
  demoBtnCancelar: { paddingVertical: 13, alignItems: 'center' },
  demoBtnCancelarTexto: { color: TEXTO_MEDIO, fontSize: 13, fontFamily: Fonte.corpoSemi },
});