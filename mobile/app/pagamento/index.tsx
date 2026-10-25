/**
 * app/pagamento/index.tsx — Ecrã de DESBLOQUEIO de contactos
 *
 * Rota: /pagamento (com params anuncioId, titulo, categoria, bairro, cidade, valorPago, valorNormal)
 *
 * Fluxo:
 *   anuncio/[id] → "Desbloquear agora" → /pagamento → sucesso → /anuncio/[id]?desbloqueado=true
 *
 * 3 métodos:
 *   • M-Pesa (Vodacom 84/85) — STK Push
 *   • eMola (Movitel 82/83/86/87) — fluxo similar
 *   • Crédito interno GoHome (se tiver saldo suficiente) — débito instantâneo
 *
 * Regra absoluta (ver REGRAS_PLATAFORMA.md):
 *   NUNCA pagamentos de arrendamento/compra passam por aqui.
 *   Aqui só se paga a TAXA de desbloqueio (25 MT com promoção, 50 MT normal).
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Animated,
  Easing,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography, Spacing, Radius } from '../../src/theme/typography';
import { useUserStore } from '../../src/store/userStore';
import { useCores } from '../../src/store/themeStore';
import { useWalletStore, formatarValor } from '../../src/store/walletStore';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
// ============================================================
// CORES GOHOME
// ============================================================
const AZUL_HERO_INICIO = '#0A6BC0';   // Azul GoHome — o mesmo da "Promoção lançamento"
const AZUL_HERO_FIM = '#095FAA';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';
const VERDE_SUCESSO = '#2F7A4F';
const VERMELHO_ERRO = '#C2412D';
const AMARELO_AVISO = '#E8760A';

type MetodoPagamento = 'mpesa' | 'emola' | 'credito';

type EstadoPagamento =
  | 'formulario'
  | 'enviando_pedido'
  | 'aguardando_pin'
  | 'sucesso'
  | 'falha'
  | 'timeout';

const TIMEOUT_SEGUNDOS = 180;

// ============================================================
// VALIDAÇÕES
// ============================================================
function validarNumeroMPesa(numero: string): { valido: boolean; erro?: string } {
  const limpo = numero.replace(/[^0-9]/g, '');
  if (limpo.length === 0) return { valido: false, erro: 'Introduz o teu número M-Pesa' };
  if (limpo.length !== 9) return { valido: false, erro: 'O número deve ter 9 dígitos' };
  const prefixo = limpo.substring(0, 2);
  if (prefixo !== '84' && prefixo !== '85') {
    return { valido: false, erro: 'M-Pesa só funciona com Vodacom (84 ou 85)' };
  }
  return { valido: true };
}

function validarNumeroEMola(numero: string): { valido: boolean; erro?: string } {
  const limpo = numero.replace(/[^0-9]/g, '');
  if (limpo.length === 0) return { valido: false, erro: 'Introduz o teu número eMola' };
  if (limpo.length !== 9) return { valido: false, erro: 'O número deve ter 9 dígitos' };
  const prefixo = limpo.substring(0, 2);
  if (!['82', '83', '86', '87'].includes(prefixo)) {
    return { valido: false, erro: 'eMola funciona com Movitel (82, 83, 86, 87)' };
  }
  return { valido: true };
}

function formatarTempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ============================================================
// COMPONENTE
// ============================================================
export default function PagamentoDesbloqueio() {
  const router = useRouter();
  const cores = useCores();
  const usuario = useUserStore(state => state.usuario);
  const saldo = useWalletStore(state => state.saldo);
  const removerSaldo = useWalletStore(state => state.removerSaldo);

  // Params vindos do anuncio/[id]
  const params = useLocalSearchParams<{
    anuncioId?: string;
    tipo?: string;
    titulo?: string;
    categoria?: string;
    bairro?: string;
    cidade?: string;
    valorPago?: string;
    valorNormal?: string;
    // Compatibilidade com fluxo antigo que usava imovelId
    imovelId?: string;
  }>();

  const anuncioId = params.anuncioId || params.imovelId || '';
  const titulo = params.titulo || 'Anúncio';
  const categoria = params.categoria || 'imóvel';
  const bairro = params.bairro || '';
  const cidade = params.cidade || 'Beira';
  const valorPago = parseFloat(params.valorPago || '25');
  const valorNormal = parseFloat(params.valorNormal || '50');

  const temCreditoSuficiente = saldo >= valorPago;

  // Estado
  const [metodo, setMetodo] = useState<MetodoPagamento>(
    temCreditoSuficiente ? 'credito' : 'mpesa',
  );
  const [estado, setEstado] = useState<EstadoPagamento>('formulario');
  const [numeroTelefone, setNumeroTelefone] = useState(() => {
    const tel = usuario?.telefone || '';
    const limpo = tel.replace(/[^0-9]/g, '');
    return limpo.startsWith('258') ? limpo.substring(3) : limpo;
  });
  const [erroNumero, setErroNumero] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState(TIMEOUT_SEGUNDOS);
  const [modalCancelarVisivel, setModalCancelarVisivel] = useState(false);

  // Animações
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Loop de animações durante loading
  useEffect(() => {
    if (estado === 'enviando_pedido' || estado === 'aguardando_pin') {
      Animated.loop(
        Animated.timing(spinValue, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true }),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
    }
  }, [estado]);

  // Timer countdown
  useEffect(() => {
    if (estado === 'aguardando_pin') {
      setTempoRestante(TIMEOUT_SEGUNDOS);
      timerRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setEstado('timeout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [estado]);

  // Bloquear botão voltar durante pagamento activo
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (estado === 'enviando_pedido' || estado === 'aguardando_pin') {
        setModalCancelarVisivel(true);
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [estado]);

  // ============ ACÇÕES ============
  const iniciarPagamento = async () => {
    if (metodo === 'credito') {
      // Débito instantâneo do crédito interno
      const sucesso = await removerSaldo(
        valorPago,
        `Desbloqueio: ${titulo}`,
        'debito',
      );
      if (sucesso) {
        setEstado('sucesso');
        setTimeout(() => redirectParaAnuncio(), 1200);
      } else {
        setEstado('falha');
      }
      return;
    }

    const validacao = metodo === 'mpesa'
      ? validarNumeroMPesa(numeroTelefone)
      : validarNumeroEMola(numeroTelefone);

    if (!validacao.valido) {
      setErroNumero(validacao.erro || 'Número inválido');
      return;
    }
    setErroNumero(null);
    setEstado('enviando_pedido');
    setTimeout(() => setEstado('aguardando_pin'), 2000);
  };

  const simularSucesso = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEstado('sucesso');
    setTimeout(() => redirectParaAnuncio(), 1500);
  };

  const redirectParaAnuncio = () => {
    router.replace({
      pathname: '/anuncio/[id]' as any,
      params: { id: anuncioId, desbloqueado: 'true' },
    });
  };

  const simularFalha = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEstado('falha');
  };

  const simularTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setEstado('timeout');
  };

  const tentarNovamente = () => setEstado('formulario');

  const confirmarCancelar = () => {
    setModalCancelarVisivel(false);
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const tempoCritico = tempoRestante <= 30;

  // ============ UI ============
  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle="light-content" backgroundColor={AZUL_HERO_INICIO} />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LinearGradient
          colors={[AZUL_HERO_INICIO, AZUL_HERO_FIM]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.headerBotao}
              onPress={() => {
                if (estado === 'formulario' || estado === 'sucesso') router.back();
                else setModalCancelarVisivel(true);
              }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>DESBLOQUEIO DE CONTACTO</Text>
              <Text style={styles.headerTitulo}>Pagamento</Text>
            </View>
            <View style={styles.headerBotao} />
          </View>

          {/* Montante */}
          <View style={styles.montanteContainer}>
            <Text style={styles.montanteLabel}>Vais desbloquear por</Text>
            <View style={styles.montanteLinha}>
              <Text style={styles.montanteValor}>{valorPago}</Text>
              <Text style={styles.montanteMoeda}>MT</Text>
            </View>
            <View style={styles.descontoBadge}>
              <Icone name="tag" size={12} color="#FFFFFF" />
              <Text style={styles.descontoBadgeTexto}>
                50% OFF — Antes {valorNormal} MT
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============ FORMULÁRIO ============ */}
          {estado === 'formulario' && (
            <View style={styles.conteudoFormulario}>
              {/* Resumo do anúncio */}
              <View style={[styles.resumoCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                <View style={styles.resumoHeader}>
                  <Icone name="lock-open-outline" size={20} color={cores.principal} />
                  <Text style={[styles.resumoTitulo, { color: cores.principal }]}>Vais desbloquear</Text>
                </View>
                <Text style={[styles.resumoAnuncioTitulo, { color: cores.textoPrincipal }]} numberOfLines={2}>
                  {titulo}
                </Text>
                <View style={styles.resumoMetaLinha}>
                  <View style={styles.resumoMetaItem}>
                    <Icone name="shape" size={14} color={cores.textoSecundario} />
                    <Text style={[styles.resumoMetaTexto, { color: cores.textoSecundario }]}>{categoria}</Text>
                  </View>
                  <View style={[styles.resumoMetaDivisor, { backgroundColor: cores.bordaSubtil }]} />
                  <View style={styles.resumoMetaItem}>
                    <Ionicons name="location" size={14} color={cores.textoSecundario} />
                    <Text style={[styles.resumoMetaTexto, { color: cores.textoSecundario }]}>
                      {bairro ? `${bairro}, ${cidade}` : cidade}
                    </Text>
                  </View>
                </View>

                <View style={[styles.resumoDivisor, { backgroundColor: cores.bordaSubtil }]} />

                <View style={styles.resumoLinhaInfo}>
                  <Text style={[styles.resumoLabel, { color: cores.textoSecundario }]}>Vais receber</Text>
                  <Text style={[styles.resumoValor, { color: cores.textoPrincipal }]}>
                    Telefone + WhatsApp
                  </Text>
                </View>
                <View style={styles.resumoLinhaInfo}>
                  <Text style={[styles.resumoLabel, { color: cores.textoSecundario }]}>Valor</Text>
                  <Text style={[styles.resumoValor, { color: LARANJA_MARCA, fontFamily: Fonte.corpoBold }]}>
                    {valorPago} MT
                  </Text>
                </View>
              </View>

              {/* Selector de método */}
              <View style={styles.metodoSelector}>
                <Text style={[styles.metodoLabel, { color: cores.textoSecundario }]}>
                  COMO QUERES PAGAR?
                </Text>

                {/* Crédito interno (destaque se tiver saldo) */}
                <TouchableOpacity
                  style={[
                    styles.metodoCard,
                    { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                    metodo === 'credito' && { borderColor: cores.principal, borderWidth: 2 },
                    !temCreditoSuficiente && { opacity: 0.5 },
                  ]}
                  onPress={() => temCreditoSuficiente && setMetodo('credito')}
                  disabled={!temCreditoSuficiente}
                  activeOpacity={0.85}
                >
                  <View style={[styles.metodoIcone, { backgroundColor: cores.principalClara }]}>
                    <Ionicons name="wallet" size={22} color={cores.principal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metodoNome, { color: cores.textoPrincipal }]}>
                      Crédito GoHome
                    </Text>
                    <Text style={[styles.metodoDesc, { color: cores.textoSecundario }]}>
                      {temCreditoSuficiente
                        ? `Saldo: ${formatarValor(saldo)} · Débito instantâneo`
                        : `Saldo insuficiente (${formatarValor(saldo)})`}
                    </Text>
                  </View>
                  {metodo === 'credito' && (
                    <Ionicons name="checkmark-circle" size={22} color={cores.principal} />
                  )}
                </TouchableOpacity>

                {/* M-Pesa */}
                <TouchableOpacity
                  style={[
                    styles.metodoCard,
                    { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                    metodo === 'mpesa' && { borderColor: '#ED1C24', borderWidth: 2 },
                  ]}
                  onPress={() => setMetodo('mpesa')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.metodoIcone, { backgroundColor: 'rgba(237, 28, 36, 0.1)' }]}>
                    <Icone name="cellphone" size={22} color="#ED1C24" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metodoNome, { color: cores.textoPrincipal }]}>M-Pesa</Text>
                    <Text style={[styles.metodoDesc, { color: cores.textoSecundario }]}>
                      Vodacom · 84 ou 85
                    </Text>
                  </View>
                  {metodo === 'mpesa' && (
                    <Ionicons name="checkmark-circle" size={22} color="#ED1C24" />
                  )}
                </TouchableOpacity>

                {/* eMola */}
                <TouchableOpacity
                  style={[
                    styles.metodoCard,
                    { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                    metodo === 'emola' && { borderColor: '#0066B3', borderWidth: 2 },
                  ]}
                  onPress={() => setMetodo('emola')}
                  activeOpacity={0.85}
                >
                  <View style={[styles.metodoIcone, { backgroundColor: 'rgba(0, 102, 179, 0.1)' }]}>
                    <Icone name="cellphone-wireless" size={22} color="#0066B3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metodoNome, { color: cores.textoPrincipal }]}>eMola</Text>
                    <Text style={[styles.metodoDesc, { color: cores.textoSecundario }]}>
                      Movitel · 82, 83, 86 ou 87
                    </Text>
                  </View>
                  {metodo === 'emola' && (
                    <Ionicons name="checkmark-circle" size={22} color="#0066B3" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Input de número (só se não for crédito) */}
              {metodo !== 'credito' && (
                <View style={[styles.inputCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                  <Text style={[styles.inputLabel, { color: cores.textoPrincipal }]}>
                    Número {metodo === 'mpesa' ? 'M-Pesa' : 'eMola'}
                  </Text>
                  <View style={[
                    styles.inputWrapper,
                    { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil },
                    erroNumero && { borderColor: VERMELHO_ERRO, backgroundColor: 'rgba(211, 47, 47, 0.05)' },
                  ]}>
                    <View style={[styles.inputPrefixo, { backgroundColor: cores.principalClara, borderRightColor: cores.bordaSubtil }]}>
                      <Text style={[styles.inputPrefixoTexto, { color: cores.principal }]}>+258</Text>
                    </View>
                    <TextInput
                      style={[styles.inputCampo, { color: cores.textoPrincipal }]}
                      placeholder={metodo === 'mpesa' ? '841234567' : '821234567'}
                      placeholderTextColor={cores.textoTerciario}
                      keyboardType="numeric"
                      maxLength={9}
                      value={numeroTelefone}
                      onChangeText={(texto) => {
                        setNumeroTelefone(texto.replace(/[^0-9]/g, ''));
                        if (erroNumero) setErroNumero(null);
                      }}
                    />
                    {numeroTelefone.length === 9 && !erroNumero && (
                      <View style={styles.inputCheck}>
                        <Ionicons name="checkmark" size={16} color={VERDE_SUCESSO} />
                      </View>
                    )}
                  </View>
                  {erroNumero ? (
                    <View style={styles.inputErro}>
                      <Ionicons name="warning" size={14} color={VERMELHO_ERRO} />
                      <Text style={styles.inputErroTexto}>{erroNumero}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.inputDica, { color: cores.textoTerciario }]}>
                      {metodo === 'mpesa'
                        ? 'Só funciona com Vodacom (84 ou 85)'
                        : 'Só funciona com Movitel (82, 83, 86 ou 87)'}
                    </Text>
                  )}
                </View>
              )}

              {/* Aviso de segurança */}
              <View style={[styles.avisoBox, { backgroundColor: 'rgba(10, 107, 192, 0.06)', borderColor: 'rgba(10, 107, 192, 0.2)' }]}>
                <Ionicons name="shield-checkmark" size={18} color={cores.principal} />
                <Text style={[styles.avisoTexto, { color: cores.textoSecundario }]}>
                  Este valor só paga o <Text style={{ fontFamily: Fonte.corpoSemi, color: cores.textoPrincipal }}>desbloqueio do contacto</Text>.{'\n'}
                  Depois vais negociar directamente com o anunciante. O GoHome <Text style={{ fontFamily: Fonte.corpoSemi }}>nunca</Text> processa pagamentos de arrendamento.
                </Text>
              </View>

              {/* Botão pagar */}
              <TouchableOpacity
                style={styles.botaoPagar}
                onPress={iniciarPagamento}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Icone
                  name={metodo === 'credito' ? 'wallet' : 'credit-card-check'}
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.botaoPagarTexto}>
                  {metodo === 'credito'
                    ? `Desbloquear com ${valorPago} MT de crédito`
                    : `Pagar ${valorPago} MT via ${metodo === 'mpesa' ? 'M-Pesa' : 'eMola'}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============ ENVIANDO ============ */}
          {estado === 'enviando_pedido' && (
            <View style={styles.conteudoProcessando}>
              <Animated.View style={[styles.loadingCirculo, { transform: [{ scale: pulseValue }] }]}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Icone name="loading" size={48} color={LARANJA_MARCA} />
                </Animated.View>
              </Animated.View>
              <Text style={[styles.processandoTitulo, { color: cores.textoPrincipal }]}>
                A enviar pedido {metodo === 'mpesa' ? 'M-Pesa' : 'eMola'}
              </Text>
              <Text style={[styles.processandoSubtitulo, { color: cores.textoSecundario }]}>
                Estamos a comunicar com a operadora. Aguarda alguns segundos...
              </Text>
            </View>
          )}

          {/* ============ AGUARDANDO PIN ============ */}
          {estado === 'aguardando_pin' && (
            <View style={styles.conteudoProcessando}>
              <Animated.View style={[styles.loadingCirculo, { transform: [{ scale: pulseValue }] }]}>
                <Icone name="cellphone-key" size={48} color={LARANJA_MARCA} />
              </Animated.View>
              <Text style={[styles.processandoTitulo, { color: cores.textoPrincipal }]}>
                Verifica o teu telefone
              </Text>
              <Text style={[styles.processandoSubtitulo, { color: cores.textoSecundario }]}>
                Recebeste um pedido no número{'\n'}
                <Text style={{ fontFamily: Fonte.corpoSemi, color: cores.textoPrincipal }}>+258 {numeroTelefone}</Text>
              </Text>

              <View style={[
                styles.timerBox,
                { backgroundColor: tempoCritico ? 'rgba(211,47,47,0.1)' : 'rgba(232, 118, 10,0.1)', borderColor: tempoCritico ? VERMELHO_ERRO : LARANJA_MARCA },
              ]}>
                <Ionicons name="time" size={18} color={tempoCritico ? VERMELHO_ERRO : LARANJA_MARCA} />
                <Text style={[styles.timerTexto, { color: tempoCritico ? VERMELHO_ERRO : LARANJA_MARCA }]}>
                  Tempo restante: {formatarTempo(tempoRestante)}
                </Text>
              </View>

              <View style={[styles.instrucoesBox, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                <Text style={[styles.instrucoesTitulo, { color: cores.textoPrincipal }]}>O que fazer agora:</Text>
                {[
                  'Verifica a notificação no teu telefone',
                  `Digita o teu PIN ${metodo === 'mpesa' ? 'M-Pesa' : 'eMola'} (4 dígitos)`,
                  `Confirma o pagamento de ${valorPago} MT`,
                ].map((texto, i) => (
                  <View key={i} style={styles.instrucaoItem}>
                    <View style={[styles.instrucaoNumero, { backgroundColor: LARANJA_MARCA }]}>
                      <Text style={styles.instrucaoNumeroTexto}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.instrucaoTexto, { color: cores.textoPrincipal }]}>{texto}</Text>
                  </View>
                ))}
              </View>

              {/* Botões DEMO (para teste) */}
              <View style={[styles.demoContainer, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
                <View style={styles.demoHeader}>
                  <Icone name="flask-outline" size={16} color={cores.textoSecundario} />
                  <Text style={[styles.demoLabel, { color: cores.textoSecundario }]}>
                    MODO TESTE (simular resposta)
                  </Text>
                </View>
                <View style={styles.demoBotoes}>
                  <TouchableOpacity style={[styles.demoBotao, { backgroundColor: VERDE_SUCESSO }]} onPress={simularSucesso}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.demoBotaoTexto}>Sucesso</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.demoBotao, { backgroundColor: VERMELHO_ERRO }]} onPress={simularFalha}>
                    <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.demoBotaoTexto}>Falha</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.demoBotao, { backgroundColor: AMARELO_AVISO }]} onPress={simularTimeout}>
                    <Ionicons name="time" size={16} color="#FFFFFF" />
                    <Text style={styles.demoBotaoTexto}>Timeout</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.cancelarBotao} onPress={() => setModalCancelarVisivel(true)}>
                <Text style={[styles.cancelarBotaoTexto, { color: cores.textoSecundario }]}>Cancelar pagamento</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============ SUCESSO ============ */}
          {estado === 'sucesso' && (
            <View style={styles.conteudoProcessando}>
              <View style={[styles.sucessoCirculo, { backgroundColor: VERDE_SUCESSO }]}>
                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
              </View>
              <Text style={[styles.sucessoTitulo, { color: VERDE_SUCESSO }]}>Contacto desbloqueado!</Text>
              <Text style={[styles.processandoSubtitulo, { color: cores.textoSecundario }]}>
                Vais ser levado para o anúncio...
              </Text>
            </View>
          )}

          {/* ============ FALHA ============ */}
          {estado === 'falha' && (
            <View style={styles.conteudoProcessando}>
              <View style={[styles.sucessoCirculo, { backgroundColor: VERMELHO_ERRO }]}>
                <Ionicons name="close" size={60} color="#FFFFFF" />
              </View>
              <Text style={[styles.sucessoTitulo, { color: VERMELHO_ERRO }]}>Pagamento recusado</Text>
              <Text style={[styles.processandoSubtitulo, { color: cores.textoSecundario }]}>
                {metodo === 'credito'
                  ? 'Saldo insuficiente ou erro ao debitar o crédito.'
                  : `A operadora ${metodo === 'mpesa' ? 'M-Pesa' : 'eMola'} recusou o pagamento. Verifica o saldo da tua conta.`}
              </Text>

              <TouchableOpacity style={styles.botaoPagar} onPress={tentarNovamente} activeOpacity={0.85}>
                <LinearGradient colors={[LARANJA_MARCA, LARANJA_ESCURO]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Icone name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.botaoPagarTexto}>Tentar novamente</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelarBotao} onPress={() => router.back()}>
                <Text style={[styles.cancelarBotaoTexto, { color: cores.textoSecundario }]}>Voltar ao anúncio</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ============ TIMEOUT ============ */}
          {estado === 'timeout' && (
            <View style={styles.conteudoProcessando}>
              <View style={[styles.sucessoCirculo, { backgroundColor: AMARELO_AVISO }]}>
                <Ionicons name="time" size={60} color="#FFFFFF" />
              </View>
              <Text style={[styles.sucessoTitulo, { color: AMARELO_AVISO }]}>Tempo esgotado</Text>
              <Text style={[styles.processandoSubtitulo, { color: cores.textoSecundario }]}>
                O pagamento demorou mais que 3 minutos.{'\n'}
                Tenta novamente.
              </Text>

              <TouchableOpacity style={styles.botaoPagar} onPress={tentarNovamente} activeOpacity={0.85}>
                <LinearGradient colors={[LARANJA_MARCA, LARANJA_ESCURO]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Icone name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.botaoPagarTexto}>Tentar novamente</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelarBotao} onPress={() => router.back()}>
                <Text style={[styles.cancelarBotaoTexto, { color: cores.textoSecundario }]}>Voltar ao anúncio</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL CANCELAR */}
      {modalCancelarVisivel && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCancelarBox, { backgroundColor: cores.fundoElevado }]}>
            <View style={styles.modalCancelarIcone}>
              <Icone name="alert-circle" size={32} color={AMARELO_AVISO} />
            </View>
            <Text style={[styles.modalCancelarTitulo, { color: cores.textoPrincipal }]}>Cancelar pagamento?</Text>
            <Text style={[styles.modalCancelarTexto, { color: cores.textoSecundario }]}>
              Se já introduziste o PIN no telefone, o pagamento pode ser processado mesmo assim.
            </Text>
            <View style={styles.modalCancelarBotoes}>
              <TouchableOpacity
                style={[styles.modalCancelarBotaoVoltar, { backgroundColor: LARANJA_MARCA }]}
                onPress={() => setModalCancelarVisivel(false)}
              >
                <Text style={styles.modalCancelarBotaoVoltarTexto}>Continuar pagamento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalCancelarBotaoCancelar, { backgroundColor: cores.fundoSuave }]}
                onPress={confirmarCancelar}
              >
                <Text style={styles.modalCancelarBotaoCancelarTexto}>Sim, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { backgroundColor: AZUL_HERO_INICIO },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  headerBotao: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { alignItems: 'center' },
  headerLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, letterSpacing: 1.5, fontFamily: Fonte.corpoSemi, marginBottom: 2 },
  headerTitulo: { color: '#FFFFFF', fontSize: 18, fontFamily: Fonte.corpoSemi },

  // Montante
  montanteContainer: { alignItems: 'center', paddingVertical: Spacing.lg },
  montanteLabel: { color: 'rgba(255,255,255,0.85)', fontFamily: Fonte.corpo, fontSize: 13, marginBottom: 8 },
  montanteLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  montanteValor: { color: '#FFFFFF', fontSize: 56, fontFamily: Fonte.tituloBold, lineHeight: 60 },
  montanteMoeda: { color: '#FFFFFF', fontSize: 24, fontFamily: Fonte.tituloSemi },
  descontoBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: LARANJA_MARCA,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5,
  },
  descontoBadgeTexto: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonte.corpoSemi, letterSpacing: 0.3 },

  scrollContent: { paddingBottom: Spacing.xxxl },

  // Formulário
  conteudoFormulario: { padding: Spacing.lg, gap: Spacing.md },

  // Resumo
  resumoCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  resumoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resumoTitulo: { fontFamily: Fonte.corpoSemi, fontSize: 13, letterSpacing: 0.5 },
  resumoAnuncioTitulo: { ...Typography.h4, marginBottom: 6, fontFamily: Fonte.corpoSemi },
  resumoMetaLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resumoMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resumoMetaTexto: { ...Typography.caption },
  resumoMetaDivisor: { width: 1, height: 12 },
  resumoDivisor: { height: 1, marginVertical: 8 },
  resumoLinhaInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  resumoLabel: { fontFamily: Fonte.corpo, fontSize: 13 },
  resumoValor: { fontSize: 14, fontFamily: Fonte.corpoSemi },

  // Métodos
  metodoSelector: { gap: Spacing.sm },
  metodoLabel: { fontSize: 11, fontFamily: Fonte.corpoSemi, letterSpacing: 1, marginBottom: 4, paddingHorizontal: 4 },
  metodoCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, gap: 12,
  },
  metodoIcone: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metodoNome: { fontSize: 15, fontFamily: Fonte.corpoSemi },
  metodoDesc: { fontFamily: Fonte.corpo, fontSize: 12, marginTop: 2 },

  // Input
  inputCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  inputLabel: { marginBottom: 10, fontFamily: Fonte.corpoSemi, fontSize: 15 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, overflow: 'hidden' },
  inputPrefixo: { paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: 1 },
  inputPrefixoTexto: { fontSize: 15, fontFamily: Fonte.corpoSemi },
  inputCampo: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 17, fontFamily: Fonte.corpoSemi },
  inputCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(46, 125, 50, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  inputErro: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  inputErroTexto: { ...Typography.caption, color: VERMELHO_ERRO, fontFamily: Fonte.corpoSemi },
  inputDica: { ...Typography.caption, marginTop: 8, fontSize: 11 },

  // Aviso
  avisoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  avisoTexto: { flex: 1, fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 18 },

  // Botão pagar
  botaoPagar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, overflow: 'hidden', gap: 10, marginTop: 4,
    shadowColor: LARANJA_MARCA, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  botaoPagarTexto: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonte.corpoSemi },

  // Processando
  conteudoProcessando: { padding: Spacing.lg, alignItems: 'center', paddingTop: 40 },
  loadingCirculo: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(232, 118, 10, 0.1)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 4, borderColor: 'rgba(232, 118, 10, 0.25)',
  },
  processandoTitulo: { ...Typography.h2, textAlign: 'center', marginBottom: 8, fontFamily: Fonte.tituloSemi },
  processandoSubtitulo: { ...Typography.body, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  // Timer
  timerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginBottom: 20, borderWidth: 1.5,
  },
  timerTexto: { fontSize: 15, fontFamily: Fonte.tituloSemi, fontVariant: ['tabular-nums'] },

  // Instruções
  instrucoesBox: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16, width: '100%' },
  instrucoesTitulo: { marginBottom: 12, fontFamily: Fonte.corpoSemi, fontSize: 14 },
  instrucaoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  instrucaoNumero: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  instrucaoNumeroTexto: { color: '#FFFFFF', fontSize: 12, fontFamily: Fonte.corpoSemi },
  instrucaoTexto: { flex: 1, fontFamily: Fonte.corpo, fontSize: 13 },

  // Demo
  demoContainer: { width: '100%', marginTop: 10, marginBottom: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed' },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  demoLabel: { fontSize: 10, fontFamily: Fonte.corpoSemi, letterSpacing: 0.8 },
  demoBotoes: { flexDirection: 'row', gap: 8 },
  demoBotao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10, gap: 5 },
  demoBotaoTexto: { color: '#FFFFFF', fontSize: 12, fontFamily: Fonte.corpoSemi },

  cancelarBotao: { paddingVertical: 12, marginTop: 6 },
  cancelarBotaoTexto: { fontSize: 14, fontFamily: Fonte.corpoSemi, textAlign: 'center', textDecorationLine: 'underline' },

  // Sucesso/Falha círculo
  sucessoCirculo: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  sucessoTitulo: { ...Typography.displayMD, textAlign: 'center', marginBottom: 8, fontFamily: Fonte.tituloBold },

  // Modal cancelar
  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center',
    padding: 20, zIndex: 100,
  },
  modalCancelarBox: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, alignItems: 'center' },
  modalCancelarIcone: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245, 124, 0, 0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalCancelarTitulo: { ...Typography.h3, textAlign: 'center', marginBottom: 10, fontFamily: Fonte.corpoSemi },
  modalCancelarTexto: { ...Typography.body, textAlign: 'center', marginBottom: 20, lineHeight: 20, fontSize: 14 },
  modalCancelarBotoes: { width: '100%', gap: 10 },
  modalCancelarBotaoVoltar: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalCancelarBotaoVoltarTexto: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonte.corpoSemi },
  modalCancelarBotaoCancelar: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  modalCancelarBotaoCancelarTexto: { color: VERMELHO_ERRO, fontSize: 14, fontFamily: Fonte.corpoSemi },
});