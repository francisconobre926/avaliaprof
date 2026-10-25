import { useState, useRef, useEffect } from 'react';

import {

  View,

  Text,
  Image,

  StyleSheet,

  TextInput,

  TouchableOpacity,

  Animated,

  StatusBar,

  KeyboardAvoidingView,

  Platform,

  ActivityIndicator,

  Alert,

  ScrollView,

} from 'react-native';

import { useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { Colors, Sombras } from '../../src/theme/colors';

import { Spacing, Typography, Radius } from '../../src/theme/typography';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
export default function EsqueciPasswordScreen() {

  const router = useRouter();

  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);

  const [enviado, setEnviado] = useState(false);

  const [campoFocado, setCampoFocado] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;

  const sucessoScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {

    Animated.parallel([

      Animated.timing(fadeAnim, {

        toValue: 1,

        duration: 600,

        useNativeDriver: true,

      }),

      Animated.spring(slideAnim, {

        toValue: 0,

        tension: 30,

        friction: 8,

        useNativeDriver: true,

      }),

    ]).start();

  }, []);

  useEffect(() => {

    if (enviado) {

      Animated.spring(sucessoScale, {

        toValue: 1,

        tension: 20,

        friction: 6,

        useNativeDriver: true,

      }).start();

    }

  }, [enviado]);

  const validarEmail = (email: string) => {

    return /^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email);

  };

  const handleEnviar = () => {

    if (!email) {

      Alert.alert('Email obrigatório', 'Introduz o teu email');

      return;

    }

    if (!validarEmail(email)) {

      Alert.alert('Email inválido', 'Introduz um email válido');

      return;

    }

    setLoading(true);

    setTimeout(() => {

      setLoading(false);

      setEnviado(true);

    }, 1500);

  };

  const irParaNovaPassword = () => {

    router.push({

      pathname: '/auth/nova-password',

      params: { email },

    });

  };

  const emailMascarado = email

    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`)

    : '';

  // ============ ESTADO: SUCESSO ============

  if (enviado) {

    return (

      <View style={styles.container}>

        <StatusBar barStyle="dark-content" backgroundColor={Colors.branco} />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

          <View style={styles.header}>

            <TouchableOpacity

              style={styles.botaoVoltar}

              onPress={() => router.back()}

              activeOpacity={0.7}

            >

              <Ionicons name="arrow-back" size={22} color={Colors.textoPrincipal} />

            </TouchableOpacity>

            <View style={styles.headerLogo}>
              <Image source={require('../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" />
            </View>

          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <Animated.View

              style={[

                styles.sucessoContainer,

                { transform: [{ scale: sucessoScale }] },

              ]}

            >

              {/* Ícone sucesso */}

              <View style={styles.sucessoIconContainer}>

                <View style={styles.sucessoCirculoExterno} />

                <View style={styles.sucessoCirculoMedio} />

                <LinearGradient

                  colors={Colors.gradienteSucesso}

                  style={styles.sucessoIcone}

                  start={{ x: 0, y: 0 }}

                  end={{ x: 1, y: 1 }}

                >

                  <Icone name="email-check" size={50} color={Colors.branco} />

                </LinearGradient>

              </View>

              <Text style={styles.sucessoTitulo}>Email enviado!</Text>

              <Text style={styles.sucessoSubtitulo}>

                Enviámos as instruções para redefinires a{'\n'}password para

              </Text>

              <View style={styles.emailBadge}>

                <Ionicons name="mail" size={14} color={Colors.azul} />

                <Text style={styles.emailBadgeTexto}>{emailMascarado}</Text>

              </View>

              {/* Passos */}

              <View style={styles.passosContainer}>

                <Text style={styles.passosTitulo}>Próximos passos</Text>

                <View style={styles.passoItem}>

                  <View style={styles.passoNumero}>

                    <Text style={styles.passoNumeroTexto}>1</Text>

                  </View>

                  <View style={styles.passoConteudo}>

                    <Text style={styles.passoTitulo}>Abre o teu email</Text>

                    <Text style={styles.passoDescricao}>

                      Procura o email do GoHome (verifica também o spam)

                    </Text>

                  </View>

                </View>

                <View style={styles.passoLinha} />

                <View style={styles.passoItem}>

                  <View style={styles.passoNumero}>

                    <Text style={styles.passoNumeroTexto}>2</Text>

                  </View>

                  <View style={styles.passoConteudo}>

                    <Text style={styles.passoTitulo}>Clica no link</Text>

                    <Text style={styles.passoDescricao}>

                      O link é válido durante 30 minutos

                    </Text>

                  </View>

                </View>

                <View style={styles.passoLinha} />

                <View style={styles.passoItem}>

                  <View style={styles.passoNumero}>

                    <Text style={styles.passoNumeroTexto}>3</Text>

                  </View>

                  <View style={styles.passoConteudo}>

                    <Text style={styles.passoTitulo}>Cria nova password</Text>

                    <Text style={styles.passoDescricao}>

                      Define uma password segura e única

                    </Text>

                  </View>

                </View>

              </View>

              {/* Simulação para demo */}

              <TouchableOpacity

                style={styles.simuladorBotao}

                onPress={irParaNovaPassword}

                activeOpacity={0.85}

              >

                <Icone name="cursor-default-click" size={18} color={Colors.azul} />

                <Text style={styles.simuladorTexto}>

                  Simular clique no link do email

                </Text>

              </TouchableOpacity>

              <Text style={styles.simuladorDica}>

                (Para efeitos de demonstração)

              </Text>

            </Animated.View>

          </ScrollView>

          {/* Footer */}

          <View style={styles.footer}>

            <TouchableOpacity

              style={styles.reenviarBotao}

              onPress={handleEnviar}

              activeOpacity={0.7}

            >

              <Ionicons name="refresh" size={16} color={Colors.azul} />

              <Text style={styles.reenviarBotaoTexto}>Reenviar email</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.voltarLogin}

              onPress={() => router.replace('/auth/login')}

              activeOpacity={0.7}

            >

              <Text style={styles.voltarLoginTexto}>Voltar ao login</Text>

            </TouchableOpacity>

          </View>

        </SafeAreaView>

      </View>

    );

  }

  // ============ ESTADO: FORMULÁRIO ============

  return (

    <KeyboardAvoidingView

      style={styles.container}

      behavior={Platform.OS === 'ios' ? 'padding' : undefined}

    >

      <StatusBar barStyle="dark-content" backgroundColor={Colors.branco} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}

        <View style={styles.header}>

          <TouchableOpacity

            style={styles.botaoVoltar}

            onPress={() => router.back()}

            activeOpacity={0.7}

          >

            <Ionicons name="arrow-back" size={22} color={Colors.textoPrincipal} />

          </TouchableOpacity>

          <View style={styles.headerLogo}>
              <Image source={require('../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" />
            </View>

        </View>

        <ScrollView

          showsVerticalScrollIndicator={false}

          contentContainerStyle={styles.scrollContent}

          keyboardShouldPersistTaps="handled"

        >

          <Animated.View

            style={[

              styles.content,

              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },

            ]}

          >

            {/* Ícone hero */}

            <View style={styles.heroContainer}>

              <View style={styles.heroCirculoExterno}>

                <View style={styles.heroCirculoMedio}>

                  <View style={styles.heroIcone}>

                    <Icone name="lock-reset" size={50} color={Colors.azul} />

                  </View>

                </View>

              </View>

            </View>

            {/* Título */}

            <Text style={styles.titulo}>Esqueci a password</Text>

            <Text style={styles.subtitulo}>

              Não te preocupes, acontece a todos.{'\n'}

              Vamos ajudar-te a recuperar o acesso.

            </Text>

            {/* Info card */}

            <View style={styles.infoCard}>

              <View style={styles.infoIconeContainer}>

                <Ionicons name="information-circle" size={20} color={Colors.azul} />

              </View>

              <Text style={styles.infoTexto}>

                Introduz o email da tua conta e vamos enviar instruções para redefinires a password

              </Text>

            </View>

            {/* Campo email */}

            <View style={styles.campoContainer}>

              <Text style={styles.campoLabel}>Email da conta</Text>

              <View style={[

                styles.inputWrapper,

                campoFocado && { borderColor: Colors.azul, borderWidth: 2 },

              ]}>

                <Ionicons name="mail-outline" size={20} color={Colors.textoSecundario} />

                <TextInput

                  style={styles.input}

                  placeholder="teu.email@exemplo.com"

                  placeholderTextColor={Colors.textoTerciario}

                  value={email}

                  onChangeText={setEmail}

                  keyboardType="email-address"

                  autoCapitalize="none"

                  autoFocus

                  onFocus={() => setCampoFocado(true)}

                  onBlur={() => setCampoFocado(false)}

                />

                {email.length > 0 && validarEmail(email) && (

                  <Ionicons name="checkmark-circle" size={20} color={Colors.verde} />

                )}

              </View>

            </View>

            {/* Botão enviar */}

            <TouchableOpacity

              style={[styles.botaoPrincipal, loading && { opacity: 0.7 }]}

              onPress={handleEnviar}

              disabled={loading}

              activeOpacity={0.9}

            >

              <LinearGradient

                colors={Colors.gradientePrimario}

                style={styles.botaoPrincipalGradient}

                start={{ x: 0, y: 0 }}

                end={{ x: 1, y: 0 }}

              >

                {loading ? (

                  <ActivityIndicator color={Colors.branco} size="small" />

                ) : (

                  <>

                    <Ionicons name="send" size={20} color={Colors.branco} />

                    <Text style={styles.botaoPrincipalText}>Enviar instruções</Text>

                  </>

                )}

              </LinearGradient>

            </TouchableOpacity>

            {/* Voltar ao login */}

            <View style={styles.voltarContainer}>

              <Text style={styles.voltarTexto}>Lembraste da password? </Text>

              <TouchableOpacity

                onPress={() => router.replace('/auth/login')}

                activeOpacity={0.7}

              >

                <Text style={styles.voltarLink}>Entrar</Text>

              </TouchableOpacity>

            </View>

            {/* Ajuda extra */}

            <TouchableOpacity style={styles.ajudaBotao} activeOpacity={0.7}>

              <Ionicons name="help-circle-outline" size={16} color={Colors.textoSecundario} />

              <Text style={styles.ajudaTexto}>Preciso de mais ajuda</Text>

            </TouchableOpacity>

          </Animated.View>

        </ScrollView>

      </SafeAreaView>

    </KeyboardAvoidingView>

  );

}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: Colors.branco },

  safeArea: { flex: 1 },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: Spacing.base,

    paddingVertical: Spacing.sm,

    borderBottomWidth: 1,

    borderBottomColor: Colors.bordaSubtil,

  },

  botaoVoltar: {

    width: 40,

    height: 40,

    borderRadius: 20,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: Colors.fundoSuave,

  },

  scrollContent: {

    flexGrow: 1,

    paddingBottom: Spacing.xl,

  },

  content: {

    padding: Spacing.lg,

    alignItems: 'center',

  },

  // Hero

  heroContainer: {

    marginTop: Spacing.lg,

    marginBottom: Spacing.xl,

  },

  heroCirculoExterno: {

    width: 140,

    height: 140,

    borderRadius: 70,

    backgroundColor: 'rgba(33, 150, 243, 0.05)',

    justifyContent: 'center',

    alignItems: 'center',

  },

  heroCirculoMedio: {

    width: 110,

    height: 110,

    borderRadius: 55,

    backgroundColor: 'rgba(33, 150, 243, 0.1)',

    justifyContent: 'center',

    alignItems: 'center',

  },

  heroIcone: {

    width: 80,

    height: 80,

    borderRadius: 40,

    backgroundColor: 'rgba(33, 150, 243, 0.2)',

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.sm,

  },

  // Título

  titulo: {

    ...Typography.displayMD,

    color: Colors.textoPrincipal,

    textAlign: 'center',

    marginBottom: Spacing.sm,

  },

  subtitulo: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textAlign: 'center',

    lineHeight: 22,

    marginBottom: Spacing.xl,

  },

  // Info card

  infoCard: {

    flexDirection: 'row',

    backgroundColor: 'rgba(33, 150, 243, 0.08)',

    padding: Spacing.md,

    borderRadius: Radius.lg,

    gap: Spacing.sm,

    borderLeftWidth: 4,

    borderLeftColor: Colors.azul,

    marginBottom: Spacing.lg,

    width: '100%',

  },

  infoIconeContainer: {

    marginTop: 1,

  },

  infoTexto: {

    flex: 1,

    ...Typography.bodySmall,

    color: Colors.textoPrincipal,

    lineHeight: 20,

  },

  // Campo

  campoContainer: {

    width: '100%',

    gap: Spacing.xs,

    marginBottom: Spacing.lg,

  },

  campoLabel: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

    fontSize: 13,

    marginLeft: 4,

  },

  inputWrapper: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: Colors.fundoInput,

    borderRadius: Radius.md,

    paddingHorizontal: Spacing.md,

    paddingVertical: Platform.OS === 'ios' ? Spacing.md : 2,

    gap: Spacing.sm,

    borderWidth: 1,

    borderColor: 'transparent',

    minHeight: 52,

  },

  input: {

    flex: 1,

    ...Typography.body,

    color: Colors.textoPrincipal,

    padding: 0,

    paddingVertical: Platform.OS === 'android' ? Spacing.md : 0,

  },

  // Botão

  botaoPrincipal: {

    width: '100%',

    borderRadius: Radius.full,

    overflow: 'hidden',

    marginBottom: Spacing.lg,

    ...Sombras.md,

  },

  botaoPrincipalGradient: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: Spacing.base,

    gap: Spacing.sm,

    minHeight: 56,

  },

  botaoPrincipalText: {

    ...Typography.buttonLarge,

    color: Colors.branco,

  },

  // Voltar

  voltarContainer: {

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: Spacing.md,

  },

  voltarTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

  },

  voltarLink: {

    ...Typography.bodyBold,

    color: Colors.azul,

  },

  // Ajuda

  ajudaBotao: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    paddingVertical: Spacing.sm,

    marginTop: Spacing.sm,

  },

  ajudaTexto: {

    ...Typography.bodySmall,

    color: Colors.textoSecundario,

    textDecorationLine: 'underline',

  },

  // ============ ESTADO SUCESSO ============

  sucessoContainer: {

    padding: Spacing.lg,

    alignItems: 'center',

    paddingTop: Spacing.md,

  },

  sucessoIconContainer: {

    width: 180,

    height: 180,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: Spacing.lg,

    position: 'relative',

  },

  sucessoCirculoExterno: {

    position: 'absolute',

    width: 180,

    height: 180,

    borderRadius: 90,

    backgroundColor: 'rgba(76, 175, 80, 0.08)',

  },

  sucessoCirculoMedio: {

    position: 'absolute',

    width: 140,

    height: 140,

    borderRadius: 70,

    backgroundColor: 'rgba(76, 175, 80, 0.15)',

  },

  sucessoIcone: {

    width: 100,

    height: 100,

    borderRadius: 50,

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.colorida('#2F7A4F'),

  },

  sucessoTitulo: {

    ...Typography.displayLG,

    color: Colors.textoPrincipal,

    textAlign: 'center',

    marginBottom: Spacing.sm,

  },

  sucessoSubtitulo: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textAlign: 'center',

    lineHeight: 22,

    marginBottom: Spacing.md,

  },

  emailBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(33, 150, 243, 0.1)',

    paddingHorizontal: Spacing.md,

    paddingVertical: 8,

    borderRadius: Radius.full,

    gap: 6,

    marginBottom: Spacing.xl,

    borderWidth: 1,

    borderColor: 'rgba(33, 150, 243, 0.2)',

  },

  emailBadgeTexto: {

    ...Typography.bodyBold,

    color: Colors.azul,

  },

  // Passos

  passosContainer: {

    width: '100%',

    backgroundColor: Colors.fundoSuave,

    borderRadius: Radius.xl,

    padding: Spacing.lg,

    marginBottom: Spacing.lg,

  },

  passosTitulo: {

    ...Typography.h4,

    color: Colors.textoPrincipal,

    marginBottom: Spacing.md,

  },

  passoItem: {

    flexDirection: 'row',

    gap: Spacing.md,

    alignItems: 'flex-start',

  },

  passoNumero: {

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: Colors.azul,

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.colorida('#0A6BC0'),

  },

  passoNumeroTexto: {

    ...Typography.bodyBold,

    color: Colors.branco,

    fontFamily: Fonte.corpoSemi,

  },

  passoConteudo: {

    flex: 1,

    paddingTop: 4,

  },

  passoTitulo: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

    marginBottom: 2,

  },

  passoDescricao: {

    ...Typography.bodySmall,

    color: Colors.textoSecundario,

    lineHeight: 18,

  },

  passoLinha: {

    width: 2,

    height: 20,

    backgroundColor: Colors.bordaMedia,

    marginLeft: 15,

    marginVertical: 4,

  },

  // Simulador

  simuladorBotao: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: 'rgba(33, 150, 243, 0.1)',

    paddingHorizontal: Spacing.lg,

    paddingVertical: Spacing.md,

    borderRadius: Radius.full,

    gap: 8,

    borderWidth: 1,

    borderColor: 'rgba(33, 150, 243, 0.3)',

    borderStyle: 'dashed',

  },

  simuladorTexto: {

    ...Typography.bodyBold,

    color: Colors.azul,

  },

  simuladorDica: {

    ...Typography.caption,

    color: Colors.textoTerciario,

    marginTop: 6,

    fontStyle: 'italic',

  },

  // Footer

  footer: {

    padding: Spacing.lg,

    borderTopWidth: 1,

    borderTopColor: Colors.bordaSubtil,

    gap: Spacing.sm,

  },

  reenviarBotao: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: Spacing.md,

    gap: 6,

  },

  reenviarBotaoTexto: {

    ...Typography.button,

    color: Colors.azul,

  },

  voltarLogin: {

    padding: Spacing.sm,

    alignItems: 'center',

  },

  voltarLoginTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textDecorationLine: 'underline',

  },

  headerLogo: {
    width: 92,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoImage: {
    width: 88,
    height: 34,
  },
});