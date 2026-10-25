/**
 * app/chat/[id].tsx — Chat individual com teclado profissionalmente arranjado
 *
 * Fixes nesta versão:
 *  ✓ KeyboardAvoidingView envolve TUDO (header + mensagens + input)
 *  ✓ Android: behavior='height' em vez de undefined
 *  ✓ iOS: behavior='padding' com offset correcto
 *  ✓ Listener keyboardDidShow força scroll ao fim das mensagens
 *  ✓ Input bar sempre visível, mesmo com teclado aberto
 *  ✓ Última mensagem nunca fica tapada pelo teclado
 *
 * Features:
 *  • Paleta GoHome (azul #0A6BC0 + laranja #E8760A)
 *  • ANUNCIOS_MOCK (não IMOVEIS_MOCK)
 *  • Rota /anuncio/[id] (não /imovel/[id])
 *  • Detector regex anti-partilha de contactos (V10 de ANTI_FRAUDE.md)
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Modal,
  Pressable,
  Animated,
  Alert,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import EmojiPicker from 'rn-emoji-keyboard';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import { ANUNCIOS_MOCK, formatarPrecoCompleto } from '../../src/data/anuncios-mock';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_HERO_INICIO = '#0A6BC0';   // Azul GoHome — o mesmo da "Promoção lançamento"
const AZUL_HERO_FIM = '#095FAA';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';

// ============================================================
// DETECTOR REGEX ANTI-FRAUDE
// ============================================================
interface ResultadoDeteccao {
  suspeito: boolean;
  motivos: string[];
}

function detectarConteudoSuspeito(texto: string): ResultadoDeteccao {
  const motivos: string[] = [];
  const textoLimpo = texto.toLowerCase();

  const regexTelefone = /(?:\+?258[\s-]?)?[0-9]{2}[\s-]?[0-9]{3}[\s-]?[0-9]{3,4}/g;
  if (regexTelefone.test(texto)) motivos.push('Contém um número de telefone');

  const regexURL = /(https?:\/\/|www\.)[^\s]+/i;
  if (regexURL.test(texto)) motivos.push('Contém um link externo');

  const palavrasPagamento = [
    'm-pesa', 'mpesa', 'emola', 'e-mola',
    'transferencia', 'transferência', 'depósito', 'deposito',
    'caução', 'caucao', 'sinal', 'adiantar', 'adiantamento',
    'western union', 'moneygram', 'iban',
    'nib', 'conta bancária', 'conta bancaria',
    'número da conta', 'numero da conta',
  ];
  const palavraEncontrada = palavrasPagamento.find(p => textoLimpo.includes(p));
  if (palavraEncontrada) motivos.push(`Menciona pagamento: "${palavraEncontrada}"`);

  const forraDaApp = ['whatsapp', 'whats app', 'liga-me', 'ligar-me', 'liga para', 'contacta-me no'];
  const foraEncontrada = forraDaApp.find(p => textoLimpo.includes(p));
  if (foraEncontrada) motivos.push(`Pede comunicação fora da app: "${foraEncontrada}"`);

  const esquemas = ['estrangeiro', 'estrangeira', 'diaspora', 'portugal', 'africa do sul', 'viajar', 'enviar o dinheiro'];
  const esquemaEncontrado = esquemas.find(p => textoLimpo.includes(p));
  if (esquemaEncontrado) motivos.push(`Pode ser esquema internacional: "${esquemaEncontrado}"`);

  return { suspeito: motivos.length > 0, motivos };
}

// ============================================================
// TIPOS E MOCKS
// ============================================================
interface Mensagem {
  id: string;
  texto: string;
  autor: 'eu' | 'outro';
  hora: Date;
  tipo: 'texto' | 'foto';
  urlFoto?: string;
  lida: boolean;
  suspeita?: boolean;
  motivosSuspeita?: string[];
}

const conversasMock: Record<string, { nome: string; online: boolean; verificado: boolean; anuncioId: string }> = {
  '1': { nome: 'Maria Chissano', online: true, verificado: true, anuncioId: '1' },
  '2': { nome: 'Imobiliária Costa Sol', online: false, verificado: true, anuncioId: '2' },
  '3': { nome: 'João Nhamirre', online: false, verificado: false, anuncioId: '3' },
  '4': { nome: 'Ana Muchanga', online: false, verificado: false, anuncioId: '4' },
};

const mensagensIniciaisMock: Record<string, Mensagem[]> = {
  '1': [
    { id: 'm1', texto: 'Bom dia! Tenho interesse no seu quarto anunciado.', autor: 'eu', hora: new Date(Date.now() - 3600000 * 3), tipo: 'texto', lida: true },
    { id: 'm2', texto: 'Olá! Muito obrigada pelo contacto 😊', autor: 'outro', hora: new Date(Date.now() - 3600000 * 2.5), tipo: 'texto', lida: true },
    { id: 'm3', texto: 'Sim, o quarto ainda está disponível. Quando gostaria de visitar?', autor: 'outro', hora: new Date(Date.now() - 3600000 * 2), tipo: 'texto', lida: true },
    { id: 'm4', texto: 'Excelente! Estava a pensar visitar amanhã de manhã, seria possível?', autor: 'eu', hora: new Date(Date.now() - 3600000), tipo: 'texto', lida: true },
  ],
  '2': [
    { id: 'm1', texto: 'Boa tarde, tenho interesse no apartamento T2 na Ponta-Gêa.', autor: 'eu', hora: new Date(Date.now() - 3600000 * 5), tipo: 'texto', lida: true },
    { id: 'm2', texto: 'Boa tarde! Muito obrigada pelo interesse. Podemos marcar visita esta semana.', autor: 'outro', hora: new Date(Date.now() - 3600000 * 4), tipo: 'texto', lida: true },
  ],
  '3': [
    { id: 'm1', texto: 'Olá, gostava de saber mais sobre a casa.', autor: 'eu', hora: new Date(Date.now() - 86400000), tipo: 'texto', lida: true },
    { id: 'm2', texto: 'A casa tem 3 quartos e 2 casas de banho.', autor: 'outro', hora: new Date(Date.now() - 86400000 + 3600000), tipo: 'texto', lida: true },
  ],
  '4': [
    { id: 'm1', texto: 'Bom dia, o quarto ainda está disponível?', autor: 'eu', hora: new Date(Date.now() - 86400000 * 3), tipo: 'texto', lida: true },
    { id: 'm2', texto: 'Sim! Podes visitar amanhã às 10h?', autor: 'outro', hora: new Date(Date.now() - 86400000 * 3 + 3600000), tipo: 'texto', lida: true },
    { id: 'm3', texto: 'Perfeito, aguardo a tua visita amanhã às 10h ✓✓', autor: 'outro', hora: new Date(Date.now() - 86400000 * 2), tipo: 'texto', lida: true },
  ],
};

const respostasAutomaticas = [
  'Claro! Podemos combinar.',
  'Sim, sem problemas.',
  'Certo, obrigada!',
  'Óptimo, aguardo a sua confirmação.',
  'Perfeito, combinado.',
  'Pode ser, sim.',
  'Vou verificar e já te respondo.',
  'Entendido, obrigada pelo contacto.',
  'Sim, é possível.',
  'Claro que sim!',
];

export default function ChatScreen() {
  const router = useRouter();
  const cores = useCores();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const conversa = conversasMock[id || '1'] || conversasMock['1'];
  const anuncio = ANUNCIOS_MOCK.find(a => a.id === conversa.anuncioId);

  const [mensagens, setMensagens] = useState<Mensagem[]>(
    mensagensIniciaisMock[id || '1'] || []
  );
  const [texto, setTexto] = useState('');
  const [aEscrever, setAEscrever] = useState(false);
  const [emojiVisivel, setEmojiVisivel] = useState(false);
  const [modalAnexoVisivel, setModalAnexoVisivel] = useState(false);
  const [modalOpcoesVisivel, setModalOpcoesVisivel] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const escreverAnim1 = useRef(new Animated.Value(0)).current;
  const escreverAnim2 = useRef(new Animated.Value(0)).current;
  const escreverAnim3 = useRef(new Animated.Value(0)).current;

  // ============ FIX TECLADO: scroll ao fim quando teclado aparece ============
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Animação pontinhos "a escrever"
  useEffect(() => {
    if (aEscrever) {
      const animarPonto = (anim: Animated.Value, delay: number) => Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
      const a1 = animarPonto(escreverAnim1, 0);
      const a2 = animarPonto(escreverAnim2, 150);
      const a3 = animarPonto(escreverAnim3, 300);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }
  }, [aEscrever]);

  // Auto scroll ao adicionar mensagem
  useEffect(() => {
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [mensagens, aEscrever]);

  const enviarMensagem = () => {
    if (!texto.trim()) return;

    const deteccao = detectarConteudoSuspeito(texto);
    if (deteccao.suspeito) {
      Alert.alert(
        '⚠️ Mensagem suspeita',
        `A tua mensagem contém:\n\n• ${deteccao.motivos.join('\n• ')}\n\nA GoHome aconselha a manter o contacto DENTRO da app e NUNCA pagar antes de visitar o imóvel. Queres mesmo enviar?`,
        [
          { text: 'Rever mensagem', style: 'cancel' },
          { text: 'Enviar mesmo assim', style: 'destructive', onPress: () => enviarMensagemFinal(texto, false) },
        ]
      );
      return;
    }
    enviarMensagemFinal(texto, false);
  };

  const enviarMensagemFinal = (textoFinal: string, suspeita: boolean) => {
    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      texto: textoFinal.trim(),
      autor: 'eu',
      hora: new Date(),
      tipo: 'texto',
      lida: false,
      suspeita,
    };
    setMensagens(prev => [...prev, novaMensagem]);
    setTexto('');

    setTimeout(() => {
      setAEscrever(true);
      setTimeout(() => {
        setAEscrever(false);
        const textoResposta = respostasAutomaticas[Math.floor(Math.random() * respostasAutomaticas.length)];
        const deteccao = detectarConteudoSuspeito(textoResposta);
        const resposta: Mensagem = {
          id: (Date.now() + 1).toString(),
          texto: textoResposta,
          autor: 'outro',
          hora: new Date(),
          tipo: 'texto',
          lida: true,
          suspeita: deteccao.suspeito,
          motivosSuspeita: deteccao.motivos,
        };
        setMensagens(prev => [...prev, resposta]);
      }, 2000);
    }, 1000);
  };

  const reportarMensagem = () => {
    router.push({
      pathname: '/anuncio/reportar',
      params: { id: anuncio?.id || conversa.anuncioId, titulo: anuncio?.titulo || conversa.nome },
    });
  };

  const escolherEmoji = (emoji: { emoji: string }) => setTexto(prev => prev + emoji.emoji);

  const tirarFoto = async () => {
    setModalAnexoVisivel(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) enviarFoto(result.assets[0].uri);
  };

  const escolherGaleria = async () => {
    setModalAnexoVisivel(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) enviarFoto(result.assets[0].uri);
  };

  const enviarFoto = (uri: string) => {
    const novaMensagem: Mensagem = {
      id: Date.now().toString(), texto: '', autor: 'eu', hora: new Date(),
      tipo: 'foto', urlFoto: uri, lida: false,
    };
    setMensagens(prev => [...prev, novaMensagem]);
  };

  const formatarHora = (data: Date) => data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

  const formatarDia = (data: Date) => {
    const hoje = new Date();
    const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
    if (data.toDateString() === hoje.toDateString()) return 'Hoje';
    if (data.toDateString() === ontem.toDateString()) return 'Ontem';
    return data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  };

  const deveMostrarSeparador = (index: number) => {
    if (index === 0) return true;
    return mensagens[index - 1].hora.toDateString() !== mensagens[index].hora.toDateString();
  };

  const renderMensagem = ({ item, index }: { item: Mensagem; index: number }) => {
    const isMinha = item.autor === 'eu';
    const mostrarSeparador = deveMostrarSeparador(index);

    return (
      <>
        {mostrarSeparador && (
          <View style={styles.separadorDia}>
            <View style={[styles.separadorLinha, { backgroundColor: cores.bordaSubtil }]} />
            <View style={[styles.separadorTextoContainer, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[styles.separadorTexto, { color: cores.textoSecundario }]}>{formatarDia(item.hora)}</Text>
            </View>
            <View style={[styles.separadorLinha, { backgroundColor: cores.bordaSubtil }]} />
          </View>
        )}

        <View style={[styles.mensagemContainer, isMinha ? styles.mensagemMinha : styles.mensagemOutro]}>
          {item.tipo === 'foto' ? (
            <TouchableOpacity activeOpacity={0.9}>
              <Image source={{ uri: item.urlFoto }} style={styles.mensagemFoto} />
              <View style={styles.mensagemFotoInfo}>
                <Text style={styles.mensagemHora}>{formatarHora(item.hora)}</Text>
                {isMinha && <Ionicons name="checkmark-done" size={14} color={item.lida ? '#4FC3F7' : 'rgba(255,255,255,0.8)'} />}
              </View>
            </TouchableOpacity>
          ) : (
            <>
              {item.suspeita && !isMinha && item.motivosSuspeita && (
                <View style={styles.alertaSuspeita}>
                  <View style={styles.alertaSuspeitaHeader}>
                    <Ionicons name="warning" size={13} color={Colors.erro} />
                    <Text style={styles.alertaSuspeitaTitulo}>Possível tentativa de fraude</Text>
                  </View>
                  <Text style={styles.alertaSuspeitaDesc} numberOfLines={2}>{item.motivosSuspeita[0]}</Text>
                  <TouchableOpacity style={styles.alertaSuspeitaBotao} onPress={reportarMensagem}>
                    <Ionicons name="flag" size={11} color={Colors.erro} />
                    <Text style={styles.alertaSuspeitaBotaoTexto}>Reportar</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[
                styles.bolhaMensagem,
                isMinha ? styles.bolhaMinha : [styles.bolhaOutro, { backgroundColor: cores.fundoElevado }],
                item.suspeita && !isMinha && { borderWidth: 1.5, borderColor: Colors.erro },
              ]}>
                {isMinha ? (
                  <LinearGradient
                    colors={[AZUL_HERO_INICIO, AZUL_HERO_FIM]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  />
                ) : null}
                <Text style={[styles.mensagemTexto, { color: isMinha ? '#FFFFFF' : cores.textoPrincipal }]}>
                  {item.texto}
                </Text>
                <View style={styles.mensagemMeta}>
                  <Text style={[styles.mensagemHora, { color: isMinha ? 'rgba(255,255,255,0.8)' : cores.textoTerciario }]}>
                    {formatarHora(item.hora)}
                  </Text>
                  {isMinha && (
                    <Ionicons name="checkmark-done" size={14} color={item.lida ? '#4FC3F7' : 'rgba(255,255,255,0.7)'} />
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </>
    );
  };

  // ============================================================
  // RENDER PRINCIPAL — Estrutura KeyboardAvoidingView correcta
  // ============================================================
  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle={cores.ehEscuro ? 'light-content' : 'dark-content'} backgroundColor={cores.fundoElevado} />

      {/* KeyboardAvoidingView envolve TUDO (header + mensagens + input) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* HEADER FIXO */}
        <SafeAreaView
          style={[styles.safeAreaTop, { backgroundColor: cores.fundoElevado, borderBottomColor: cores.bordaSubtil }]}
          edges={['top']}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={cores.textoPrincipal} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
              <View style={styles.headerAvatarContainer}>
                <LinearGradient
                  colors={[AZUL_HERO_INICIO, AZUL_HERO_FIM]}
                  style={styles.headerAvatar}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.headerAvatarLetra}>{conversa.nome.charAt(0)}</Text>
                </LinearGradient>
                {conversa.online && <View style={styles.headerOnlineDot} />}
              </View>
              <View style={styles.headerTextos}>
                <View style={styles.headerNomeContainer}>
                  <Text style={[styles.headerNome, { color: cores.textoPrincipal }]} numberOfLines={1}>
                    {conversa.nome}
                  </Text>
                  {conversa.verificado && (
                    <View style={[styles.verificadoBadge, { backgroundColor: cores.principal }]}>
                      <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.headerStatus, { color: cores.textoSecundario }]}>
                  {conversa.online ? 'online' : 'há 5 min'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerAcoes}>
              <TouchableOpacity
                style={[styles.headerAcaoBotao, { backgroundColor: cores.fundoSuave }]}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Chamada', 'Funcionalidade em breve')}
              >
                <Ionicons name="call" size={18} color={cores.principal} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerAcaoBotao, { backgroundColor: cores.fundoSuave }]}
                onPress={() => setModalOpcoesVisivel(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={cores.textoPrincipal} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card do anúncio */}
          {anuncio && (
            <TouchableOpacity
              style={[styles.anuncioCard, { backgroundColor: cores.fundoSuave }]}
              onPress={() => router.push(`/anuncio/${anuncio.id}` as any)}
              activeOpacity={0.85}
            >
              {anuncio.fotos && anuncio.fotos.length > 0 ? (
                <Image source={{ uri: anuncio.fotos[0] }} style={styles.anuncioFoto} />
              ) : (
                <View style={[styles.anuncioFoto, { backgroundColor: cores.bordaSubtil, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="home-outline" size={20} color={cores.textoTerciario} />
                </View>
              )}
              <View style={styles.anuncioInfo}>
                <View style={styles.anuncioBadge}>
                  <Icone name="home" size={10} color={cores.principal} />
                  <Text style={[styles.anuncioBadgeText, { color: cores.principal }]}>
                    ANÚNCIO EM CONVERSA
                  </Text>
                </View>
                <Text style={[styles.anuncioTitulo, { color: cores.textoPrincipal }]} numberOfLines={1}>
                  {anuncio.titulo}
                </Text>
                <Text style={[styles.anuncioPreco, { color: LARANJA_MARCA }]}>
                  {formatarPrecoCompleto(anuncio)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={cores.textoTerciario} />
            </TouchableOpacity>
          )}

          {/* Aviso de segurança */}
          <View style={[styles.avisoSeguranca, { backgroundColor: 'rgba(10, 107, 192, 0.08)', borderColor: 'rgba(10, 107, 192, 0.2)' }]}>
            <Ionicons name="shield-checkmark" size={14} color={cores.principal} />
            <Text style={[styles.avisoSegurancaTexto, { color: cores.textoSecundario }]}>
              Mantém a conversa aqui. <Text style={{ fontFamily: Fonte.corpoSemi, color: cores.textoPrincipal }}>Nunca pagues antes de visitar.</Text>
            </Text>
          </View>
        </SafeAreaView>

        {/* ÁREA DE MENSAGENS (flex: 1 - ocupa espaço disponível) */}
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={renderMensagem}
          contentContainerStyle={styles.mensagensLista}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            aEscrever ? (
              <View style={styles.escreverContainer}>
                <View style={[styles.escreverBolha, { backgroundColor: cores.fundoElevado }]}>
                  <View style={styles.escreverPontos}>
                    <Animated.View style={[styles.escreverPonto, { backgroundColor: cores.textoSecundario, transform: [{ translateY: escreverAnim1 }] }]} />
                    <Animated.View style={[styles.escreverPonto, { backgroundColor: cores.textoSecundario, transform: [{ translateY: escreverAnim2 }] }]} />
                    <Animated.View style={[styles.escreverPonto, { backgroundColor: cores.textoSecundario, transform: [{ translateY: escreverAnim3 }] }]} />
                  </View>
                </View>
                <Text style={[styles.escreverTexto, { color: cores.textoSecundario }]}>
                  {conversa.nome.split(' ')[0]} está a escrever...
                </Text>
              </View>
            ) : null
          }
        />

        {/* BARRA DE INPUT — fica colada ao bottom, sobe com o teclado */}
        <View
          style={[
            styles.inputBarContainer,
            {
              backgroundColor: cores.fundoElevado,
              borderTopColor: cores.bordaSubtil,
              paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            },
          ]}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.inputBotaoAnexo, { backgroundColor: 'rgba(232, 118, 10, 0.12)' }]}
              onPress={() => setModalAnexoVisivel(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={LARANJA_MARCA} />
            </TouchableOpacity>

            <View style={[styles.inputCampo, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
              <TextInput
                style={[styles.input, { color: cores.textoPrincipal }]}
                placeholder="Mensagem..."
                placeholderTextColor={cores.textoTerciario}
                value={texto}
                onChangeText={setTexto}
                multiline
                maxLength={500}
                onFocus={() => {
                  // Garantir scroll ao fim quando o input ganha foco
                  setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
                }}
              />
              <TouchableOpacity
                style={styles.inputBotaoEmoji}
                onPress={() => {
                  Keyboard.dismiss();
                  setTimeout(() => setEmojiVisivel(true), 100);
                }}
                activeOpacity={0.7}
              >
                <Icone name="emoticon-outline" size={22} color={cores.textoSecundario} />
              </TouchableOpacity>
            </View>

            {texto.trim() ? (
              <TouchableOpacity
                style={styles.inputBotaoEnviar}
                onPress={enviarMensagem}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[AZUL_HERO_INICIO, AZUL_HERO_FIM]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                />
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.inputBotaoMic, { backgroundColor: AZUL_HERO_FIM }]}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Áudio', 'Funcionalidade em breve')}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Emoji Picker */}
      <EmojiPicker
        open={emojiVisivel}
        onEmojiSelected={escolherEmoji}
        onClose={() => setEmojiVisivel(false)}
        enableRecentlyUsed
        categoryPosition="bottom"
        translation={{
          recently_used: 'Recentes', smileys_emotion: 'Emoções', people_body: 'Pessoas',
          animals_nature: 'Animais', food_drink: 'Comida', travel_places: 'Viagem',
          activities: 'Actividades', objects: 'Objectos', symbols: 'Símbolos',
          flags: 'Bandeiras', search: 'Pesquisar',
        }}
      />

      {/* Modal Anexo */}
      <Modal visible={modalAnexoVisivel} transparent animationType="fade" onRequestClose={() => setModalAnexoVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalAnexoVisivel(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: cores.fundoElevado }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />
            <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>Enviar anexo</Text>

            <TouchableOpacity style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]} onPress={tirarFoto} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(10, 107, 192, 0.15)' }]}>
                <Ionicons name="camera" size={22} color={cores.principal} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={[styles.modalOpcaoTitulo, { color: cores.textoPrincipal }]}>Câmara</Text>
                <Text style={[styles.modalOpcaoDescricao, { color: cores.textoSecundario }]}>Tirar foto agora</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={cores.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]} onPress={escolherGaleria} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Ionicons name="images" size={22} color={Colors.verde} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={[styles.modalOpcaoTitulo, { color: cores.textoPrincipal }]}>Galeria</Text>
                <Text style={[styles.modalOpcaoDescricao, { color: cores.textoSecundario }]}>Escolher foto existente</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={cores.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]}
              onPress={() => { setModalAnexoVisivel(false); Alert.alert('Localização', 'Funcionalidade em breve'); }}
              activeOpacity={0.7}
            >
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(232, 118, 10, 0.15)' }]}>
                <Ionicons name="location" size={22} color={LARANJA_MARCA} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={[styles.modalOpcaoTitulo, { color: cores.textoPrincipal }]}>Localização</Text>
                <Text style={[styles.modalOpcaoDescricao, { color: cores.textoSecundario }]}>Partilhar tua localização</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={cores.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalAnexoVisivel(false)} activeOpacity={0.7}>
              <Text style={[styles.modalCancelarTexto, { color: cores.textoSecundario }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Opções */}
      <Modal visible={modalOpcoesVisivel} transparent animationType="fade" onRequestClose={() => setModalOpcoesVisivel(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalOpcoesVisivel(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: cores.fundoElevado }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />
            <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>Opções</Text>

            <TouchableOpacity style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(10, 107, 192, 0.15)' }]}>
                <Ionicons name="person" size={22} color={cores.principal} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: cores.textoPrincipal }]}>Ver perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(232, 118, 10, 0.15)' }]}>
                <Ionicons name="notifications-off" size={22} color={LARANJA_MARCA} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: cores.textoPrincipal }]}>Silenciar notificações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(158, 158, 158, 0.15)' }]}>
                <Ionicons name="archive" size={22} color={cores.textoSecundario} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: cores.textoPrincipal }]}>Arquivar conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]}
              activeOpacity={0.7}
              onPress={() => {
                setModalOpcoesVisivel(false);
                reportarMensagem();
              }}
            >
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                <Ionicons name="flag" size={22} color={Colors.erro} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: Colors.erro }]}>Denunciar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOpcao, { backgroundColor: cores.fundoSuave }]} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                <Ionicons name="trash" size={22} color={Colors.erro} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: Colors.erro }]}>Apagar conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalOpcoesVisivel(false)} activeOpacity={0.7}>
              <Text style={[styles.modalCancelarTexto, { color: cores.textoSecundario }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeAreaTop: {
    borderBottomWidth: 1,
    ...Sombras.sm,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs,
  },
  botaoVoltar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerAvatarContainer: { position: 'relative' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  headerAvatarLetra: { ...Typography.h3, color: '#FFFFFF', fontFamily: Fonte.corpoSemi },
  headerOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.verde, borderWidth: 2, borderColor: '#FFFFFF',
  },
  headerTextos: { flex: 1 },
  headerNomeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerNome: { ...Typography.bodyBold, fontSize: 15, flexShrink: 1 },
  verificadoBadge: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerStatus: { ...Typography.caption, marginTop: 1 },
  headerAcoes: { flexDirection: 'row', gap: 4 },
  headerAcaoBotao: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  // Card anúncio
  anuncioCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.sm, borderRadius: Radius.md, gap: Spacing.sm,
    borderLeftWidth: 3, borderLeftColor: LARANJA_MARCA,
  },
  anuncioFoto: { width: 48, height: 48, borderRadius: Radius.sm },
  anuncioInfo: { flex: 1 },
  anuncioBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  anuncioBadgeText: { ...Typography.captionBold, fontSize: 9, letterSpacing: 0.5 },
  anuncioTitulo: { ...Typography.bodyBold, fontSize: 13 },
  anuncioPreco: { ...Typography.captionBold, fontSize: 12, marginTop: 2 },

  // Aviso segurança
  avisoSeguranca: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1,
  },
  avisoSegurancaTexto: { flex: 1, fontFamily: Fonte.corpo, fontSize: 11, lineHeight: 15 },

  mensagensLista: { padding: Spacing.md, paddingBottom: Spacing.lg },

  separadorDia: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md, gap: Spacing.sm },
  separadorLinha: { flex: 1, height: 1 },
  separadorTextoContainer: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  separadorTexto: { ...Typography.captionBold, fontSize: 11, letterSpacing: 0.5 },

  mensagemContainer: { marginBottom: Spacing.xs, maxWidth: '82%' },
  mensagemMinha: { alignSelf: 'flex-end' },
  mensagemOutro: { alignSelf: 'flex-start' },
  bolhaMensagem: { padding: 10, paddingHorizontal: 14, borderRadius: 18, overflow: 'hidden', minWidth: 80 },
  bolhaMinha: { borderBottomRightRadius: 4, ...Sombras.sm },
  bolhaOutro: { borderBottomLeftRadius: 4, ...Sombras.sm },
  mensagemTexto: { ...Typography.body, lineHeight: 20 },
  mensagemMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  mensagemHora: { fontSize: 10, fontFamily: Fonte.corpoMedio },

  alertaSuspeita: {
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.3)',
    borderRadius: 12, padding: 10, marginBottom: 6, maxWidth: 300,
  },
  alertaSuspeitaHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  alertaSuspeitaTitulo: { color: Colors.erro, fontSize: 11, fontFamily: Fonte.corpoSemi },
  alertaSuspeitaDesc: { color: '#8B1A1A', fontFamily: Fonte.corpo, fontSize: 11, lineHeight: 15, marginBottom: 6 },
  alertaSuspeitaBotao: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
    backgroundColor: 'rgba(244, 67, 54, 0.15)', alignSelf: 'flex-start',
  },
  alertaSuspeitaBotaoTexto: { color: Colors.erro, fontSize: 10, fontFamily: Fonte.corpoSemi },

  mensagemFoto: { width: 220, height: 220, borderRadius: 16, borderBottomRightRadius: 4 },
  mensagemFotoInfo: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },

  escreverContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  escreverBolha: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderBottomLeftRadius: 4, ...Sombras.sm,
  },
  escreverPontos: { flexDirection: 'row', gap: 4, alignItems: 'center', height: 12 },
  escreverPonto: { width: 8, height: 8, borderRadius: 4 },
  escreverTexto: { ...Typography.caption, fontStyle: 'italic' },

  // ============ BARRA DE INPUT ============
  inputBarContainer: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  inputBotaoAnexo: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  inputCampo: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-end',
    borderWidth: 1, borderRadius: 24,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    minHeight: 44, maxHeight: 120, gap: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 100,
  },
  inputBotaoEmoji: { padding: 4 },
  inputBotaoEnviar: {
    width: 44, height: 44, borderRadius: 22,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
    ...Sombras.colorida(AZUL_HERO_FIM),
  },
  inputBotaoMic: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    ...Sombras.colorida('#0A6BC0'),
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg, paddingBottom: Spacing.xl,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  modalTitulo: { ...Typography.h2, marginBottom: Spacing.lg, textAlign: 'center' },
  modalOpcao: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderRadius: Radius.lg,
    marginBottom: Spacing.xs, gap: Spacing.md,
  },
  modalOpcaoIcone: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  modalOpcaoInfo: { flex: 1 },
  modalOpcaoTitulo: { ...Typography.bodyBold },
  modalOpcaoDescricao: { ...Typography.caption, marginTop: 2 },
  modalCancelar: { padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  modalCancelarTexto: { ...Typography.button },
});