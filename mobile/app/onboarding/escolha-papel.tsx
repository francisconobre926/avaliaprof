
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
const C = {
  background: '#F5F9FF',
  backgroundLight: '#EAF2FA',
  surface: '#FFFFFF',
  surfaceLight: '#F0F7FF',
  blue: '#0A6BC0',
  blueLight: '#19B5FF',
  blueDeep: '#034B9B',
  orange: '#FF6A00',
  orangeLight: '#FFAB19',
  white: '#F5F8FF',
  muted: '#647D99',
  border: '#E7E5DF',
  green: '#45E5B0',
};

type FeatureProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  color: string;
};

const procurarFeatures: FeatureProps[] = [
  {
    icon: 'search-outline',
    text: 'Explora anúncios disponíveis',
    color: C.orangeLight,
  },
  {
    icon: 'location-outline',
    text: 'Pesquisa por localização',
    color: C.orangeLight,
  },
];

const anunciarFeatures: FeatureProps[] = [
  {
    icon: 'add-circle-outline',
    text: 'Publica os teus anúncios',
    color: C.blueLight,
  },
  {
    icon: 'people-outline',
    text: 'Alcança potenciais clientes',
    color: C.blueLight,
  },
];

export default function EscolhaPapelScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const [navegando, setNavegando] = useState(false);

  const entrada = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const escalaProcurar = useRef(new Animated.Value(0.94)).current;
  const escalaAnunciar = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    const animacaoEntrada = Animated.parallel([
      Animated.timing(entrada, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(escalaProcurar, {
        toValue: 1,
        speed: 15,
        bounciness: 3,
        useNativeDriver: true,
      }),
      Animated.spring(escalaAnunciar, {
        toValue: 1,
        speed: 15,
        bounciness: 3,
        delay: 120,
        useNativeDriver: true,
      }),
    ]);

    const animacaoBrilho = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(brilho, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animacaoEntrada.start();
    animacaoBrilho.start();

    return () => {
      animacaoEntrada.stop();
      animacaoBrilho.stop();
    };
  }, [entrada, brilho, escalaProcurar, escalaAnunciar]);

  const irParaProcurador = () => {
    if (navegando) return;

    setNavegando(true);
    router.replace('/(procurador)' as any);
  };

  const irParaAnunciante = () => {
    if (navegando) return;

    setNavegando(true);

    router.push({
      pathname: '/auth',
      params: { papel: 'anunciante' },
    });
  };

  const compacto = height < 740;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.background}
      />

      {/* Fundo tecnológico */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#EAF2FA', '#F8FBFF', '#FFFFFF']}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.luzAzul,
            {
              opacity: brilho.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08, 0.22],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[C.blue, 'rgba(8,124,240,0)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.luzLaranja,
            {
              opacity: brilho.interpolate({
                inputRange: [0, 1],
                outputRange: [0.04, 0.15],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[C.orange, 'rgba(255,106,0,0)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.orbitaSuperior} />
        <View style={styles.orbitaInferior} />

        <View style={styles.pontosDecorativos}>
          {Array.from({ length: 24 }).map((_, index) => (
            <View key={index} style={styles.pontoDecorativo} />
          ))}
        </View>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            compacto && styles.scrollCompacto,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={[
              styles.conteudo,
              {
                opacity: entrada,
                transform: [
                  {
                    translateY: entrada.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Logo */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="GoHome"
                />
              </View>

              <View style={styles.indicador}>
                <View style={styles.indicadorPonto} />
                <Text style={styles.indicadorTexto}>
                  EXPERIÊNCIA GOHOME
                </Text>
              </View>
            </View>

            {/* Introdução */}
            <View style={styles.hero}>
              <View style={styles.etiqueta}>
                <Ionicons
                  name="compass-outline"
                  size={15}
                  color={C.blueLight}
                />
                <Text style={styles.etiquetaTexto}>
                  O TEU PRÓXIMO PASSO
                </Text>
              </View>

              <Text style={styles.titulo}>
                O que procuras
                {'\n'}
                <Text style={styles.tituloDestaque}>
                  fazer hoje?
                </Text>
              </Text>

              <Text style={styles.subtitulo}>
                Encontra o que precisas ou apresenta as tuas
                oportunidades ao mundo.
              </Text>

              <Text style={styles.subtituloSecundario}>
                Escolhe como queres utilizar o GoHome.
              </Text>
            </View>

            {/* Cartão: Procurar */}
            <Animated.View
              style={{
                transform: [{ scale: escalaProcurar }],
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                style={styles.cartao}
                activeOpacity={0.88}
                onPress={irParaProcurador}
                disabled={navegando}
                accessibilityRole="button"
                accessibilityLabel="Quero procurar imóveis e oportunidades"
              >
                <LinearGradient
                  colors={['#FFF4E9', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <LinearGradient
                  colors={[C.orangeLight, C.orange, 'rgba(255,106,0,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.linhaSuperiorLaranja}
                />

                <View style={styles.cartaoTopo}>
                  <View style={styles.iconBoxLaranja}>
                    <Icone
                      name="home-search-outline"
                      size={31}
                      color={C.orangeLight}
                    />
                  </View>

                  <View style={styles.numeroCartao}>
                    <Text style={styles.numeroCartaoTexto}>01</Text>
                  </View>

                  <View style={styles.setaLaranja}>
                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color={C.orangeLight}
                    />
                  </View>
                </View>

                <Text style={styles.cartaoTitulo}>
                  Quero procurar
                </Text>

                <Text style={styles.cartaoDescricao}>
                  Descobre casas, apartamentos, quartos, alojamentos
                  e outras oportunidades disponíveis.
                </Text>

                <View style={styles.listaCaracteristicas}>
                  {procurarFeatures.map(feature => (
                    <Feature key={feature.text} {...feature} />
                  ))}
                </View>

                <View style={styles.separadorLaranja} />

                <View style={styles.cartaoAcao}>
                  <Text style={styles.cartaoAcaoLaranja}>
                    Explorar oportunidades
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={C.orangeLight}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Cartão: Anunciar */}
            <Animated.View
              style={{
                transform: [{ scale: escalaAnunciar }],
                marginBottom: 18,
              }}
            >
              <TouchableOpacity
                style={styles.cartao}
                activeOpacity={0.88}
                onPress={irParaAnunciante}
                disabled={navegando}
                accessibilityRole="button"
                accessibilityLabel="Quero anunciar imóveis, produtos ou serviços"
              >
                <LinearGradient
                  colors={['#EAF2FA', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <LinearGradient
                  colors={[C.blueLight, C.blue, 'rgba(8,124,240,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.linhaSuperiorAzul}
                />

                <View style={styles.cartaoTopo}>
                  <View style={styles.iconBoxAzul}>
                    <Icone
                      name="storefront-outline"
                      size={31}
                      color={C.blueLight}
                    />
                  </View>

                  <View style={styles.numeroCartao}>
                    <Text style={styles.numeroCartaoTexto}>02</Text>
                  </View>

                  <View style={styles.setaAzul}>
                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color={C.blueLight}
                    />
                  </View>
                </View>

                <Text style={styles.cartaoTitulo}>
                  Quero anunciar
                </Text>

                <Text style={styles.cartaoDescricao}>
                  Divulga imóveis, produtos ou serviços e conecta-te
                  com pessoas interessadas.
                </Text>

                <View style={styles.listaCaracteristicas}>
                  {anunciarFeatures.map(feature => (
                    <Feature key={feature.text} {...feature} />
                  ))}
                </View>

                <View style={styles.separadorAzul} />

                <View style={styles.cartaoAcao}>
                  <Text style={styles.cartaoAcaoAzul}>
                    Começar a anunciar
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={C.blueLight}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Rodapé */}
            <View style={styles.rodape}>
              <View style={styles.rodapeIcone}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={C.green}
                />
              </View>

              <Text style={styles.rodapeTexto}>
                Mais oportunidades. Mais possibilidades.
              </Text>
            </View>

            <View style={styles.assinatura}>
              <View style={styles.assinaturaLinha} />
              <Text style={styles.assinaturaTexto}>
                GOHOME · ENCONTRA. VISITA. VIVE.
              </Text>
              <View style={styles.assinaturaLinha} />
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Feature({ icon, text, color }: FeatureProps) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcone}>
        <Ionicons name={icon} size={16} color={color} />
      </View>

      <Text style={styles.featureTexto}>{text}</Text>

      <Ionicons
        name="checkmark"
        size={14}
        color={C.green}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollCompacto: {
    paddingBottom: 8,
  },
  conteudo: {
    paddingHorizontal: 23,
    paddingTop: 8,
    paddingBottom: 22,
  },

  // Fundo futurista
  luzAzul: {
    position: 'absolute',
    width: 330,
    height: 330,
    top: -130,
    right: -140,
    borderRadius: 170,
    overflow: 'hidden',
  },
  luzLaranja: {
    position: 'absolute',
    width: 280,
    height: 280,
    bottom: 30,
    left: -180,
    borderRadius: 145,
    overflow: 'hidden',
  },
  orbitaSuperior: {
    position: 'absolute',
    width: 240,
    height: 240,
    top: -180,
    left: -115,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.16)',
  },
  orbitaInferior: {
    position: 'absolute',
    width: 300,
    height: 300,
    bottom: -215,
    right: -175,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.13)',
  },
  pontosDecorativos: {
    position: 'absolute',
    top: 100,
    right: 14,
    width: 48,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    opacity: 0.45,
  },
  pontoDecorativo: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: C.blueLight,
  },

  // Header e logo
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 174,
    height: 80,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  indicador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  indicadorPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  indicadorTexto: {
    color: C.muted,
    fontSize: 9,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.8,
  },

  // Introdução
  hero: {
    marginBottom: 24,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.23)',
    backgroundColor: 'rgba(8,124,240,0.09)',
    marginBottom: 17,
  },
  etiquetaTexto: {
    color: C.blueLight,
    fontSize: 9,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.5,
  },
  titulo: {
    color: '#1E2836',
    fontSize: 34,
    lineHeight: 41,
    fontFamily: Fonte.tituloBold,
    letterSpacing: -1.2,
  },
  tituloDestaque: {
    color: C.orange,
  },
  subtitulo: {
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  subtituloSecundario: {
    color: C.muted,
    fontFamily: Fonte.corpo, fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },

  // Cartões
  cartao: {
    borderRadius: 21,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 19,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  linhaSuperiorLaranja: {
    position: 'absolute',
    top: 0,
    left: 17,
    right: 17,
    height: 2,
  },
  linhaSuperiorAzul: {
    position: 'absolute',
    top: 0,
    left: 17,
    right: 17,
    height: 2,
  },
  cartaoTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 17,
  },
  iconBoxLaranja: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,106,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,171,25,0.25)',
  },
  iconBoxAzul: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,124,240,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.25)',
  },
  numeroCartao: {
    flex: 1,
  },
  numeroCartaoTexto: {
    color: '#8E939B',
    fontSize: 10,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.5,
  },
  setaLaranja: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,106,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,171,25,0.2)',
  },
  setaAzul: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,124,240,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.22)',
  },
  cartaoTitulo: {
    color: '#1E2836',
    fontSize: 21,
    lineHeight: 27,
    fontFamily: Fonte.tituloBold,
    letterSpacing: -0.5,
  },
  cartaoDescricao: {
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  // Características
  listaCaracteristicas: {
    gap: 11,
    marginTop: 17,
    marginBottom: 18,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  featureIcone: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  featureTexto: {
    flex: 1,
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 12,
    lineHeight: 18,
  },

  // Ação do cartão
  separadorLaranja: {
    height: 1,
    backgroundColor: 'rgba(255,106,0,0.19)',
    marginBottom: 15,
  },
  separadorAzul: {
    height: 1,
    backgroundColor: 'rgba(25,181,255,0.19)',
    marginBottom: 15,
  },
  cartaoAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  cartaoAcaoLaranja: {
    color: C.orangeLight,
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },
  cartaoAcaoAzul: {
    color: C.blueLight,
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },

  // Rodapé
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 2,
    marginBottom: 18,
  },
  rodapeIcone: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: 'rgba(69,229,176,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(69,229,176,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rodapeTexto: {
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 11,
    flexShrink: 1,
    textAlign: 'center',
  },
  assinatura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  assinaturaLinha: {
    width: 19,
    height: 1,
    backgroundColor: '#E7E5DF',
  },
  assinaturaTexto: {
    color: '#8E939B',
    fontSize: 8,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.25,
  },
});
