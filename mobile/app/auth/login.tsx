import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../src/store/userStore';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import { Colors } from '../../src/theme/colors';
const BRAND = {
  orange: Colors.azul,
  orangeDark: Colors.azul,
  orangeSoft: Colors.azulSuave,
  navy: Colors.carvao,
  navyDeep: Colors.carvao,
  blueSoft: Colors.azulSuave,
  white: Colors.branco,
  ink: Colors.carvao,
  muted: Colors.textoSecundario,
  border: Colors.borda,
  background: Colors.gelo,
  danger: Colors.erro,
};

type Papel = 'procurador' | 'anunciante';

export default function LoginScreen() {
  const router = useRouter();
  const { papel, returnTo } = useLocalSearchParams<{
    papel?: Papel;
    returnTo?: string;
  }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [loading, setLoading] = useState(false);
  const [campoFocado, setCampoFocado] = useState<'email' | 'password' | null>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const loginStore = useUserStore((state) => state.login);
  const escolherPapel = useUserStore((state) => state.escolherPapel);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  const isAnunciante = papel === 'anunciante';
  const corPrincipal = isAnunciante ? BRAND.orange : BRAND.navy;
  const roleLabel = isAnunciante ? 'ANUNCIANTE' : 'PROCURADOR';

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, speed: 16, bounciness: 3, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [fade, rise]);

  const concluirEntrada = async () => {
    const emailLimpo = email.trim().toLowerCase();

    try {
      // Guarda primeiro o papel escolhido; o login activa depois a sessão.
      await escolherPapel(isAnunciante ? 'anunciante' : 'procurador');

      const resultado = await loginStore(emailLimpo, password);
      if (!resultado.sucesso) {
        Alert.alert('Não foi possível entrar', resultado.erro || 'Verifica os teus dados e tenta novamente.');
        return;
      }

      if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
        router.replace(returnTo as never);
        return;
      }

      router.replace((isAnunciante ? '/(anunciante)' : '/(procurador)') as never);
    } catch (error) {
      console.error('[LoginScreen] erro ao iniciar sessão:', error);
      Alert.alert('Erro ao entrar', 'Ocorreu um problema ao iniciar sessão. Tenta novamente.');
    }
  };

  const handleLogin = async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !password.trim()) {
      Alert.alert('Campos por preencher', 'Introduz o teu email e a tua palavra-passe para continuar.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      Alert.alert('Email inválido', 'Verifica o endereço de email e tenta novamente.');
      return;
    }
    if (password.trim().length < 6) {
      Alert.alert('Palavra-passe inválida', 'A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await concluirEntrada();
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = () => {
    Alert.alert(
      'Google ainda não ligado',
      'A autenticação Google será activada quando a integração OAuth estiver configurada.',
    );
  };

  const params = {
    papel: papel || 'procurador',
    ...(returnTo ? { returnTo } : {}),
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Cabeçalho fixo: permanece visível enquanto o formulário faz scroll. */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={21} color={BRAND.navy} />
        </TouchableOpacity>

        <View style={styles.brandLockup}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.brandName}>GoHome</Text>
            <Text style={styles.brandTagline}>O teu próximo espaço</Text>
          </View>
        </View>

        <View style={styles.headerBadge}>
          <View style={styles.headerBadgeDot} />
          <Text style={styles.headerBadgeText}>GOHOME</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          nestedScrollEnabled
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            <View style={styles.welcomeRow}>
              <View style={[styles.roleIcon, { backgroundColor: isAnunciante ? BRAND.orangeSoft : BRAND.blueSoft }]}>
                <Icone
                  name={isAnunciante ? 'home-city-outline' : 'account-search-outline'}
                  size={25}
                  color={corPrincipal}
                />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={styles.eyebrow}>ÁREA DE ACESSO</Text>
                <View style={styles.rolePill}>
                  <View style={[styles.roleDot, { backgroundColor: isAnunciante ? BRAND.orange : BRAND.navy }]} />
                  <Text style={[styles.rolePillText, { color: corPrincipal }]}>{roleLabel}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.title}>Bem-vindo{''}{' '}<Text style={styles.titleAccent}>de volta.</Text></Text>
            <Text style={styles.subtitle}>
              Entra na tua conta para continuares a tua experiência no GoHome.
            </Text>

            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={styles.formTitle}>Iniciar sessão</Text>
                  <Text style={styles.formCaption}>Preenche os teus dados de acesso</Text>
                </View>
                <View style={styles.lockIcon}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={BRAND.navy} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Endereço de email</Text>
                <View style={[styles.inputShell, campoFocado === 'email' && styles.inputShellFocused]}>
                  <Ionicons name="mail-outline" size={20} color={campoFocado === 'email' ? BRAND.orange : BRAND.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="nome@exemplo.com"
                    placeholderTextColor={Colors.textoTerciario}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    onFocus={() => setCampoFocado('email')}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    accessibilityLabel="Endereço de email"
                  />
                  {email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.verdeTexto} />
                  ) : null}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Palavra-passe</Text>
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/auth/esqueci-password', params: { papel: papel || 'procurador' } })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.forgotText, { color: corPrincipal }]}>Esqueceste-te?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.inputShell, campoFocado === 'password' && styles.inputShellFocused]}>
                  <Ionicons name="lock-closed-outline" size={20} color={campoFocado === 'password' ? BRAND.orange : BRAND.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Introduz a tua palavra-passe"
                    placeholderTextColor={Colors.textoTerciario}
                    ref={passwordInputRef}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!mostrarPassword}
                    textContentType="password"
                    onFocus={() => setCampoFocado('password')}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    onSubmitEditing={handleLogin}
                    accessibilityLabel="Palavra-passe"
                  />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={mostrarPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                    onPress={() => setMostrarPassword((value) => !value)}
                    style={styles.visibilityButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={BRAND.muted} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setManterConectado((value) => !value)}
                activeOpacity={0.75}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: manterConectado }}
              >
                <View style={[styles.checkbox, manterConectado && styles.checkboxChecked]}>
                  {manterConectado ? <Ionicons name="checkmark" size={14} color={BRAND.white} /> : null}
                </View>
                <Text style={styles.rememberText}>Manter sessão iniciada</Text>
                <View style={styles.rememberHint}>
                  <Ionicons name="information-circle-outline" size={15} color={BRAND.muted} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={isAnunciante ? [BRAND.orange, BRAND.orangeDark] : [BRAND.navy, BRAND.navyDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={BRAND.white} />
                  ) : (
                    <>
                      <Text style={styles.submitText}>Entrar na minha conta</Text>
                      <Ionicons name="arrow-forward" size={20} color={BRAND.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={loginGoogle} activeOpacity={0.82}>
              <View style={styles.googleMark}><Text style={styles.googleMarkText}>G</Text></View>
              <Text style={styles.googleButtonText}>Continuar com Google</Text>
              <Ionicons name="arrow-forward" size={17} color={BRAND.muted} />
            </TouchableOpacity>

            <View style={styles.signupRow}>
              <Text style={styles.signupPrompt}>Ainda não tens conta?</Text>
              <TouchableOpacity
                onPress={() => router.replace({ pathname: '/auth/registo', params } as never)}
                activeOpacity={0.7}
              >
                <Text style={styles.signupLink}>Criar conta grátis</Text>
              </TouchableOpacity>
            </View>

            {!isAnunciante ? (
              <TouchableOpacity style={styles.guestButton} onPress={() => router.replace('/(procurador)' as never)} activeOpacity={0.7}>
                <Ionicons name="compass-outline" size={17} color={BRAND.muted} />
                <Text style={styles.guestButtonText}>Continuar a explorar como convidado</Text>
              </TouchableOpacity>
            ) : null}

            <Text style={styles.legalText}>
              Ao continuar, reconheces que leste os termos de utilização e a política de privacidade do GoHome.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND.white },
  keyboardArea: { flex: 1 },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fundoSuave,
    zIndex: 5,
  },
  backButton: {
    width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: BRAND.background, borderWidth: 1, borderColor: BRAND.border,
  },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 43, height: 43 },
  brandName: { fontSize: 20, fontFamily: Fonte.corpoBold, letterSpacing: -0.6, color: BRAND.navy },
  brandTagline: { marginTop: 1, fontSize: 12, fontFamily: Fonte.corpoSemi, color: BRAND.muted, letterSpacing: 0.1 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 99, backgroundColor: BRAND.orangeSoft },
  headerBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND.orange },
  headerBadgeText: { fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 0.6, color: BRAND.orangeDark },
  scroll: { flex: 1, backgroundColor: BRAND.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 34 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  roleIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  roleTextWrap: { gap: 6 },
  eyebrow: { color: BRAND.muted, fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 1.5 },
  rolePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6 },
  roleDot: { width: 7, height: 7, borderRadius: 4 },
  rolePillText: { fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 0.8 },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -0.4, fontFamily: Fonte.tituloBold, color: BRAND.navy },
  titleAccent: { color: BRAND.orange },
  subtitle: { marginTop: 8, marginBottom: 23, fontFamily: Fonte.corpo, fontSize: 14, lineHeight: 22, color: BRAND.muted, maxWidth: 330 },
  formCard: { padding: 20, borderRadius: 24, backgroundColor: BRAND.white, borderWidth: 1, borderColor: Colors.fundoSuave, shadowColor: Colors.carvao, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.055, shadowRadius: 18, elevation: 3 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 },
  formTitle: { fontSize: 20, fontFamily: Fonte.corpoBold, letterSpacing: -0.4, color: BRAND.ink },
  formCaption: { marginTop: 4, fontFamily: Fonte.corpo, fontSize: 12, color: BRAND.muted },
  lockIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: BRAND.blueSoft, alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { marginBottom: 17 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, fontFamily: Fonte.corpoSemi, color: BRAND.ink, marginBottom: 8 },
  inputShell: { minHeight: 56, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.3, borderColor: BRAND.border, backgroundColor: Colors.gelo },
  inputShellFocused: { borderColor: BRAND.orange, backgroundColor: BRAND.white, shadowColor: BRAND.orange, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.09, shadowRadius: 5, elevation: 1 },
  input: { flex: 1, minHeight: 52, paddingVertical: 0, fontFamily: Fonte.corpo, fontSize: 14, color: BRAND.ink },
  visibilityButton: { padding: 5 },
  forgotText: { fontSize: 12, fontFamily: Fonte.corpoSemi },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 1, marginBottom: 21 },
  checkbox: { width: 19, height: 19, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.borda, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.white },
  checkboxChecked: { backgroundColor: BRAND.navy, borderColor: BRAND.navy },
  rememberText: { fontSize: 12, color: BRAND.muted, fontFamily: Fonte.corpoSemi, flex: 1 },
  rememberHint: { padding: 2 },
  submitButton: { borderRadius: 15, overflow: 'hidden', shadowColor: BRAND.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 4 },
  submitButtonDisabled: { opacity: 0.72 },
  submitGradient: { minHeight: 56, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  submitText: { flex: 1, textAlign: 'center', color: BRAND.white, fontSize: 14, fontFamily: Fonte.corpoBold, letterSpacing: 0.1 },
  secureNote: { marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  secureNoteText: { fontFamily: Fonte.corpo, fontSize: 12, color: BRAND.muted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 21 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borda },
  dividerText: { fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 1.5, color: Colors.textoTerciario },
  googleButton: { minHeight: 54, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.2, borderColor: BRAND.border, borderRadius: 15, backgroundColor: BRAND.white },
  googleMark: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.white, borderWidth: 1, borderColor: Colors.borda },
  googleMarkText: { fontSize: 18, fontFamily: Fonte.corpoBold, color: '#4285F4' },
  googleButtonText: { flex: 1, fontSize: 13, fontFamily: Fonte.corpoSemi, color: BRAND.ink },
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 23 },
  signupPrompt: { fontFamily: Fonte.corpo, fontSize: 12, color: BRAND.muted },
  signupLink: { fontSize: 12, fontFamily: Fonte.corpoSemi, color: BRAND.orangeDark },
  guestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 19, paddingVertical: 8 },
  guestButtonText: { fontSize: 12, color: BRAND.muted, fontFamily: Fonte.corpoSemi, textDecorationLine: 'underline' },
  legalText: { marginTop: 19, paddingHorizontal: 10, fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 16, textAlign: 'center', color: Colors.textoTerciario },
});
