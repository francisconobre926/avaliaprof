
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
  ScrollView,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  useLinguaStore,
  Lingua,
  LINGUAS_DISPONIVEIS,
} from '../../src/store/linguaStore';

import { Fonte } from '../../src/theme/fonts';
import { Colors } from '../../src/theme/colors';
const C = {
  background: Colors.azulSuave,
  blue: Colors.azul,
  blueLight: Colors.azul,
  blueDeep: Colors.azulTexto,
  orange: Colors.azul,
  orangeLight: Colors.azul,
  white: Colors.azulSuave,
  muted: Colors.textoSecundario,
  border: Colors.borda,
  success: Colors.verdeTexto,
};

const LANGUAGES: Lingua[] = ['pt', 'en'];

const FLAGS: Record<Lingua, string> = {
  pt: 'https://flagcdn.com/w160/mz.png',
  en: 'https://flagcdn.com/w160/us.png',
};

export default function EcraEscolhaLingua() {
  const router = useRouter();
  const escolherLingua = useLinguaStore(s => s.escolherLingua);

  const [seleccionada, setSeleccionada] = useState<Lingua>('pt');
  const [aConfirmar, setAConfirmar] = useState(false);

  const entrada = useRef(new Animated.Value(0)).current;
  const deslocamento = useRef(new Animated.Value(22)).current;
  const brilho = useRef(new Animated.Value(0)).current;

  const escalas = useRef(
    LANGUAGES.reduce(
      (acc, idioma) => {
        acc[idioma] = new Animated.Value(idioma === 'pt' ? 1 : 0.97);
        return acc;
      },
      {} as Record<Lingua, Animated.Value>,
    ),
  ).current;

  useEffect(() => {
    const animacaoEntrada = Animated.parallel([
      Animated.timing(entrada, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(deslocamento, {
        toValue: 0,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const animacaoBrilho = Animated.loop(
      Animated.sequence([
        Animated.timing(brilho, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(brilho, {
          toValue: 0,
          duration: 2400,
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
  }, [entrada, deslocamento, brilho]);

  const seleccionar = useCallback(
    (idioma: Lingua) => {
      setSeleccionada(idioma);

      LANGUAGES.forEach(codigo => {
        Animated.spring(escalas[codigo], {
          toValue: codigo === idioma ? 1 : 0.97,
          speed: 20,
          bounciness: 4,
          useNativeDriver: true,
        }).start();
      });
    },
    [escalas],
  );

  const confirmar = async () => {
    if (aConfirmar) return;

    setAConfirmar(true);

    try {
      await escolherLingua(seleccionada);
      router.replace('/onboarding');
    } catch (error) {
      console.error('Não foi possível guardar o idioma:', error);
      setAConfirmar(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.background}
      />

      {/* Fundo tecnológico */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[Colors.azulSuave, Colors.azulSuave, Colors.branco]}
          locations={[0, 0.48, 1]}
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
                outputRange: [0.12, 0.28],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.azul, 'rgba(26, 115, 232,0)']}
            style={styles.luzGradiente}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.luzLaranja,
            {
              opacity: brilho.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.16],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.azul, 'rgba(26, 115, 232,0)']}
            style={styles.luzGradiente}
          />
        </Animated.View>

        <View style={styles.orbitaSuperior} />
        <View style={styles.orbitaInferior} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={[
              styles.conteudo,
              {
                opacity: entrada,
                transform: [{ translateY: deslocamento }],
              },
            ]}
          >
            {/* Logo GoHome */}
            <View style={styles.topo}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="GoHome"
                />
              </View>

              <View style={styles.status}>
                <View style={styles.statusDot} />
                <Text style={styles.statusTexto}>
                  GOHOME INTERFACE
                </Text>
                <View style={styles.statusLinha} />
                <Text style={styles.statusVersao}>01 / 04</Text>
              </View>
            </View>

            {/* Cabeçalho */}
            <View style={styles.cabecalho}>
              <View style={styles.etiqueta}>
                <Ionicons
                  name="globe-outline"
                  size={15}
                  color={C.blueLight}
                />
                <Text style={styles.etiquetaTexto}>
                  PERSONALIZAÇÃO
                </Text>
              </View>

              <Text style={styles.titulo}>
                O teu mundo.
                {'\n'}
                <Text style={styles.tituloDestaque}>
                  A tua língua.
                </Text>
              </Text>

              <Text style={styles.subtitulo}>
                Escolhe o idioma da tua experiência GoHome.
              </Text>

              <Text style={styles.subtituloEn}>
                Select the language for your experience.
              </Text>
            </View>

            {/* Idiomas com bandeiras oficiais */}
            <View style={styles.seccao}>
              <View style={styles.seccaoCabecalho}>
                <Text style={styles.seccaoTitulo}>
                  IDIOMA DO SISTEMA
                </Text>
                <Text style={styles.seccaoNota}>SELECT ONE</Text>
              </View>

              {LANGUAGES.map((codigo, index) => {
                const info = LINGUAS_DISPONIVEIS[codigo];
                const activo = seleccionada === codigo;

                return (
                  <Animated.View
                    key={codigo}
                    style={{
                      transform: [{ scale: escalas[codigo] }],
                      marginBottom: 14,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => seleccionar(codigo)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: activo }}
                      accessibilityLabel={
                        codigo === 'pt'
                          ? 'Português, bandeira de Moçambique'
                          : 'English, bandeira dos Estados Unidos'
                      }
                      style={[
                        styles.cartao,
                        activo && styles.cartaoActivo,
                      ]}
                    >
                      {activo && (
                        <LinearGradient
                          colors={[
                            C.blueLight,
                            C.blue,
                            C.orange,
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.linhaActiva}
                        />
                      )}

                      {/* Bandeira real, sem emoji */}
                      <View
                        style={[
                          styles.bandeiraContainer,
                          activo && styles.bandeiraContainerActiva,
                        ]}
                      >
                        <Image
                          source={{ uri: FLAGS[codigo] }}
                          style={styles.bandeiraImagem}
                          resizeMode="stretch"
                          accessibilityLabel={
                            codigo === 'pt'
                              ? 'Bandeira de Moçambique'
                              : 'Bandeira dos Estados Unidos da América'
                          }
                        />
                      </View>

                      <View style={styles.idiomaTexto}>
                        <Text
                          style={[
                            styles.idiomaNome,
                            activo && styles.idiomaNomeActivo,
                          ]}
                        >
                          {info.nomeNativo}
                        </Text>

                        <Text style={styles.idiomaDescricao}>
                          {codigo === 'pt'
                            ? 'Português de Moçambique'
                            : 'English · United States'}
                        </Text>
                      </View>

                      <View style={styles.cartaoDireita}>
                        <Text
                          style={[
                            styles.indice,
                            activo && styles.indiceActivo,
                          ]}
                        >
                          0{index + 1}
                        </Text>

                        <View
                          style={[
                            styles.radio,
                            activo && styles.radioActivo,
                          ]}
                        >
                          {activo && (
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color={C.white}
                            />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* Botão continuar */}
            <View style={styles.rodape}>
              <TouchableOpacity
                onPress={confirmar}
                disabled={aConfirmar}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={[
                  styles.botao,
                  aConfirmar && styles.botaoDesactivado,
                ]}
              >
                <LinearGradient
                  colors={[C.blue, C.blueDeep, C.orange]}
                  locations={[0, 0.58, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />

                <Text style={styles.botaoTexto}>
                  {aConfirmar
                    ? seleccionada === 'pt'
                      ? 'A preparar...'
                      : 'Preparing...'
                    : seleccionada === 'pt'
                      ? 'Continuar'
                      : 'Continue'}
                </Text>

                <View style={styles.botaoIcone}>
                  <Ionicons
                    name={aConfirmar ? 'hourglass-outline' : 'arrow-forward'}
                    size={19}
                    color={C.white}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.nota}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={15}
                  color={C.success}
                />
                <Text style={styles.notaTexto}>
                  {seleccionada === 'pt'
                    ? 'Podes alterar o idioma nas definições.'
                    : 'You can change the language in settings.'}
                </Text>
              </View>

              <View style={styles.assinatura}>
                <View style={styles.assinaturaLinha} />
                <Text style={styles.assinaturaTexto}>
                  GOHOME · ENCONTRA. VISITA. VIVE.
                </Text>
                <View style={styles.assinaturaLinha} />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },

  // Fundo
  luzAzul: {
    position: 'absolute',
    width: 310,
    height: 310,
    top: -105,
    right: -110,
    borderRadius: 155,
    overflow: 'hidden',
  },
  luzLaranja: {
    position: 'absolute',
    width: 230,
    height: 230,
    bottom: 60,
    left: -145,
    borderRadius: 115,
    overflow: 'hidden',
  },
  luzGradiente: {
    flex: 1,
    borderRadius: 200,
  },
  orbitaSuperior: {
    position: 'absolute',
    width: 250,
    height: 250,
    top: -170,
    left: -110,
    borderRadius: 125,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232,0.13)',
  },
  orbitaInferior: {
    position: 'absolute',
    width: 300,
    height: 300,
    bottom: -210,
    right: -160,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232,0.12)',
  },

  // Topo e logo
  topo: {
    alignItems: 'center',
    marginBottom: 27,
  },
  logoContainer: {
    width: 178,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  status: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  statusTexto: {
    fontSize: 12,
    color: C.muted,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.6,
  },
  statusLinha: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  statusVersao: {
    fontSize: 12,
    color: C.blueLight,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1,
  },

  // Cabeçalho
  cabecalho: {
    marginBottom: 31,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232,0.24)',
    backgroundColor: 'rgba(26, 115, 232,0.09)',
    borderRadius: 8,
    marginBottom: 20,
  },
  etiquetaTexto: {
    color: C.blueLight,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.8,
  },
  titulo: {
    color: Colors.carvao,
    fontSize: 34,
    lineHeight: 44,
    fontFamily: Fonte.tituloSemi,
    letterSpacing: -0.4,
  },
  tituloDestaque: {
    color: C.orange,
  },
  subtitulo: {
    color: Colors.textoSecundario,
    fontFamily: Fonte.corpo, fontSize: 14,
    lineHeight: 22,
    marginTop: 15,
  },
  subtituloEn: {
    color: C.muted,
    fontFamily: Fonte.corpo, fontSize: 12,
    lineHeight: 19,
    marginTop: 3,
  },

  // Seleção
  seccao: {
    marginBottom: 24,
  },
  seccaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  seccaoTitulo: {
    color: Colors.textoSecundario,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.6,
  },
  seccaoNota: {
    color: Colors.textoTerciario,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1,
  },
  cartao: {
    minHeight: 92,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: Colors.branco,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 17,
    overflow: 'hidden',
    gap: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cartaoActivo: {
    borderColor: 'rgba(26, 115, 232,0.75)',
    backgroundColor: Colors.azulSuave,
  },
  linhaActiva: {
    position: 'absolute',
    top: 0,
    left: 17,
    right: 17,
    height: 2,
  },

  // Bandeiras profissionais
  bandeiraContainer: {
    width: 58,
    height: 39,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: Colors.branco,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bandeiraContainerActiva: {
    borderColor: C.blueLight,
    borderWidth: 1.5,
    shadowColor: C.blue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  bandeiraImagem: {
    width: '100%',
    height: '100%',
  },

  idiomaTexto: {
    flex: 1,
    justifyContent: 'center',
  },
  idiomaNome: {
    color: Colors.textoSecundario,
    fontSize: 18,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: -0.3,
  },
  idiomaNomeActivo: {
    color: C.white,
  },
  idiomaDescricao: {
    color: C.muted,
    fontFamily: Fonte.corpo, fontSize: 12,
    marginTop: 5,
  },
  cartaoDireita: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  indice: {
    color: Colors.textoTerciario,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1,
  },
  indiceActivo: {
    color: C.orangeLight,
  },
  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.textoTerciario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActivo: {
    backgroundColor: C.blue,
    borderColor: C.blueLight,
  },

  // Rodapé
  rodape: {
    marginTop: 'auto',
  },
  botao: {
    minHeight: 59,
    borderRadius: 17,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    shadowColor: C.blue,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  botaoDesactivado: {
    opacity: 0.75,
  },
  botaoTexto: {
    color: Colors.branco,
    fontSize: 16,
    fontFamily: Fonte.corpoBold,
    letterSpacing: 0.3,
  },
  botaoIcone: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.17)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nota: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
  },
  notaTexto: {
    color: Colors.textoSecundario,
    fontFamily: Fonte.corpo, fontSize: 12,
    textAlign: 'center',
  },
  assinatura: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
  },
  assinaturaLinha: {
    width: 20,
    height: 1,
    backgroundColor: Colors.borda,
  },
  assinaturaTexto: {
    color: Colors.textoTerciario,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.4,
  },
});
