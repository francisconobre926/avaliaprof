/**
 * app/index.tsx
 *
 * Splash screen — primeiro ecrã que a app mostra.
 *
 * Depois de 3s, decide para onde ir:
 * 1. Se utilizador ainda NÃO escolheu língua → /onboarding/lingua
 * 2. Se já escolheu → /onboarding (fluxo normal)
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Sombras } from '../src/theme/colors';
import { Spacing, Typography } from '../src/theme/typography';
import { useLinguaStore } from '../src/store/linguaStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const linguaCarregada = useLinguaStore(s => s.carregado);
  const linguaEscolhida = useLinguaStore(s => s.linguaEscolhida);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Decide para onde ir depois do splash
  useEffect(() => {
    if (!linguaCarregada) return;

    const timer = setTimeout(() => {
      // ⭐ Primeira vez (sem língua escolhida) → ecrã de escolha de língua
      if (linguaEscolhida === null) {
        router.replace('/onboarding/lingua' as any);
      } else {
        // Já escolheu língua anteriormente → fluxo normal
        router.replace('/onboarding');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [linguaCarregada, linguaEscolhida]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Fundo branco limpo */}
      <View style={StyleSheet.absoluteFill} />

      {/* Círculos decorativos suaves */}
      <Animated.View
        style={[
          styles.circuloDecorativo1,
          { transform: [{ rotate }] },
        ]}
      />
      <Animated.View
        style={[
          styles.circuloDecorativo2,
          { transform: [{ rotate }] },
        ]}
      />

      {/* Glow effect atrás do logo */}
      <View style={styles.glowContainer}>
        <LinearGradient
          colors={['rgba(26, 115, 232, 0.15)', 'rgba(52, 168, 83, 0.15)', 'transparent']}
          style={styles.glow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Conteúdo principal — o logo */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.loadingDots}>
          <View style={styles.loadingDot} />
          <View style={[styles.loadingDot, { opacity: 0.6, backgroundColor: Colors.verde }]} />
          <View style={[styles.loadingDot, { opacity: 0.3 }]} />
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.linhaDecorativa}>
            <View style={styles.linha} />
            <Text style={styles.footerBrand}>LET'S GO TECH</Text>
            <View style={styles.linha} />
          </View>
          <Text style={styles.footerCopy}>© 2026 — Todos os direitos reservados</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: Colors.branco,
  },
  circuloDecorativo1: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.08)',
    top: -width * 0.4,
    left: -width * 0.2,
  },
  circuloDecorativo2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    borderWidth: 1,
    borderColor: 'rgba(52, 168, 83, 0.08)',
    bottom: -width * 0.3,
    right: -width * 0.2,
  },
  glowContainer: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.45,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.75,
    height: width * 0.75,
    maxWidth: 320,
    maxHeight: 320,
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    alignItems: 'center',
    width: '100%',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.azul,
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  linhaDecorativa: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    maxWidth: 280,
    marginBottom: Spacing.sm,
  },
  linha: {
    height: 1,
    flex: 1,
    backgroundColor: Colors.bordaSubtil,
    maxWidth: 50,
  },
  footerBrand: {
    ...Typography.captionBold,
    color: Colors.azulEscuro,
    letterSpacing: 3,
    marginHorizontal: Spacing.md,
  },
  footerCopy: {
    ...Typography.caption,
    color: Colors.textoTerciario,
  },
});