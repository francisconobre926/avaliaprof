
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  ViewToken,
  Image,
  Animated,
  StatusBar,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../src/store/userStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  background: '#F5F9FF',
  backgroundLight: '#EAF4FF',
  surface: '#FFFFFF',
  blue: '#087CF0',
  blueLight: '#19B5FF',
  blueDeep: '#034B9B',
  orange: '#FF6A00',
  orangeLight: '#FFAB19',
  white: '#F5F8FF',
  muted: '#647D99',
  border: '#D8E6F5',
  green: '#45E5B0',
};

const CHAVE_ONBOARDING_CONCLUIDO = '@gohome_onboarding_concluido';

type Slide = {
  id: string;
  icone: keyof typeof MaterialCommunityIcons.glyphMap;
  gradiente: readonly [string, string, ...string[]];
  titulo: string;
  descricao: string;
  destaque: string;
  numero: string;
};

const slides: Slide[] = [
  {
    id: '1',
    icone: 'home-city-outline',
    gradiente: ['#087CF0', '#034B9B'],
    titulo: 'Tudo num só lugar',
    descricao:
      'Descobre imóveis, veículos, alojamentos, espaços comerciais, produtos e serviços numa única plataforma.',
    destaque: 'UM MUNDO DE OPÇÕES',
    numero: '01',
  },
  {
    id: '2',
    icone: 'map-search-outline',
    gradiente: ['#087CF0', '#0878E8'],
    titulo: 'Encontra o que procuras',
    descricao:
      'Explora categorias, pesquisa por localização e compara opções para encontrares a solução ideal para ti.',
    destaque: 'PESQUISA INTELIGENTE',
    numero: '02',
  },
  {
    id: '3',
    icone: 'handshake-outline',
    gradiente: ['#087CF0', '#FF6A00'],
    titulo: 'Encontra. Conecta-te. Negocia.',
    descricao:
      'Entra em contacto com anunciantes, descobre oportunidades e publica os teus próprios anúncios no GoHome.',
    destaque: 'OPORTUNIDADES PARA TODOS',
    numero: '03',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [aVerificar, setAVerificar] = useState(true);

  const flatListRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const entrada = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;

  const usuario = useUserStore(state => state.usuario);
  const isLogado = useUserStore(state => state.isLogado);
  const carregado = useUserStore(state => state.carregado);
  const carregarUsuario = useUserStore(state => state.carregarUsuario);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const item = viewableItems.find(v => v.isViewable);

      if (item?.index != null) {
        setCurrentIndex(item.index);
      }
    },
  ).current;

  const irParaInicio = useCallback(
    (papel?: 'procurador' | 'anunciante' | null) => {
      if (papel === 'anunciante') {
        router.replace('/(anunciante)' as any);
      } else {
        router.replace('/(procurador)' as any);
      }
    },
    [router],
  );

  // Verificação da sessão e do onboarding
  useEffect(() => {
    let activo = true;

    const verificarEntrada = async () => {
      try {
        if (!useUserStore.getState().carregado) {
          await carregarUsuario();
        }

        const onboardingConcluido = await AsyncStorage.getItem(
          CHAVE_ONBOARDING_CONCLUIDO,
        );

        if (!activo) return;

        const estado = useUserStore.getState();

        if (estado.isLogado && estado.usuario) {
          irParaInicio(estado.usuario.papel);
          return;
        }

        if (onboardingConcluido === 'true') {
          router.replace('/onboarding/escolha-papel' as any);
          return;
        }
      } catch (erro) {
        console.warn(
          'Não foi possível verificar a sessão/onboarding:',
          erro,
        );
      } finally {
        if (activo) {
          setAVerificar(false);
        }
      }
    };

    void verificarEntrada();

    return () => {
      activo = false;
    };
  }, [carregarUsuario, irParaInicio, router]);

  // Animação de entrada e iluminação ambiental
  useEffect(() => {
    const animacaoEntrada = Animated.timing(entrada, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const animacaoBrilho = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(brilho, {
          toValue: 0,
          duration: 2600,
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
  }, [entrada, brilho]);

  const concluirOnboarding = async () => {
    try {
      await AsyncStorage.setItem(CHAVE_ONBOARDING_CONCLUIDO, 'true');
    } catch (erro) {
      console.warn(
        'Não foi possível guardar a conclusão do onboarding:',
        erro,
      );
    }

    router.replace('/onboarding/escolha-papel' as any);
  };

  const proximo = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      void concluirOnboarding();
    }
  };

  const saltar = () => {
    void concluirOnboarding();
  };

  // Ecrã de carregamento
  if (aVerificar) {
    return (
      <SafeAreaView style={styles.carregamento} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={C.background} />

        <View style={styles.logoCarregamentoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoCarregamento}
            resizeMode="contain"
          />
        </View>

        <View style={styles.carregamentoBarra}>
          <LinearGradient
            colors={[C.blueLight, C.blue, C.orange]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Text style={styles.carregamentoTexto}>
          A PREPARAR A TUA EXPERIÊNCIA
        </Text>
      </SafeAreaView>
    );
  }

  const compacto = height < 740;
  const tamanhoIlustracao = Math.min(
    width * (compacto ? 0.49 : 0.59),
    compacto ? 205 : 245,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.background} />

      {/* Fundo futurista */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#EAF4FF', '#F8FBFF', '#FFFFFF']}
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
                outputRange: [0.09, 0.24],
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
        <View style={styles.linhaDecorativa} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Cabeçalho */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: entrada,
              transform: [
                {
                  translateY: entrada.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.logoFundo}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoHeader}
              resizeMode="contain"
              accessibilityLabel="GoHome"
            />
          </View>

          <TouchableOpacity
            style={styles.saltarBotao}
            onPress={saltar}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <Text style={styles.saltarText}>Saltar</Text>
            <Ionicons name="arrow-forward" size={14} color={C.white} />
          </TouchableOpacity>
        </Animated.View>

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={slides}
          horizontal
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.82, 1, 0.82],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });

            const rotacao = scrollX.interpolate({
              inputRange,
              outputRange: ['-7deg', '0deg', '7deg'],
              extrapolate: 'clamp',
            });

            return (
              <View style={[styles.slide, { width }]}>
                {/* Ilustração */}
                <Animated.View
                  style={[
                    styles.ilustracaoContainer,
                    {
                      width: tamanhoIlustracao,
                      height: tamanhoIlustracao,
                      opacity,
                      transform: [
                        { scale },
                        { rotate: rotacao },
                      ],
                    },
                  ]}
                >
                  <View style={styles.circuloGrande} />
                  <View style={styles.circuloMedio} />
                  <View style={styles.circuloPequeno} />

                  <View style={styles.anelExterno} />
                  <View style={styles.anelInterno} />

                  <View style={styles.circuloIcone}>
                    <LinearGradient
                      colors={item.gradiente}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.reflexoIcone} />

                    <MaterialCommunityIcons
                      name={item.icone}
                      size={tamanhoIlustracao * 0.39}
                      color={C.white}
                    />
                  </View>

                  {/* Elementos decorativos */}
                  <View style={styles.pontoSuperior}>
                    <Ionicons
                      name="sparkles-outline"
                      size={17}
                      color={C.orangeLight}
                    />
                  </View>

                  <View style={styles.pontoInferior}>
                    <Ionicons
                      name="checkmark"
                      size={17}
                      color={C.green}
                    />
                  </View>

                  <View style={styles.pontoLateral} />
                </Animated.View>

                {/* Indicador de etapa */}
                <View style={styles.destaqueBadge}>
                  <View style={styles.destaqueBadgeDot} />
                  <Text style={styles.destaqueBadgeText}>
                    {item.destaque}
                  </Text>
                </View>

                {/* Conteúdo */}
                <Animated.View
                  style={[
                    styles.textoContainer,
                    {
                      opacity,
                      transform: [
                        {
                          translateY: scrollX.interpolate({
                            inputRange,
                            outputRange: [18, 0, 18],
                            extrapolate: 'clamp',
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.numeroSlide}>
                    GOHOME / {item.numero}
                  </Text>

                  <Text style={styles.titulo}>{item.titulo}</Text>

                  <Text style={styles.descricao}>{item.descricao}</Text>
                </Animated.View>
              </View>
            );
          }}
        />

        {/* Rodapé e progresso */}
        <Animated.View
          style={[
            styles.footer,
            {
              opacity: entrada,
              transform: [
                {
                  translateY: entrada.interpolate({
                    inputRange: [0, 1],
                    outputRange: [15, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.progressoCabecalho}>
            <Text style={styles.progressoLabel}>
              A TUA EXPERIÊNCIA COMEÇA AQUI
            </Text>

            <Text style={styles.progressoNumero}>
              0{currentIndex + 1}
              <Text style={styles.progressoTotal}> / 0{slides.length}</Text>
            </Text>
          </View>

          <View style={styles.dots}>
            {slides.map((slide, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 34, 8],
                extrapolate: 'clamp',
              });

              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={slide.id}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                    },
                  ]}
                >
                  {index === currentIndex && (
                    <LinearGradient
                      colors={[C.blueLight, C.blue, C.orange]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                </Animated.View>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.botaoContainer}
            onPress={proximo}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[C.blue, C.blueDeep, C.orange]}
              locations={[0, 0.56, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.botao}
            >
              <Text style={styles.botaoText}>
                {currentIndex === slides.length - 1
                  ? 'Vamos começar'
                  : 'Próximo'}
              </Text>

              <View style={styles.botaoIcone}>
                <Ionicons
                  name={
                    currentIndex === slides.length - 1
                      ? 'rocket-outline'
                      : 'arrow-forward'
                  }
                  size={20}
                  color={C.white}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.assinatura}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaTexto}>
              ENCONTRA. VISITA. VIVE.
            </Text>
            <View style={styles.assinaturaLinha} />
          </View>
        </Animated.View>
      </SafeAreaView>
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

  // Carregamento
  carregamento: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  logoCarregamentoContainer: {
    width: 190,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  logoCarregamento: {
    width: '100%',
    height: '100%',
  },
  carregamentoBarra: {
    width: 72,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 25,
  },
  carregamentoTexto: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 15,
  },

  // Fundo
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
    width: 270,
    height: 270,
    bottom: 90,
    left: -170,
    borderRadius: 140,
    overflow: 'hidden',
  },
  orbitaSuperior: {
    position: 'absolute',
    width: 240,
    height: 240,
    top: -185,
    left: -100,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.17)',
  },
  orbitaInferior: {
    position: 'absolute',
    width: 280,
    height: 280,
    bottom: -210,
    right: -155,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.14)',
  },
  linhaDecorativa: {
    position: 'absolute',
    top: '43%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(25,181,255,0.045)',
  },

  // Header
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 5,
    paddingBottom: 8,
  },
  logoFundo: {
    width: 130,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHeader: {
    width: '100%',
    height: '100%',
  },
  saltarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
  },
  saltarText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Slide
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 29,
    paddingTop: 5,
    paddingBottom: 12,
  },
  ilustracaoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 22,
  },
  circuloGrande: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(8,124,240,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.1)',
  },
  circuloMedio: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,106,0,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.12)',
  },
  circuloPequeno: {
    position: 'absolute',
    width: '61%',
    height: '61%',
    borderRadius: 999,
    backgroundColor: 'rgba(8,124,240,0.08)',
  },
  anelExterno: {
    position: 'absolute',
    width: '91%',
    height: '91%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.22)',
    borderStyle: 'dashed',
  },
  anelInterno: {
    position: 'absolute',
    width: '72%',
    height: '72%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,106,0,0.16)',
  },
  circuloIcone: {
    width: '54%',
    height: '54%',
    borderRadius: 999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: C.blue,
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  reflexoIcone: {
    position: 'absolute',
    width: '75%',
    height: '35%',
    top: 0,
    left: 0,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pontoSuperior: {
    position: 'absolute',
    top: '8%',
    right: '7%',
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: 'rgba(255,171,25,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoInferior: {
    position: 'absolute',
    bottom: '7%',
    left: '8%',
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EAF4FF',
    borderWidth: 1,
    borderColor: 'rgba(69,229,176,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pontoLateral: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: '27%',
    left: '8%',
    backgroundColor: C.blueLight,
    shadowColor: C.blueLight,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },

  // Badge
  destaqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(25,181,255,0.23)',
    backgroundColor: 'rgba(8,124,240,0.1)',
    marginBottom: 19,
  },
  destaqueBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.orange,
  },
  destaqueBadgeText: {
    color: C.blueLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Texto
  textoContainer: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 430,
  },
  numeroSlide: {
    color: C.orangeLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  titulo: {
    color: '#17324D',
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.9,
    marginBottom: 14,
  },
  descricao: {
    color: '#536B86',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 365,
  },

  // Rodapé
  footer: {
    paddingHorizontal: 25,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'android' ? 12 : 8,
  },
  progressoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  progressoLabel: {
    color: '#647D99',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.25,
  },
  progressoNumero: {
    color: C.blueLight,
    fontSize: 11,
    fontWeight: '900',
  },
  progressoTotal: {
    color: '#7187A2',
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  dot: {
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#D8E6F5',
  },
  botaoContainer: {
    borderRadius: 17,
    overflow: 'hidden',
    shadowColor: C.blue,
    shadowOpacity: 0.27,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  botao: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
    paddingVertical: 12,
  },
  botaoText: {
    flex: 1,
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginLeft: 37,
  },
  botaoIcone: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assinatura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
  },
  assinaturaLinha: {
    width: 22,
    height: 1,
    backgroundColor: '#D8E6F5',
  },
  assinaturaTexto: {
    color: '#7187A2',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
});
