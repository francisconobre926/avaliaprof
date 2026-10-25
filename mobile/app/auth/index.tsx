import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Sombras } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
const BRAND = {
  orange: '#E8760A',
  orangeDark: '#E86E00',
  orangeSoft: '#FFF1E5',
  navy: '#16202E',
  navyDeep: '#082342',
  blueSoft: '#EEF5FC',
  white: '#FFFFFF',
  ink: '#12263A',
  muted: '#64758B',
  border: '#E3EAF1',
  background: '#F6F8FB',
};

export default function AuthEntradaScreen() {
  const router = useRouter();
  const { papel, returnTo } = useLocalSearchParams<{
    papel?: 'procurador' | 'anunciante';
    returnTo?: string;
  }>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(18)).current;
  const isAnunciante = papel === 'anunciante';
  const role = isAnunciante ? 'Anunciante' : 'Procurador';

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(riseAnim, {
        toValue: 0,
        speed: 16,
        bounciness: 3,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [fadeAnim, riseAnim]);

  const params = {
    papel: papel || 'procurador',
    ...(returnTo ? { returnTo } : {}),
  };

  const irParaRegisto = () => {
    router.push({ pathname: '/auth/registo', params });
  };

  const irParaLogin = () => {
    router.push({ pathname: '/auth/login', params });
  };

  const entrarComoConvidado = () => {
    if (isAnunciante) {
      router.replace({ pathname: '/auth/login', params: { ...params, papel: 'anunciante' } });
      return;
    }
    router.replace('/(procurador)');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Cabeçalho fixo: fica fora do ScrollView */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={21} color={BRAND.navy} />
        </TouchableOpacity>

        <View style={styles.brandLockup}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandName}>GoHome</Text>
            <Text style={styles.brandTagline}>O teu próximo espaço</Text>
          </View>
        </View>

        <View style={styles.headerStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>SEGURO</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: riseAnim }] }}
        >
          <LinearGradient
            colors={[BRAND.navy, BRAND.navyDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroOrbOne} />
            <View style={styles.heroOrbTwo} />
            <View style={styles.heroTopRow}>
              <View style={styles.rolePill}>
                <Icone
                  name={isAnunciante ? 'home-city-outline' : 'magnify'}
                  size={15}
                  color={BRAND.white}
                />
                <Text style={styles.rolePillText}>MODO {role.toUpperCase()}</Text>
              </View>
              <View style={styles.heroSparkle}>
                <Ionicons name="sparkles" size={17} color={BRAND.orange} />
              </View>
            </View>

            <Text style={styles.heroTitle}>
              {isAnunciante ? 'O teu imóvel merece destaque.' : 'O espaço certo começa aqui.'}
            </Text>
            <Text style={styles.heroDescription}>
              {isAnunciante
                ? 'Cria a tua conta para divulgar imóveis e gerir os teus anúncios num só lugar.'
                : 'Encontra casas, quartos e espaços que combinam com a tua próxima etapa.'}
            </Text>

            <View style={styles.heroFooter}>
              <View style={styles.heroFooterIcon}>
                <Ionicons name="shield-checkmark" size={16} color={BRAND.white} />
              </View>
              <Text style={styles.heroFooterText}>Uma experiência simples, clara e segura</Text>
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.sectionHeading}>
              <Text style={styles.eyebrow}>COMEÇA EM SEGUNDOS</Text>
              <Text style={styles.sectionTitle}>Como queres continuar?</Text>
              <Text style={styles.sectionDescription}>
                Escolhe uma opção para personalizarmos a tua experiência.
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={irParaRegisto}
              activeOpacity={0.88}
              style={styles.primaryButtonOuter}
            >
              <LinearGradient
                colors={[BRAND.orange, BRAND.orangeDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <View style={styles.primaryIconBox}>
                  <Ionicons name="person-add-outline" size={21} color={BRAND.orange} />
                </View>
                <View style={styles.primaryButtonCopy}>
                  <Text style={styles.primaryButtonTitle}>Criar conta grátis</Text>
                  <Text style={styles.primaryButtonSubtitle}>Começa a usar a GoHome</Text>
                </View>
                <Ionicons name="arrow-forward" size={21} color={BRAND.white} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={irParaLogin}
              activeOpacity={0.85}
              style={styles.loginButton}
            >
              <View style={styles.loginIconBox}>
                <Ionicons name="log-in-outline" size={21} color={BRAND.navy} />
              </View>
              <View style={styles.loginButtonCopy}>
                <Text style={styles.loginButtonTitle}>Já tenho conta</Text>
                <Text style={styles.loginButtonSubtitle}>Entrar com email e password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={BRAND.muted} />
            </TouchableOpacity>

            <View style={styles.benefitsRow}>
              <View style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: BRAND.orangeSoft }]}>
                  <Ionicons name="flash-outline" size={17} color={BRAND.orange} />
                </View>
                <Text style={styles.benefitText}>Rápido</Text>
              </View>
              <View style={styles.benefitDivider} />
              <View style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: BRAND.blueSoft }]}>
                  <Ionicons name="shield-checkmark-outline" size={17} color={BRAND.navy} />
                </View>
                <Text style={styles.benefitText}>Mais seguro</Text>
              </View>
              <View style={styles.benefitDivider} />
              <View style={styles.benefit}>
                <View style={[styles.benefitIcon, { backgroundColor: '#F1F4F8' }]}>
                  <Ionicons name="heart-outline" size={17} color={BRAND.navy} />
                </View>
                <Text style={styles.benefitText}>À tua medida</Text>
              </View>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={entrarComoConvidado}
              activeOpacity={0.75}
              style={styles.guestButton}
            >
              <Ionicons name="eye-outline" size={17} color={BRAND.muted} />
              <Text style={styles.guestButtonText}>
                {isAnunciante ? 'Entrar como anunciante' : 'Explorar primeiro como convidado'}
              </Text>
              <Ionicons name="arrow-forward" size={15} color={BRAND.muted} />
            </TouchableOpacity>

            <View style={styles.termsWrap}>
              <Ionicons name="lock-closed-outline" size={13} color={BRAND.muted} />
              <Text style={styles.termsText}>
                Ao continuar, concordas com os nossos <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
                <Text style={styles.termsLink}>Política de Privacidade</Text>.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BRAND.white },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F5',
    zIndex: 10,
    ...Sombras.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.background,
    borderWidth: 1,
    borderColor: BRAND.border,
  },
  brandLockup: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 12 },
  logo: { width: 42, height: 42 },
  brandTextWrap: { marginLeft: 8 },
  brandName: { color: BRAND.navy, fontSize: 19, fontFamily: Fonte.corpoBold, letterSpacing: -0.6 },
  brandTagline: { color: BRAND.muted, fontSize: 10, fontFamily: Fonte.corpoSemi, marginTop: 1 },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: '#F0F8F3',
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#21A366' },
  statusText: { fontSize: 9, fontFamily: Fonte.corpoSemi, letterSpacing: 0.6, color: '#28764A' },
  scroll: { flex: 1, backgroundColor: BRAND.background },
  scrollContent: { paddingBottom: 28 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 25,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroOrbOne: {
    position: 'absolute', width: 210, height: 210, borderRadius: 105,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', top: -110, right: -55,
  },
  heroOrbTwo: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,121,0,0.08)', bottom: -75, left: -50,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  rolePillText: { color: BRAND.white, fontSize: 10, fontFamily: Fonte.corpoSemi, letterSpacing: 0.75 },
  heroSparkle: {
    width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,121,0,0.16)', borderWidth: 1, borderColor: 'rgba(255,121,0,0.24)',
  },
  heroTitle: { ...Typography.displayMD, color: BRAND.white, fontSize: 29, lineHeight: 35, maxWidth: 330 },
  heroDescription: { ...Typography.bodyLarge, color: '#D8E4F1', lineHeight: 24, marginTop: 11, maxWidth: 340 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 22 },
  heroFooterIcon: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.13)' },
  heroFooterText: { color: '#D8E4F1', fontSize: 12, fontFamily: Fonte.corpoSemi },
  content: { paddingHorizontal: 20, paddingTop: 25 },
  sectionHeading: { marginBottom: 20 },
  eyebrow: { color: BRAND.orange, fontSize: 10, fontFamily: Fonte.corpoBold, letterSpacing: 1.5, marginBottom: 8 },
  sectionTitle: { color: BRAND.navy, fontSize: 23, lineHeight: 29, fontFamily: Fonte.tituloSemi, letterSpacing: -0.45 },
  sectionDescription: { color: BRAND.muted, fontFamily: Fonte.corpo, fontSize: 13, lineHeight: 19, marginTop: 6 },
  primaryButtonOuter: { borderRadius: 19, overflow: 'hidden', marginBottom: 12, ...Sombras.md },
  primaryButton: { minHeight: 78, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  primaryIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND.white, alignItems: 'center', justifyContent: 'center' },
  primaryButtonCopy: { flex: 1 },
  primaryButtonTitle: { color: BRAND.white, fontSize: 15, fontFamily: Fonte.corpoSemi },
  primaryButtonSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: Fonte.corpoMedio, marginTop: 4 },
  loginButton: {
    minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    borderRadius: 19, backgroundColor: BRAND.white, borderWidth: 1, borderColor: BRAND.border,
  },
  loginIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: BRAND.blueSoft, alignItems: 'center', justifyContent: 'center' },
  loginButtonCopy: { flex: 1 },
  loginButtonTitle: { color: BRAND.navy, fontSize: 15, fontFamily: Fonte.corpoSemi },
  loginButtonSubtitle: { color: BRAND.muted, fontFamily: Fonte.corpo, fontSize: 11, marginTop: 4 },
  benefitsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, paddingHorizontal: 2 },
  benefit: { alignItems: 'center', flex: 1, gap: 7 },
  benefitIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: BRAND.muted, fontSize: 10, fontFamily: Fonte.corpoSemi },
  benefitDivider: { width: 1, height: 30, backgroundColor: BRAND.border },
  guestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17, marginTop: 12 },
  guestButtonText: { color: BRAND.muted, fontSize: 12, fontFamily: Fonte.corpoSemi },
  termsWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 6, paddingHorizontal: 8, marginTop: 3 },
  termsText: { flex: 1, color: BRAND.muted, fontFamily: Fonte.corpo, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  termsLink: { color: BRAND.navy, fontFamily: Fonte.corpoSemi },
});
