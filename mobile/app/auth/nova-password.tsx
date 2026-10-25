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

import { useLocalSearchParams, useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { Colors, Sombras } from '../../src/theme/colors';

import { Spacing, Typography, Radius } from '../../src/theme/typography';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
export default function NovaPasswordScreen() {

  const router = useRouter();

  const { email } = useLocalSearchParams<{ email: string }>();

  const [password, setPassword] = useState('');

  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [loading, setLoading] = useState(false);

  const [sucesso, setSucesso] = useState(false);

  const [campoFocado, setCampoFocado] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;

  const sucessoScale = useRef(new Animated.Value(0)).current;

  const sucessoRotate = useRef(new Animated.Value(0)).current;

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

    if (sucesso) {

      Animated.parallel([

        Animated.spring(sucessoScale, {

          toValue: 1,

          tension: 15,

          friction: 5,

          useNativeDriver: true,

        }),

        Animated.timing(sucessoRotate, {

          toValue: 1,

          duration: 800,

          useNativeDriver: true,

        }),

      ]).start();

      // Redirect automático depois de 2.5s

      const timer = setTimeout(() => {

        router.replace('/auth/login');

      }, 2500);

      return () => clearTimeout(timer);

    }

  }, [sucesso]);

  // Validações de segurança da password

  const validacoes = {

    tamanho: password.length >= 8,

    maiuscula: /[A-Z]/.test(password),

    numero: /\d/.test(password),

    especial: /[!@#$%^&*(),.?":{}|<>_-]/.test(password),

  };

  const forcaPassword = () => {

    const pontos = Object.values(validacoes).filter(v => v).length;

    if (password.length === 0) return { forca: 0, cor: Colors.bordaMedia, texto: '', label: '' };

    if (pontos <= 1) return { forca: 1, cor: Colors.erro, texto: 'Fraca', label: 'Pouco segura' };

    if (pontos === 2) return { forca: 2, cor: Colors.aviso, texto: 'Média', label: 'Aceitável' };

    if (pontos === 3) return { forca: 3, cor: '#F5B800', texto: 'Boa', label: 'Boa segurança' };

    return { forca: 4, cor: Colors.verde, texto: 'Excelente', label: 'Muito segura' };

  };

  const handleGuardar = () => {

    if (!password || !confirmarPassword) {

      Alert.alert('Atenção', 'Preenche ambos os campos');

      return;

    }

    if (password.length < 8) {

      Alert.alert('Password fraca', 'A password deve ter pelo menos 8 caracteres');

      return;

    }

    if (password !== confirmarPassword) {

      Alert.alert('Passwords diferentes', 'As passwords não coincidem');

      return;

    }

    setLoading(true);

    setTimeout(() => {

      setLoading(false);

      setSucesso(true);

    }, 1500);

  };

  const forca = forcaPassword();

  const passwordsIguais = confirmarPassword.length > 0 && password === confirmarPassword;

  const passwordsDiferentes = confirmarPassword.length > 0 && password !== confirmarPassword;

  const rotate = sucessoRotate.interpolate({

    inputRange: [0, 1],

    outputRange: ['0deg', '360deg'],

  });

  // ============ ESTADO: SUCESSO ============

  if (sucesso) {

    return (

      <View style={styles.container}>

        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <LinearGradient

          colors={Colors.gradienteSucesso}

          style={StyleSheet.absoluteFill}

          start={{ x: 0, y: 0 }}

          end={{ x: 1, y: 1 }}

        />

        <SafeAreaView style={styles.sucessoContainer}>

          <Animated.View

            style={[

              styles.sucessoContent,

              { transform: [{ scale: sucessoScale }] },

            ]}

          >

            {/* Ícone gigante */}

            <View style={styles.sucessoIconContainer}>

              <View style={styles.sucessoCirculoExterno} />

              <View style={styles.sucessoCirculoMedio} />

              <Animated.View

                style={[

                  styles.sucessoCirculoRotacao,

                  { transform: [{ rotate }] },

                ]}

              />

              <View style={styles.sucessoIcone}>

                <Ionicons name="shield-checkmark" size={70} color={Colors.verde} />

              </View>

            </View>

            <Text style={styles.sucessoTitulo}>Password alterada!</Text>

            <Text style={styles.sucessoSubtitulo}>

              A tua password foi actualizada com sucesso.{'\n'}

              Podes agora entrar com a nova password.

            </Text>

            {/* Info security */}

            <View style={styles.sucessoInfoCard}>

              <View style={styles.sucessoInfoItem}>

                <Ionicons name="checkmark-circle" size={20} color={Colors.branco} />

                <Text style={styles.sucessoInfoTexto}>Password segura activada</Text>

              </View>

              <View style={styles.sucessoInfoDivider} />

              <View style={styles.sucessoInfoItem}>

                <Ionicons name="lock-closed" size={20} color={Colors.branco} />

                <Text style={styles.sucessoInfoTexto}>Dados encriptados</Text>

              </View>

              <View style={styles.sucessoInfoDivider} />

              <View style={styles.sucessoInfoItem}>

                <Ionicons name="notifications" size={20} color={Colors.branco} />

                <Text style={styles.sucessoInfoTexto}>Notificação enviada por email</Text>

              </View>

            </View>

            <View style={styles.sucessoLoading}>

              <ActivityIndicator color={Colors.branco} size="small" />

              <Text style={styles.sucessoLoadingTexto}>

                A redireccionar para login...

              </Text>

            </View>

          </Animated.View>

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

          <View style={styles.headerBadge}>

            <Ionicons name="shield-checkmark" size={12} color={Colors.verde} />

            <Text style={styles.headerBadgeText}>LINK VÁLIDO</Text>

          </View>

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

                  <LinearGradient

                    colors={Colors.gradientePrimario}

                    style={styles.heroIcone}

                    start={{ x: 0, y: 0 }}

                    end={{ x: 1, y: 1 }}

                  >

                    <Icone name="lock-plus" size={50} color={Colors.branco} />

                  </LinearGradient>

                </View>

              </View>

            </View>

            {/* Título */}

            <Text style={styles.titulo}>Nova password</Text>

            <Text style={styles.subtitulo}>

              Cria uma password segura para{'\n'}proteger a tua conta

            </Text>

            {/* Password */}

            <View style={styles.campoContainer}>

              <Text style={styles.campoLabel}>Nova password</Text>

              <View style={[

                styles.inputWrapper,

                campoFocado === 'password' && { borderColor: Colors.azul, borderWidth: 2 },

              ]}>

                <Ionicons name="lock-closed-outline" size={20} color={Colors.textoSecundario} />

                <TextInput

                  style={styles.input}

                  placeholder="Introduz nova password"

                  placeholderTextColor={Colors.textoTerciario}

                  value={password}

                  onChangeText={setPassword}

                  secureTextEntry={!mostrarPassword}

                  autoFocus

                  onFocus={() => setCampoFocado('password')}

                  onBlur={() => setCampoFocado(null)}

                />

                <TouchableOpacity onPress={() => setMostrarPassword(!mostrarPassword)}>

                  <Ionicons

                    name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}

                    size={20}

                    color={Colors.textoSecundario}

                  />

                </TouchableOpacity>

              </View>

              {/* Barra de força */}

              {password.length > 0 && (

                <View style={styles.forcaContainer}>

                  <View style={styles.forcaBars}>

                    {[1, 2, 3, 4].map((n) => (

                      <View

                        key={n}

                        style={[

                          styles.forcaBar,

                          {

                            backgroundColor: forca.forca >= n ? forca.cor : Colors.bordaSubtil,

                          },

                        ]}

                      />

                    ))}

                  </View>

                  <View style={styles.forcaTextos}>

                    <Text style={[styles.forcaLabel, { color: forca.cor }]}>{forca.texto}</Text>

                    <Text style={styles.forcaDescricao}>{forca.label}</Text>

                  </View>

                </View>

              )}

            </View>

            {/* Requisitos */}

            <View style={styles.requisitosContainer}>

              <Text style={styles.requisitosTitulo}>Requisitos de segurança</Text>

              <RequisitoItem valido={validacoes.tamanho} texto="Pelo menos 8 caracteres" />

              <RequisitoItem valido={validacoes.maiuscula} texto="Uma letra maiúscula (A-Z)" />

              <RequisitoItem valido={validacoes.numero} texto="Um número (0-9)" />

              <RequisitoItem valido={validacoes.especial} texto="Um carácter especial (!@#$...)" />

            </View>

            {/* Confirmar password */}

            <View style={styles.campoContainer}>

              <Text style={styles.campoLabel}>Confirmar password</Text>

              <View style={[

                styles.inputWrapper,

                campoFocado === 'confirmar' && { borderColor: Colors.azul, borderWidth: 2 },

                passwordsDiferentes && { borderColor: Colors.erro, borderWidth: 2 },

                passwordsIguais && { borderColor: Colors.verde, borderWidth: 2 },

              ]}>

                <Ionicons name="lock-closed-outline" size={20} color={Colors.textoSecundario} />

                <TextInput

                  style={styles.input}

                  placeholder="Repete a nova password"

                  placeholderTextColor={Colors.textoTerciario}

                  value={confirmarPassword}

                  onChangeText={setConfirmarPassword}

                  secureTextEntry={!mostrarConfirmar}

                  onFocus={() => setCampoFocado('confirmar')}

                  onBlur={() => setCampoFocado(null)}

                />

                {passwordsIguais ? (

                  <Ionicons name="checkmark-circle" size={20} color={Colors.verde} />

                ) : passwordsDiferentes ? (

                  <Ionicons name="close-circle" size={20} color={Colors.erro} />

                ) : (

                  <TouchableOpacity onPress={() => setMostrarConfirmar(!mostrarConfirmar)}>

                    <Ionicons

                      name={mostrarConfirmar ? 'eye-off-outline' : 'eye-outline'}

                      size={20}

                      color={Colors.textoSecundario}

                    />

                  </TouchableOpacity>

                )}

              </View>

              {passwordsDiferentes && (

                <View style={styles.erroMensagem}>

                  <Ionicons name="alert-circle" size={14} color={Colors.erro} />

                  <Text style={styles.erroMensagemText}>As passwords não coincidem</Text>

                </View>

              )}

              {passwordsIguais && (

                <View style={styles.sucessoMensagem}>

                  <Ionicons name="checkmark-circle" size={14} color={Colors.verde} />

                  <Text style={styles.sucessoMensagemText}>As passwords coincidem</Text>

                </View>

              )}

            </View>

            {/* Dica de segurança */}

            <View style={styles.dicaCard}>

              <View style={styles.dicaIcone}>

                <Icone name="shield-lock" size={20} color={Colors.aviso} />

              </View>

              <View style={styles.dicaConteudo}>

                <Text style={styles.dicaTitulo}>Dica de segurança</Text>

                <Text style={styles.dicaTexto}>

                  Usa uma password única. Não uses a mesma password que usas noutros sites.

                </Text>

              </View>

            </View>

          </Animated.View>

        </ScrollView>

        {/* Footer */}

        <View style={styles.footer}>

          <TouchableOpacity

            style={[

              styles.botaoPrincipal,

              (!passwordsIguais || forca.forca < 2 || loading) && { opacity: 0.5 },

            ]}

            onPress={handleGuardar}

            disabled={!passwordsIguais || forca.forca < 2 || loading}

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

                  <Ionicons name="shield-checkmark" size={20} color={Colors.branco} />

                  <Text style={styles.botaoPrincipalText}>Guardar nova password</Text>

                </>

              )}

            </LinearGradient>

          </TouchableOpacity>

        </View>

      </SafeAreaView>

    </KeyboardAvoidingView>

  );

}

