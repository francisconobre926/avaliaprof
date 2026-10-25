/**
 * app/pagamento-publicacao.tsx — Pagamento quando o ANUNCIANTE publica anúncio
 *
 * Rota: /pagamento-publicacao (com params do publicar.tsx)
 *
 * Fluxo:
 *   publicar.tsx → formulário completo → pagamento-publicacao → sucesso → confirmacao-publicacao
 *
 * Paleta GoHome aplicada:
 *   Hero gradient: azul GoHome profundo (#0A6BC0 → #095FAA)
 *   Botão pagar: laranja GoHome (#E8760A → #B95A05)
 *   Promoção -50%: laranja GoHome
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
import { Typography, Spacing } from '../src/theme/typography';
import { useUserStore } from '../src/store/userStore';

import { Fonte } from '../src/theme/fonts';
import Icone from '../src/components/Icone';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_HERO_INICIO = '#0A6BC0';   // Azul GoHome — o mesmo da "Promoção lançamento"
const AZUL_HERO_FIM = '#095FAA';
const AZUL_MARCA = '#0A6BC0';
const AZUL_PALE = 'rgba(10, 107, 192, 0.08)';
const AZUL_PALE_BORDA = 'rgba(10, 107, 192, 0.2)';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';
const LARANJA_PALE = 'rgba(232, 118, 10, 0.1)';
const LARANJA_PALE_BORDA = 'rgba(232, 118, 10, 0.25)';
const VERDE_SUCESSO = '#2F7A4F';
const VERMELHO_ERRO = '#C2412D';
const AMARELO_AVISO = '#E8760A';

type EstadoPagamento =
  | 'formulario'
  | 'enviando_pedido'
  | 'aguardando_pin'
  | 'sucesso'
  | 'falha'
  | 'timeout'
  | 'cancelado';

const TIMEOUT_SEGUNDOS = 180;

function validarNumeroMPesa(numero: string): { valido: boolean; erro?: string } {
  const limpo = numero.replace(/[^0-9]/g, '');
  if (limpo.length === 0) return { valido: false, erro: 'Introduz o teu número M-Pesa' };
  if (limpo.length !== 9) return { valido: false, erro: 'O número deve ter 9 dígitos (ex: 841234567)' };
  const prefixo = limpo.substring(0, 2);
  if (prefixo !== '84' && prefixo !== '85') {
    return { valido: false, erro: 'M-Pesa só funciona com números Vodacom (84 ou 85)' };
  }
  return { valido: true };
}

function formatarTempo(segundos: number): string {
  const min = Math.floor(segundos / 60);
  const sec = segundos % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export default function PagamentoPublicacao() {
  const router = useRouter();
  const usuario = useUserStore(state => state.usuario);

  const params = useLocalSearchParams<{
    anuncioId?: string;
    titulo?: string;
    categoria?: string;
    categoriaPersonalizada?: string;
    zona?: string;
    valorPago?: string;
    valorNormal?: string;
    finalidade?: string;
  }>();

  const anuncioId = params.anuncioId || `a${Date.now()}`;
  const titulo = params.titulo || 'Anúncio';
  const categoria = params.categoria || 'casa';
  const zona = params.zona || 'Beira';
  const valorPago = parseFloat(params.valorPago || '50');
  const valorNormal = parseFloat(params.valorNormal || '100');
  const finalidade = params.finalidade || 'arrendar';

  // Estado do fluxo
  const [estado, setEstado] = useState<EstadoPagamento>('formulario');
  const [numeroMPesa, setNumeroMPesa] = useState(() => {
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

  useEffect(() => {
    if (estado === 'enviando_pedido' || estado === 'aguardando_pin') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true,
        })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      spinValue.stopAnimation();
      pulseValue.stopAnimation();
    }
  }, [estado]);

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

  const iniciarPagamento = () => {
    const validacao = validarNumeroMPesa(numeroMPesa);
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
    const referencia = `MP${Date.now().toString().slice(-10).toUpperCase()}`;
    setTimeout(() => {
      router.replace({
        pathname: '/confirmacao-publicacao' as any,
        params: {
          anuncioId, titulo, categoria, zona,
          valorPago: String(valorPago), referencia,
        },
      });
    }, 1500);
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

  return (
    <View style={styles.container}>
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
              <Text style={styles.headerLabel}>PUBLICAR ANÚNCIO</Text>
              <Text style={styles.headerTitulo}>M-Pesa</Text>
            </View>
            <View style={styles.headerBotao} />
          </View>

          {/* Montante */}
          <View style={styles.montanteContainer}>
            <Text style={styles.montanteLabel}>Taxa de publicação</Text>
            <View style={styles.montanteLinha}>
              <Text style={styles.montanteValor}>{valorPago}</Text>
              <Text style={styles.montanteMoeda}>MT</Text>
            </View>
            <View style={styles.descontoBadge}>
              <Icone name="tag" size={12} color="#FFFFFF" />
              <Text style={styles.descontoBadgeTexto}>
                {`50% OFF — Antes ${valorNormal} MT`}
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
          {/* ESTADO: FORMULÁRIO */}
          {estado === 'formulario' && (
            <View style={styles.conteudoFormulario}>
              {/* Resumo */}
              <View style={styles.resumoCard}>
                <View style={styles.resumoHeader}>
                  <Icone name="file-document" size={20} color={AZUL_HERO_INICIO} />
                  <Text style={styles.resumoTitulo}>O teu anúncio</Text>
                </View>

                <Text style={styles.resumoAnuncioTitulo} numberOfLines={2}>{titulo}</Text>
                <View style={styles.resumoMetaLinha}>
                  <View style={styles.resumoMetaItem}>
                    <Icone name="shape" size={14} color="#5B616B" />
                    <Text style={styles.resumoMetaTexto}>{categoria}</Text>
                  </View>
                  <View style={styles.resumoMetaDivisor} />
                  <View style={styles.resumoMetaItem}>
                    <Ionicons name="location" size={14} color="#5B616B" />
                    <Text style={styles.resumoMetaTexto}>{zona}</Text>
                  </View>
                </View>

                <View style={styles.resumoDivisor} />

                <View style={styles.resumoLinhaInfo}>
                  <Text style={styles.resumoLabel}>Finalidade</Text>
                  <Text style={styles.resumoValor}>
                    {finalidade === 'arrendar' ? 'Arrendamento' : finalidade === 'vender' ? 'Venda' : 'Reserva'}
                  </Text>
                </View>
                <View style={styles.resumoLinhaInfo}>
                  <Text style={styles.resumoLabel}>Duração</Text>
                  <Text style={styles.resumoValor}>30 dias</Text>
                </View>
                <View style={styles.resumoLinhaInfo}>
                  <Text style={styles.resumoLabel}>Taxa total</Text>
                  <Text style={[styles.resumoValor, { color: LARANJA_MARCA, fontFamily: Fonte.corpoBold }]}>
                    {`${valorPago} MT`}
                  </Text>
                </View>
              </View>

              {/* Input M-Pesa */}
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>Número M-Pesa</Text>
                <View style={[styles.inputWrapper, erroNumero && styles.inputWrapperErro]}>
                  <View style={styles.inputPrefixo}>
                    <Text style={styles.inputPrefixoTexto}>+258</Text>
                  </View>
                  <TextInput
                    style={styles.inputCampo}
                    placeholder="841234567"
                    placeholderTextColor="#9A9EA5"
                    keyboardType="numeric"
                    maxLength={9}
                    value={numeroMPesa}
                    onChangeText={(texto) => {
                      setNumeroMPesa(texto.replace(/[^0-9]/g, ''));
                      if (erroNumero) setErroNumero(null);
                    }}
                  />
                  {numeroMPesa.length === 9 && !erroNumero && (
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
                  <Text style={styles.inputDica}>Só funciona com Vodacom (84 ou 85)</Text>
                )}
              </View>

              {/* Como funciona */}
              <View style={styles.comoFuncionaBox}>
                <View style={styles.comoFuncionaHeader}>
                  <Icone name="information" size={18} color={AZUL_HERO_INICIO} />
                  <Text style={styles.comoFuncionaTitulo}>Como funciona</Text>
                </View>
                <PassoInfo numero="1" texto="Clica em pagar abaixo" />
                <PassoInfo numero="2" texto="Vais receber um pedido no telefone" />
                <PassoInfo numero="3" texto="Digita o teu PIN M-Pesa para confirmar" />
                <PassoInfo numero="4" texto="O anúncio activa automaticamente" />
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
                <Icone name="credit-card-check" size={22} color="#FFFFFF" />
                <Text style={styles.botaoPagarTexto}>
                  {`Pagar ${valorPago} MT via M-Pesa`}
                </Text>
              </TouchableOpacity>

              <View style={styles.seguroInfo}>
                <Ionicons name="shield-checkmark" size={16} color={VERDE_SUCESSO} />
                <Text style={styles.seguroInfoTexto}>
                  Pagamento seguro processado pela Vodacom M-Pesa
                </Text>
              </View>
            </View>
          )}

          {/* ESTADO: ENVIANDO */}
          {estado === 'enviando_pedido' && (
            <View style={styles.conteudoProcessando}>
              <Animated.View style={[styles.loadingCirculo, { transform: [{ scale: pulseValue }] }]}>
                <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]}>
                  <Icone name="loading" size={48} color={LARANJA_MARCA} />
                </Animated.View>
              </Animated.View>

              <Text style={styles.processandoTitulo}>A enviar pedido M-Pesa</Text>
              <Text style={styles.processandoSubtitulo}>
                Estamos a comunicar com a Vodacom. Aguarda alguns segundos...
              </Text>

              <View style={styles.processandoStep}>
                <View style={styles.processandoStepIcone}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.processandoStepTexto}>Validação do número</Text>
              </View>
              <View style={styles.processandoStep}>
                <Animated.View style={[styles.processandoStepIconeLoading, { transform: [{ rotate: spin }] }]}>
                  <Icone name="loading" size={14} color="#FFFFFF" />
                </Animated.View>
                <Text style={styles.processandoStepTexto}>A enviar pedido ao M-Pesa...</Text>
              </View>
              <View style={styles.processandoStep}>
                <View style={styles.processandoStepIconePendente}>
                  <Text style={styles.processandoStepIconeTexto}>3</Text>
                </View>
                <Text style={[styles.processandoStepTexto, { opacity: 0.5 }]}>Aguardar PIN</Text>
              </View>
            </View>
          )}

          {/* ESTADO: AGUARDANDO PIN */}
          {estado === 'aguardando_pin' && (
            <View style={styles.conteudoProcessando}>
              <Animated.View style={[styles.loadingCirculo, { transform: [{ scale: pulseValue }] }]}>
                <Icone name="cellphone-key" size={48} color={LARANJA_MARCA} />
              </Animated.View>

              <Text style={styles.processandoTitulo}>Verifica o teu telefone</Text>
              <Text style={styles.processandoSubtitulo}>
                Recebeste um pedido M-Pesa no número{'\n'}
                <Text style={{ fontFamily: Fonte.corpoSemi }}>{`+258 ${numeroMPesa}`}</Text>
              </Text>

              <View style={[styles.timerBox, tempoCritico && styles.timerBoxCritico]}>
                <Ionicons name="time" size={18} color={tempoCritico ? VERMELHO_ERRO : LARANJA_MARCA} />
                <Text style={[styles.timerTexto, { color: tempoCritico ? VERMELHO_ERRO : LARANJA_MARCA }]}>
                  {`Tempo restante: ${formatarTempo(tempoRestante)}`}
                </Text>
              </View>

              <View style={styles.instrucoesBox}>
                <Text style={styles.instrucoesTitulo}>O que fazer agora:</Text>
                {[
                  'Verifica a notificação M-Pesa no telefone',
                  'Digita o teu PIN M-Pesa (4 dígitos)',
                  `Confirma o pagamento de ${valorPago} MT`,
                ].map((texto, i) => (
                  <View key={i} style={styles.instrucaoItem}>
                    <View style={styles.instrucaoNumero}>
                      <Text style={styles.instrucaoNumeroTexto}>{i + 1}</Text>
                    </View>
                    <Text style={styles.instrucaoTexto}>{texto}</Text>
                  </View>
                ))}
              </View>

              {/* Botões DEMO */}
              <View style={styles.demoContainer}>
                <View style={styles.demoHeader}>
                  <Icone name="flask-outline" size={16} color="#5B616B" />
                  <Text style={styles.demoLabel}>MODO TESTE (simular resposta)</Text>
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

              <TouchableOpacity
                style={styles.cancelarBotao}
                onPress={() => setModalCancelarVisivel(true)}
              >
                <Text style={styles.cancelarBotaoTexto}>Cancelar pagamento</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ESTADO: SUCESSO */}
          {estado === 'sucesso' && (
            <View style={styles.conteudoProcessando}>
              <View style={styles.sucessoCirculo}>
                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
              </View>
              <Text style={styles.sucessoTitulo}>Pagamento confirmado!</Text>
              <Text style={styles.processandoSubtitulo}>A redireccionar...</Text>
            </View>
          )}

          {/* ESTADO: FALHA */}
          {estado === 'falha' && (
            <View style={styles.conteudoProcessando}>
              <View style={styles.erroCirculo}>
                <Ionicons name="close" size={60} color="#FFFFFF" />
              </View>
              <Text style={styles.erroTitulo}>Pagamento recusado</Text>
              <Text style={styles.processandoSubtitulo}>
                O M-Pesa recusou o pagamento. Verifica o saldo da tua conta.
              </Text>

              <View style={styles.motivosBox}>
                <Text style={styles.motivosTitulo}>Possíveis causas:</Text>
                {['Saldo M-Pesa insuficiente', 'PIN introduzido incorrecto', 'Limite diário atingido'].map((motivo, i) => (
                  <View key={i} style={styles.motivoItem}>
                    <Ionicons name="ellipse" size={6} color="#5B616B" />
                    <Text style={styles.motivoTexto}>{motivo}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.botaoPagar} onPress={tentarNovamente} activeOpacity={0.85}>
                <LinearGradient colors={[LARANJA_MARCA, LARANJA_ESCURO]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Icone name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.botaoPagarTexto}>Tentar novamente</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelarBotao} onPress={() => router.back()}>
                <Text style={styles.cancelarBotaoTexto}>Voltar ao anúncio</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ESTADO: TIMEOUT */}
          {estado === 'timeout' && (
            <View style={styles.conteudoProcessando}>
              <View style={styles.timeoutCirculo}>
                <Ionicons name="time" size={60} color="#FFFFFF" />
              </View>
              <Text style={styles.timeoutTitulo}>Tempo esgotado</Text>
              <Text style={styles.processandoSubtitulo}>
                O pagamento demorou mais que 3 minutos.{'\n'}
                Tenta novamente ou cancela.
              </Text>

              <TouchableOpacity style={styles.botaoPagar} onPress={tentarNovamente} activeOpacity={0.85}>
                <LinearGradient colors={[LARANJA_MARCA, LARANJA_ESCURO]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Icone name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.botaoPagarTexto}>Tentar novamente</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelarBotao} onPress={() => router.back()}>
                <Text style={styles.cancelarBotaoTexto}>Voltar ao anúncio</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL CANCELAR */}
      {modalCancelarVisivel && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCancelarBox}>
            <View style={styles.modalCancelarIcone}>
              <Icone name="alert-circle" size={32} color={AMARELO_AVISO} />
            </View>
            <Text style={styles.modalCancelarTitulo}>Cancelar pagamento?</Text>
            <Text style={styles.modalCancelarTexto}>
              Se já introduziste o PIN no telefone, o pagamento pode ser processado mesmo assim. Tens a certeza que queres cancelar?
            </Text>
            <View style={styles.modalCancelarBotoes}>
              <TouchableOpacity
                style={styles.modalCancelarBotaoVoltar}
                onPress={() => setModalCancelarVisivel(false)}
              >
                <Text style={styles.modalCancelarBotaoVoltarTexto}>Continuar pagamento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelarBotaoCancelar}
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

function PassoInfo({ numero, texto }: { numero: string; texto: string }) {
  return (
    <View style={styles.passoInfo}>
      <View style={styles.passoInfoNumero}>
        <Text style={styles.passoInfoNumeroTexto}>{numero}</Text>
      </View>
      <Text style={styles.passoInfoTexto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F6FB' },
  safeArea: { backgroundColor: AZUL_HERO_INICIO },

  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  headerBotao: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, letterSpacing: 1.5, fontFamily: Fonte.corpoSemi, marginBottom: 2 },
  headerTitulo: { color: '#FFFFFF', fontSize: 18, fontFamily: Fonte.corpoSemi },

  montanteContainer: { alignItems: 'center', paddingVertical: Spacing.lg },
  montanteLabel: { color: 'rgba(255,255,255,0.85)', fontFamily: Fonte.corpo, fontSize: 13, marginBottom: 8 },
  montanteLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  montanteValor: { color: '#FFFFFF', fontSize: 56, fontFamily: Fonte.tituloBold, lineHeight: 60 },
  montanteMoeda: { color: '#FFFFFF', fontSize: 24, fontFamily: Fonte.tituloSemi },
  descontoBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: LARANJA_MARCA,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5,
  },
  descontoBadgeTexto: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonte.corpoSemi, letterSpacing: 0.3 },

  scrollContent: { paddingBottom: Spacing.xxxl },

  conteudoFormulario: { padding: Spacing.lg, gap: Spacing.md },

  resumoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#E7E5DF',
  },
  resumoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resumoTitulo: {
    ...Typography.bodyBold, color: AZUL_HERO_INICIO,
    fontFamily: Fonte.corpoSemi, fontSize: 14, letterSpacing: 0.5,
  },
  resumoAnuncioTitulo: { ...Typography.h4, color: AZUL_HERO_INICIO, marginBottom: 6, fontFamily: Fonte.corpoSemi },
  resumoMetaLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  resumoMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resumoMetaTexto: { ...Typography.caption, color: '#5B616B' },
  resumoMetaDivisor: { width: 1, height: 12, backgroundColor: '#E7E5DF' },
  resumoDivisor: { height: 1, backgroundColor: '#E7E5DF', marginVertical: 8 },
  resumoLinhaInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7,
  },
  resumoLabel: { ...Typography.caption, color: '#5B616B', fontSize: 13 },
  resumoValor: {
    ...Typography.bodyBold, color: AZUL_HERO_INICIO,
    fontSize: 14, textTransform: 'capitalize',
  },

  inputCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#E7E5DF',
  },
  inputLabel: {
    ...Typography.bodyBold, color: AZUL_HERO_INICIO,
    marginBottom: 10, fontFamily: Fonte.corpoSemi, fontSize: 15,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7F6F2', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E7E5DF', overflow: 'hidden',
  },
  inputWrapperErro: { borderColor: VERMELHO_ERRO, backgroundColor: '#FFF5F5' },
  inputPrefixo: {
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: AZUL_PALE,
    borderRightWidth: 1, borderRightColor: '#E7E5DF',
  },
  inputPrefixoTexto: {
    ...Typography.bodyBold, color: AZUL_HERO_INICIO,
    fontSize: 15, fontFamily: Fonte.corpoSemi,
  },
  inputCampo: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    ...Typography.h3, color: AZUL_HERO_INICIO, fontFamily: Fonte.corpoSemi,
  },
  inputCheck: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EAF3EC',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  inputErro: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  inputErroTexto: { ...Typography.caption, color: VERMELHO_ERRO, fontFamily: Fonte.corpoSemi },
  inputDica: { ...Typography.caption, color: '#5B616B', marginTop: 8, fontSize: 11 },

  comoFuncionaBox: {
    backgroundColor: AZUL_PALE,
    borderRadius: 16, padding: 16, gap: 10,
  },
  comoFuncionaHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  comoFuncionaTitulo: { ...Typography.bodyBold, color: AZUL_HERO_INICIO, fontFamily: Fonte.corpoSemi },
  passoInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passoInfoNumero: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: AZUL_HERO_INICIO,
    justifyContent: 'center', alignItems: 'center',
  },
  passoInfoNumeroTexto: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonte.corpoSemi },
  passoInfoTexto: { ...Typography.caption, color: '#1E2836', flex: 1 },

  botaoPagar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, overflow: 'hidden', gap: 10,
    shadowColor: LARANJA_MARCA, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
    marginTop: 4,
  },
  botaoPagarTexto: { color: '#FFFFFF', fontSize: 16, fontFamily: Fonte.corpoSemi },

  seguroInfo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 8, paddingVertical: 8,
  },
  seguroInfoTexto: { ...Typography.caption, color: VERDE_SUCESSO, fontSize: 11, fontFamily: Fonte.corpoSemi },

  conteudoProcessando: { padding: Spacing.lg, alignItems: 'center', paddingTop: 40 },
  loadingCirculo: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: LARANJA_PALE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 4, borderColor: LARANJA_PALE_BORDA,
  },
  loadingSpinner: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  processandoTitulo: {
    ...Typography.h2, color: AZUL_HERO_INICIO,
    textAlign: 'center', marginBottom: 8, fontFamily: Fonte.tituloSemi,
  },
  processandoSubtitulo: {
    ...Typography.body, color: '#5B616B',
    textAlign: 'center', marginBottom: 24, lineHeight: 20,
  },
  processandoStep: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    marginBottom: 8, width: '100%',
    borderWidth: 1, borderColor: '#E7E5DF',
  },
  processandoStepIcone: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: VERDE_SUCESSO,
    justifyContent: 'center', alignItems: 'center',
  },
  processandoStepIconeLoading: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: LARANJA_MARCA,
    justifyContent: 'center', alignItems: 'center',
  },
  processandoStepIconePendente: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#E7E5DF',
    justifyContent: 'center', alignItems: 'center',
  },
  processandoStepIconeTexto: { color: '#5B616B', fontSize: 11, fontFamily: Fonte.corpoSemi },
  processandoStepTexto: { ...Typography.body, color: '#1E2836', fontSize: 14 },

  timerBox: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, backgroundColor: LARANJA_PALE,
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
    marginBottom: 20, borderWidth: 1.5, borderColor: LARANJA_PALE_BORDA,
  },
  timerBoxCritico: {
    backgroundColor: '#FBECE9',
    borderColor: '#F2C9C1',
  },
  timerTexto: { fontSize: 15, fontFamily: Fonte.tituloSemi, fontVariant: ['tabular-nums'] },

  instrucoesBox: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E7E5DF',
    marginBottom: 16, width: '100%',
  },
  instrucoesTitulo: {
    ...Typography.bodyBold, color: AZUL_HERO_INICIO,
    marginBottom: 12, fontFamily: Fonte.corpoSemi,
  },
  instrucaoItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  instrucaoNumero: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: LARANJA_MARCA,
    justifyContent: 'center', alignItems: 'center',
  },
  instrucaoNumeroTexto: { color: '#FFFFFF', fontSize: 12, fontFamily: Fonte.corpoSemi },
  instrucaoTexto: { ...Typography.body, color: '#1E2836', flex: 1, fontSize: 13 },

  demoContainer: {
    width: '100%', marginTop: 10, marginBottom: 10, padding: 14,
    backgroundColor: '#F4F3EF', borderRadius: 14,
    borderWidth: 1, borderColor: '#E7E5DF', borderStyle: 'dashed',
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  demoLabel: { ...Typography.caption, color: '#5B616B', fontSize: 10, fontFamily: Fonte.corpoSemi, letterSpacing: 0.8 },
  demoBotoes: { flexDirection: 'row', gap: 8 },
  demoBotao: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10, gap: 5,
  },
  demoBotaoTexto: { color: '#FFFFFF', fontSize: 12, fontFamily: Fonte.corpoSemi },

  cancelarBotao: { paddingVertical: 12, marginTop: 6 },
  cancelarBotaoTexto: {
    color: '#5B616B', fontSize: 14, fontFamily: Fonte.corpoSemi,
    textAlign: 'center', textDecorationLine: 'underline',
  },

  sucessoCirculo: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: VERDE_SUCESSO,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: VERDE_SUCESSO, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  sucessoTitulo: {
    ...Typography.displayMD, color: VERDE_SUCESSO,
    textAlign: 'center', marginBottom: 8, fontFamily: Fonte.tituloBold,
  },

  erroCirculo: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: VERMELHO_ERRO,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: VERMELHO_ERRO, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  erroTitulo: {
    ...Typography.displayMD, color: VERMELHO_ERRO,
    textAlign: 'center', marginBottom: 8, fontFamily: Fonte.tituloBold,
  },

  motivosBox: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#F2C9C1',
    marginBottom: 20, width: '100%',
  },
  motivosTitulo: {
    ...Typography.bodyBold, color: '#8B1A1A',
    marginBottom: 10, fontFamily: Fonte.corpoSemi,
  },
  motivoItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  motivoTexto: { ...Typography.body, color: '#5A1414', fontSize: 13 },

  timeoutCirculo: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: AMARELO_AVISO,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
    shadowColor: AMARELO_AVISO, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  timeoutTitulo: {
    ...Typography.displayMD, color: AMARELO_AVISO,
    textAlign: 'center', marginBottom: 8, fontFamily: Fonte.tituloBold,
  },

  modalOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center', alignItems: 'center',
    padding: 20, zIndex: 100,
  },
  modalCancelarBox: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 380, alignItems: 'center',
  },
  modalCancelarIcone: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: LARANJA_PALE,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  modalCancelarTitulo: {
    ...Typography.h3, color: AZUL_HERO_INICIO,
    textAlign: 'center', marginBottom: 10, fontFamily: Fonte.corpoSemi,
  },
  modalCancelarTexto: {
    ...Typography.body, color: '#5B616B',
    textAlign: 'center', marginBottom: 20, lineHeight: 20, fontSize: 14,
  },
  modalCancelarBotoes: { width: '100%', gap: 10 },
  modalCancelarBotaoVoltar: {
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: LARANJA_MARCA, alignItems: 'center',
  },
  modalCancelarBotaoVoltarTexto: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonte.corpoSemi },
  modalCancelarBotaoCancelar: {
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F4F3EF', alignItems: 'center',
  },
  modalCancelarBotaoCancelarTexto: { color: VERMELHO_ERRO, fontSize: 14, fontFamily: Fonte.corpoSemi },
});