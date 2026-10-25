import { useState, useRef, useEffect } from 'react';

import {

  View,

  Text,

  StyleSheet,

  TouchableOpacity,

  Animated,

  StatusBar,

  Image,

  Modal,

  Pressable,

  Alert,

  ScrollView,

} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';

import { Colors, Sombras } from '../../src/theme/colors';

import { Spacing, Typography, Radius } from '../../src/theme/typography';



export default function AdicionarFotoScreen() {

  const router = useRouter();

  const { papel } = useLocalSearchParams<{ papel: 'procurador' | 'anunciante' }>();



  const [foto, setFoto] = useState<string | null>(null);

  const [modalVisivel, setModalVisivel] = useState(false);

  const [loading, setLoading] = useState(false);



  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;



  const isAnunciante = papel === 'anunciante';

  const corPrincipal = isAnunciante ? '#FF7900' : '#0B2E59';

  const gradiente = isAnunciante ? ['#FF7900', '#E96500'] as const : ['#0B2E59', '#174A7E'] as const;



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



    // Animação de pulso contínua no círculo

    Animated.loop(

      Animated.sequence([

        Animated.timing(pulseAnim, {

          toValue: 1.05,

          duration: 1500,

          useNativeDriver: true,

        }),

        Animated.timing(pulseAnim, {

          toValue: 1,

          duration: 1500,

          useNativeDriver: true,

        }),

      ])

    ).start();

  }, []);



  const tirarFoto = async () => {

    setModalVisivel(false);

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {

      Alert.alert('Permissão negada', 'Precisamos de acesso à câmara');

      return;

    }

    const result = await ImagePicker.launchCameraAsync({

      allowsEditing: true,

      aspect: [1, 1],

      quality: 0.7,

    });

    if (!result.canceled) {

      setFoto(result.assets[0].uri);

    }

  };



  const escolherGaleria = async () => {

    setModalVisivel(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {

      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria');

      return;

    }

    const result = await ImagePicker.launchImageLibraryAsync({

      mediaTypes: ['images'],

      allowsEditing: true,

      aspect: [1, 1],

      quality: 0.7,

    });

    if (!result.canceled) {

      setFoto(result.assets[0].uri);

    }

  };



  const removerFoto = () => {

    setFoto(null);

  };



  const continuar = () => {

    setLoading(true);

    setTimeout(() => {

      setLoading(false);

      router.replace(isAnunciante ? '/(anunciante)' : '/(procurador)');

    }, 800);

  };



  const saltar = () => {

    Alert.alert(

      'Tens a certeza?',

      'Perfis com foto recebem 5x mais contactos. Podes adicionar depois nas definições.',

      [

        { text: 'Adicionar agora', style: 'default' },

        {

          text: 'Saltar',

          style: 'cancel',

          onPress: () => router.replace(isAnunciante ? '/(anunciante)' : '/(procurador)'),

        },

      ]

    );

  };



  return (

    <View style={styles.container}>

      <StatusBar barStyle="dark-content" backgroundColor={Colors.branco} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        {/* Header */}

        <View style={styles.header}>

          <View style={styles.headerProgresso}>

            <View style={[styles.progressoDot, { backgroundColor: corPrincipal }]} />

            <View style={[styles.progressoDot, { backgroundColor: corPrincipal }]} />

            <View style={[styles.progressoDot, { backgroundColor: corPrincipal }]} />

          </View>

          <View style={styles.headerLogo}>
            <Image source={require('../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" />
          </View>

          <TouchableOpacity onPress={saltar} activeOpacity={0.7}>

            <Text style={styles.saltarTexto}>Saltar</Text>

          </TouchableOpacity>

        </View>



        <ScrollView

          showsVerticalScrollIndicator={false}

          contentContainerStyle={styles.scrollContent}

        >

          <Animated.View

            style={[

              styles.content,

              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },

            ]}

          >

            {/* Badge sucesso */}

            <View style={styles.sucessoBadge}>

              <View style={styles.sucessoBadgeIcone}>

                <Ionicons name="checkmark-circle" size={16} color={Colors.verde} />

              </View>

              <Text style={styles.sucessoBadgeTexto}>Email verificado</Text>

            </View>



            {/* Título */}

            <Text style={styles.titulo}>Falta pouco!</Text>

            <Text style={styles.subtitulo}>

              Adiciona uma foto para{'\n'}completares o teu perfil

            </Text>



            {/* Foto container com animação */}

            <View style={styles.fotoWrapper}>

              {/* Círculos decorativos por trás */}

              <Animated.View

                style={[

                  styles.circuloDecorativo,

                  styles.circuloExterno,

                  { borderColor: `${corPrincipal}20`, transform: [{ scale: pulseAnim }] },

                ]}

              />

              <View style={[styles.circuloDecorativo, styles.circuloMedio, { borderColor: `${corPrincipal}30` }]} />



              {/* Foto principal */}

              <TouchableOpacity

                style={styles.fotoContainer}

                onPress={() => setModalVisivel(true)}

                activeOpacity={0.9}

              >

                {foto ? (

                  <>

                    <Image source={{ uri: foto }} style={styles.fotoImagem} />

                    <LinearGradient

                      colors={['transparent', 'rgba(0,0,0,0.5)']}

                      style={styles.fotoOverlay}

                    />

                    <View style={styles.fotoEditar}>

                      <Ionicons name="camera" size={16} color={Colors.branco} />

                      <Text style={styles.fotoEditarTexto}>Alterar</Text>

                    </View>

                  </>

                ) : (

                  <LinearGradient

                    colors={[`${corPrincipal}10`, `${corPrincipal}05`]}

                    style={styles.fotoPlaceholder}

                    start={{ x: 0, y: 0 }}

                    end={{ x: 1, y: 1 }}

                  >

                    <View style={[styles.fotoPlaceholderIcone, { backgroundColor: `${corPrincipal}15` }]}>

                      <MaterialCommunityIcons name="camera-plus" size={40} color={corPrincipal} />

                    </View>

                    <Text style={[styles.fotoPlaceholderTexto, { color: corPrincipal }]}>

                      Toca para adicionar

                    </Text>

                  </LinearGradient>

                )}

              </TouchableOpacity>



              {/* Botão remover flutuante */}

              {foto && (

                <TouchableOpacity

                  style={styles.removerBotao}

                  onPress={removerFoto}

                  activeOpacity={0.85}

                >

                  <Ionicons name="close" size={16} color={Colors.branco} />

                </TouchableOpacity>

              )}

            </View>



            {/* Benefícios */}

            <View style={styles.beneficios}>

              <Text style={styles.beneficiosTitulo}>Porquê adicionar foto?</Text>



              <BeneficioItem

                icone="trending-up"

                cor={corPrincipal}

                titulo="5x mais contactos"

                descricao="Perfis com foto recebem muito mais interacções"

              />



              <BeneficioItem

                icone="shield-checkmark"

                cor={Colors.verde}

                titulo="Aumenta confiança"

                descricao="As pessoas confiam mais em perfis com fotos reais"

              />



              <BeneficioItem

                icone="checkmark-done-circle"

                cor={Colors.premium}

                titulo="Selo de verificado"

                descricao={

                  isAnunciante

                    ? 'Necessário para receberes o selo azul de anunciante verificado'

                    : 'Melhora a tua reputação na comunidade'

                }

              />

            </View>

          </Animated.View>

        </ScrollView>



        {/* Footer */}

        <View style={styles.footer}>

          <TouchableOpacity

            style={[

              styles.botaoPrincipal,

              (!foto || loading) && { opacity: 0.5 },

            ]}

            onPress={continuar}

            disabled={!foto || loading}

            activeOpacity={0.9}

          >

            <LinearGradient

              colors={gradiente}

              style={styles.botaoPrincipalGradient}

              start={{ x: 0, y: 0 }}

              end={{ x: 1, y: 0 }}

            >

              {loading ? (

                <Text style={styles.botaoPrincipalText}>A entrar...</Text>

              ) : (

                <>

                  <Text style={styles.botaoPrincipalText}>

                    {foto ? 'Continuar' : 'Adiciona uma foto para continuar'}

                  </Text>

                  {foto && <Ionicons name="arrow-forward" size={20} color={Colors.branco} />}

                </>

              )}

            </LinearGradient>

          </TouchableOpacity>



          <TouchableOpacity

            style={styles.saltarSecundario}

            onPress={saltar}

            activeOpacity={0.7}

          >

            <Text style={styles.saltarSecundarioTexto}>

              Adicionar depois nas definições

            </Text>

          </TouchableOpacity>

        </View>



        {/* Modal escolha */}

        <Modal

          visible={modalVisivel}

          transparent

          animationType="fade"

          onRequestClose={() => setModalVisivel(false)}

        >

          <Pressable

            style={styles.modalOverlay}

            onPress={() => setModalVisivel(false)}

          >

            <Pressable style={styles.modalContent}>

              <View style={styles.modalHandle} />

              <Text style={styles.modalTitulo}>Adicionar foto</Text>

              <Text style={styles.modalSubtitulo}>Como queres adicionar a tua foto?</Text>



              <TouchableOpacity

                style={styles.modalOpcao}

                onPress={tirarFoto}

                activeOpacity={0.7}

              >

                <View style={[styles.modalOpcaoIcone, { backgroundColor: `${corPrincipal}15` }]}>

                  <Ionicons name="camera" size={24} color={corPrincipal} />

                </View>

                <View style={styles.modalOpcaoInfo}>

                  <Text style={styles.modalOpcaoTitulo}>Tirar foto</Text>

                  <Text style={styles.modalOpcaoDescricao}>Usar câmara do telemóvel</Text>

                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />

              </TouchableOpacity>



              <TouchableOpacity

                style={styles.modalOpcao}

                onPress={escolherGaleria}

                activeOpacity={0.7}

              >

                <View style={[styles.modalOpcaoIcone, { backgroundColor: `${corPrincipal}15` }]}>

                  <Ionicons name="images" size={24} color={corPrincipal} />

                </View>

                <View style={styles.modalOpcaoInfo}>

                  <Text style={styles.modalOpcaoTitulo}>Galeria</Text>

                  <Text style={styles.modalOpcaoDescricao}>Escolher foto existente</Text>

                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />

              </TouchableOpacity>



              <TouchableOpacity

                style={styles.modalCancelar}

                onPress={() => setModalVisivel(false)}

                activeOpacity={0.7}

              >

                <Text style={styles.modalCancelarTexto}>Cancelar</Text>

              </TouchableOpacity>

            </Pressable>

          </Pressable>

        </Modal>

      </SafeAreaView>

    </View>

  );

}



function BeneficioItem({ icone, cor, titulo, descricao }: any) {

  return (

    <View style={styles.beneficio}>

      <View style={[styles.beneficioIcone, { backgroundColor: `${cor}15` }]}>

        <Ionicons name={icone} size={20} color={cor} />

      </View>

      <View style={styles.beneficioConteudo}>

        <Text style={styles.beneficioTitulo}>{titulo}</Text>

        <Text style={styles.beneficioDescricao}>{descricao}</Text>

      </View>

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

    paddingHorizontal: Spacing.lg,

    paddingVertical: Spacing.md,

  },

  headerProgresso: {

    flexDirection: 'row',

    gap: 6,

    alignItems: 'center',

  },

  progressoDot: {

    width: 24,

    height: 8,

    borderRadius: 4,

  },

  saltarTexto: {

    ...Typography.bodyBold,

    color: Colors.textoSecundario,

  },

  scrollContent: {

    paddingBottom: Spacing.md,

  },

  content: {

    alignItems: 'center',

    padding: Spacing.lg,

  },



  // Sucesso badge

  sucessoBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(76, 175, 80, 0.1)',

    paddingHorizontal: Spacing.md,

    paddingVertical: 6,

    borderRadius: Radius.full,

    gap: 6,

    marginBottom: Spacing.md,

    borderWidth: 1,

    borderColor: 'rgba(76, 175, 80, 0.25)',

  },

  sucessoBadgeIcone: {

    width: 16,

    height: 16,

    justifyContent: 'center',

    alignItems: 'center',

  },

  sucessoBadgeTexto: {

    ...Typography.captionBold,

    color: Colors.verde,

    letterSpacing: 0.3,

  },



  // Título

  titulo: {

    ...Typography.displayLG,

    color: Colors.textoPrincipal,

    textAlign: 'center',

    marginBottom: Spacing.sm,

  },

  subtitulo: {

    ...Typography.bodyLarge,

    color: Colors.textoSecundario,

    textAlign: 'center',

    lineHeight: 24,

    marginBottom: Spacing.xl,

  },



  // Foto

  fotoWrapper: {

    width: 240,

    height: 240,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: Spacing.xl,

    position: 'relative',

  },

  circuloDecorativo: {

    position: 'absolute',

    borderRadius: 999,

    borderWidth: 1.5,

  },

  circuloExterno: {

    width: 240,

    height: 240,

  },

  circuloMedio: {

    width: 210,

    height: 210,

  },

  fotoContainer: {

    width: 180,

    height: 180,

    borderRadius: 90,

    overflow: 'hidden',

    ...Sombras.lg,

  },

  fotoImagem: {

    width: 180,

    height: 180,

    borderRadius: 90,

  },

  fotoOverlay: {

    position: 'absolute',

    bottom: 0,

    left: 0,

    right: 0,

    height: '40%',

    borderBottomLeftRadius: 90,

    borderBottomRightRadius: 90,

  },

  fotoEditar: {

    position: 'absolute',

    bottom: 20,

    alignSelf: 'center',

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(0, 0, 0, 0.6)',

    paddingHorizontal: Spacing.md,

    paddingVertical: 6,

    borderRadius: Radius.full,

    gap: 6,

  },

  fotoEditarTexto: {

    ...Typography.captionBold,

    color: Colors.branco,

  },

  fotoPlaceholder: {

    width: 180,

    height: 180,

    borderRadius: 90,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 2,

    borderStyle: 'dashed',

    borderColor: 'rgba(33, 150, 243, 0.3)',

    gap: Spacing.sm,

  },

  fotoPlaceholderIcone: {

    width: 70,

    height: 70,

    borderRadius: 35,

    justifyContent: 'center',

    alignItems: 'center',

  },

  fotoPlaceholderTexto: {

    ...Typography.bodyBold,

    fontSize: 13,

  },

  removerBotao: {

    position: 'absolute',

    top: 25,

    right: 25,

    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: Colors.erro,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 3,

    borderColor: Colors.branco,

    ...Sombras.md,

  },



  // Benefícios

  beneficios: {

    width: '100%',

    gap: Spacing.sm,

  },

  beneficiosTitulo: {

    ...Typography.h3,

    color: Colors.textoPrincipal,

    marginBottom: Spacing.xs,

  },

  beneficio: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: Colors.fundoSuave,

    padding: Spacing.md,

    borderRadius: Radius.lg,

    gap: Spacing.md,

  },

  beneficioIcone: {

    width: 40,

    height: 40,

    borderRadius: 12,

    justifyContent: 'center',

    alignItems: 'center',

  },

  beneficioConteudo: {

    flex: 1,

  },

  beneficioTitulo: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

    marginBottom: 2,

  },

  beneficioDescricao: {

    ...Typography.bodySmall,

    color: Colors.textoSecundario,

    lineHeight: 18,

  },



  // Footer

  footer: {

    padding: Spacing.lg,

    borderTopWidth: 1,

    borderTopColor: Colors.bordaSubtil,

    backgroundColor: Colors.branco,

    gap: Spacing.sm,

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

  saltarSecundario: {

    padding: Spacing.sm,

    alignItems: 'center',

  },

  saltarSecundarioTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textDecorationLine: 'underline',

  },



  // Modal

  modalOverlay: {

    flex: 1,

    backgroundColor: 'rgba(0, 0, 0, 0.5)',

    justifyContent: 'flex-end',

  },

  modalContent: {

    backgroundColor: Colors.branco,

    borderTopLeftRadius: Radius.xxl,

    borderTopRightRadius: Radius.xxl,

    padding: Spacing.lg,

    paddingBottom: Spacing.xl,

  },

  modalHandle: {

    width: 40,

    height: 4,

    borderRadius: 2,

    backgroundColor: Colors.bordaMedia,

    alignSelf: 'center',

    marginBottom: Spacing.md,

  },

  modalTitulo: {

    ...Typography.h2,

    color: Colors.textoPrincipal,

    textAlign: 'center',

    marginBottom: 4,

  },

  modalSubtitulo: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textAlign: 'center',

    marginBottom: Spacing.lg,

  },

  modalOpcao: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: Colors.fundoSuave,

    padding: Spacing.md,

    borderRadius: Radius.lg,

    marginBottom: Spacing.sm,

    gap: Spacing.md,

  },

  modalOpcaoIcone: {

    width: 48,

    height: 48,

    borderRadius: 16,

    justifyContent: 'center',

    alignItems: 'center',

  },

  modalOpcaoInfo: {

    flex: 1,

  },

  modalOpcaoTitulo: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

  },

  modalOpcaoDescricao: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    marginTop: 2,

  },

  modalCancelar: {

    padding: Spacing.md,

    alignItems: 'center',

    marginTop: Spacing.sm,

  },

  modalCancelarTexto: {

    ...Typography.button,

    color: Colors.textoSecundario,

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