function RequisitoItem({ valido, texto }: any) {

  return (

    <View style={styles.requisito}>

      <View style={[

        styles.requisitoCheck,

        valido && { backgroundColor: Colors.verde },

      ]}>

        {valido ? (

          <Ionicons name="checkmark" size={12} color={Colors.branco} />

        ) : (

          <View style={styles.requisitoDot} />

        )}

      </View>

      <Text style={[

        styles.requisitoTexto,

        valido && { color: Colors.textoPrincipal, fontFamily: Fonte.corpoSemi },

      ]}>

        {texto}

      </Text>

    </View>

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

  headerBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(76, 175, 80, 0.1)',

    paddingHorizontal: Spacing.md,

    paddingVertical: 6,

    borderRadius: Radius.full,

    gap: 4,

    borderWidth: 1,

    borderColor: 'rgba(76, 175, 80, 0.25)',

  },

  headerBadgeText: {

    ...Typography.captionBold,

    color: Colors.verde,

    letterSpacing: 0.5,

    fontSize: 10,

  },

  scrollContent: {

    paddingBottom: Spacing.md,

  },

  content: {

    padding: Spacing.lg,

    alignItems: 'center',

  },

  // Hero

  heroContainer: {

    marginTop: Spacing.md,

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

    borderRadius: 24,

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.colorida('#0A6BC0'),

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

  // Campos

  campoContainer: {

    width: '100%',

    gap: Spacing.xs,

    marginBottom: Spacing.md,

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

  // Força

  forcaContainer: {

    marginTop: Spacing.sm,

    paddingHorizontal: 4,

  },

  forcaBars: {

    flexDirection: 'row',

    gap: 4,

    marginBottom: 4,

  },

  forcaBar: {

    flex: 1,

    height: 4,

    borderRadius: 2,

  },

  forcaTextos: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  forcaLabel: {

    ...Typography.captionBold,

    fontSize: 11,

  },

  forcaDescricao: {

    ...Typography.caption,

    color: Colors.textoTerciario,

    fontSize: 11,

  },

  // Requisitos

  requisitosContainer: {

    width: '100%',

    backgroundColor: Colors.fundoSuave,

    padding: Spacing.md,

    borderRadius: Radius.lg,

    marginBottom: Spacing.md,

    gap: Spacing.sm,

  },

  requisitosTitulo: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

    fontSize: 13,

    marginBottom: Spacing.xs,

  },

  requisito: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: Spacing.sm,

  },

  requisitoCheck: {

    width: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor: Colors.bordaMedia,

    justifyContent: 'center',

    alignItems: 'center',

  },

  requisitoDot: {

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: Colors.branco,

  },

  requisitoTexto: {

    ...Typography.bodySmall,

    color: Colors.textoSecundario,

  },

  // Mensagens

  erroMensagem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    marginTop: Spacing.xs,

    marginLeft: 4,

  },

  erroMensagemText: {

    ...Typography.caption,

    color: Colors.erro,

    fontFamily: Fonte.corpoSemi,

  },

  sucessoMensagem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    marginTop: Spacing.xs,

    marginLeft: 4,

  },

  sucessoMensagemText: {

    ...Typography.caption,

    color: Colors.verde,

    fontFamily: Fonte.corpoSemi,

  },

  // Dica

  dicaCard: {

    flexDirection: 'row',

    backgroundColor: 'rgba(255, 152, 0, 0.08)',

    padding: Spacing.md,

    borderRadius: Radius.lg,

    gap: Spacing.md,

    borderLeftWidth: 4,

    borderLeftColor: Colors.aviso,

    width: '100%',

    marginTop: Spacing.md,

  },

  dicaIcone: {

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: 'rgba(255, 152, 0, 0.15)',

    justifyContent: 'center',

    alignItems: 'center',

  },

  dicaConteudo: {

    flex: 1,

  },

  dicaTitulo: {

    ...Typography.bodyBold,

    color: Colors.aviso,

    marginBottom: 2,

  },

  dicaTexto: {

    ...Typography.bodySmall,

    color: Colors.textoPrincipal,

    lineHeight: 18,

  },

  // Footer

  footer: {

    padding: Spacing.lg,

    borderTopWidth: 1,

    borderTopColor: Colors.bordaSubtil,

    backgroundColor: Colors.branco,

  },

  botaoPrincipal: {

    borderRadius: Radius.full,

    overflow: 'hidden',

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

  // ============ ESTADO SUCESSO ============

  sucessoContainer: {

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    padding: Spacing.lg,

  },

  sucessoContent: {

    alignItems: 'center',

    width: '100%',

  },

  sucessoIconContainer: {

    width: 220,

    height: 220,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: Spacing.xl,

    position: 'relative',

  },

  sucessoCirculoExterno: {

    position: 'absolute',

    width: 220,

    height: 220,

    borderRadius: 110,

    backgroundColor: 'rgba(255, 255, 255, 0.15)',

  },

  sucessoCirculoMedio: {

    position: 'absolute',

    width: 180,

    height: 180,

    borderRadius: 90,

    backgroundColor: 'rgba(255, 255, 255, 0.2)',

  },

  sucessoCirculoRotacao: {

    position: 'absolute',

    width: 200,

    height: 200,

    borderRadius: 100,

    borderWidth: 3,

    borderColor: 'transparent',

    borderTopColor: Colors.branco,

    borderRightColor: Colors.branco,

  },

  sucessoIcone: {

    width: 130,

    height: 130,

    borderRadius: 65,

    backgroundColor: Colors.branco,

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.lg,

  },

  sucessoTitulo: {

    ...Typography.displayLG,

    color: Colors.branco,

    marginBottom: Spacing.sm,

    fontFamily: Fonte.tituloSemi,

    textAlign: 'center',

  },

  sucessoSubtitulo: {

    ...Typography.bodyLarge,

    color: Colors.branco,

    opacity: 0.95,

    textAlign: 'center',

    marginBottom: Spacing.xl,

    lineHeight: 24,

  },

  sucessoInfoCard: {

    width: '100%',

    backgroundColor: 'rgba(255, 255, 255, 0.15)',

    borderRadius: Radius.lg,

    padding: Spacing.base,

    marginBottom: Spacing.xl,

    borderWidth: 1,

    borderColor: 'rgba(255, 255, 255, 0.2)',

  },

  sucessoInfoItem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: Spacing.md,

    paddingVertical: Spacing.sm,

  },

  sucessoInfoTexto: {

    ...Typography.body,

    color: Colors.branco,

    fontFamily: Fonte.corpoMedio,

    flex: 1,

  },

  sucessoInfoDivider: {

    height: 1,

    backgroundColor: 'rgba(255, 255, 255, 0.15)',

  },

  sucessoLoading: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: Spacing.sm,

  },

  sucessoLoadingTexto: {

    ...Typography.body,

    color: Colors.branco,

    opacity: 0.9,

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