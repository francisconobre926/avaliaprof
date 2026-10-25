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

} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors, Sombras } from '../../src/theme/colors';

import { Spacing, Typography, Radius } from '../../src/theme/typography';



export default function VerificarScreen() {

  const router = useRouter();

  const { email, papel, temFoto } = useLocalSearchParams<{

    email: string;

    papel: 'procurador' | 'anunciante';

    temFoto: string;

  }>();



  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);

  const [loading, setLoading] = useState(false);

  const [reenviarLoading, setReenviarLoading] = useState(false);

  const [tempoRestante, setTempoRestante] = useState(60);

  const [erro, setErro] = useState(false);



  const inputRefs = useRef<Array<TextInput | null>>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const successAnim = useRef(new Animated.Value(0)).current;



  const isAnunciante = papel === 'anunciante';

  const corPrincipal = isAnunciante ? '#FF7900' : '#0B2E59';

  const gradiente = isAnunciante ? ['#FF7900', '#E96500'] as const : ['#0B2E59', '#174A7E'] as const;



  useEffect(() => {

    Animated.timing(fadeAnim, {

      toValue: 1,

      duration: 600,

      useNativeDriver: true,

    }).start();



    // Focus primeiro input automaticamente

    setTimeout(() => {

      inputRefs.current[0]?.focus();

    }, 500);

  }, []);



  // Timer para reenviar

  useEffect(() => {

    if (tempoRestante > 0) {

      const timer = setTimeout(() => setTempoRestante(tempoRestante - 1), 1000);

      return () => clearTimeout(timer);

    }

  }, [tempoRestante]);



  const handleMudarCodigo = (valor: string, index: number) => {

    // Só aceita números

    if (valor && !/^\d$/.test(valor)) return;



    const novoCodigo = [...codigo];

    novoCodigo[index] = valor;

    setCodigo(novoCodigo);

    setErro(false);



    // Avançar para próximo input

    if (valor && index < 5) {

      inputRefs.current[index + 1]?.focus();

    }



    // Se completou os 6 dígitos, verificar automaticamente

    if (index === 5 && valor) {

      const codigoCompleto = novoCodigo.join('');

      if (codigoCompleto.length === 6) {

        setTimeout(() => verificarCodigo(codigoCompleto), 200);

      }

    }

  };



  const handleKeyPress = (e: any, index: number) => {

    // Backspace vai para input anterior se actual vazio

    if (e.nativeEvent.key === 'Backspace' && !codigo[index] && index > 0) {

      inputRefs.current[index - 1]?.focus();

    }

  };



  const verificarCodigo = (codigoCompleto?: string) => {

    const cod = codigoCompleto || codigo.join('');



    if (cod.length !== 6) {

      Alert.alert('Código incompleto', 'Introduz os 6 dígitos');

      return;

    }



    setLoading(true);



    // Simular verificação (aceita qualquer código de 6 dígitos)

    setTimeout(() => {

      setLoading(false);



      // Se código = "000000" simula erro (para demo)

      if (cod === '000000') {

        setErro(true);

        shake();

        return;

      }



      // Animação de sucesso

      Animated.spring(successAnim, {

        toValue: 1,

        tension: 20,

        friction: 6,

        useNativeDriver: true,

      }).start();



      // Se não tem foto, vai para ecrã de sugestão de foto

      // Se tem foto, vai direto para a app

      setTimeout(() => {

        if (temFoto === 'true') {

          router.replace(isAnunciante ? '/(anunciante)' : '/(procurador)');

        } else {

          router.replace({

            pathname: '/auth/adicionar-foto',

            params: { papel: papel || 'procurador' },

          });

        }

      }, 1200);

    }, 1500);

  };



  const shake = () => {

    Animated.sequence([

      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),

      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),

      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),

      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),

    ]).start();



    // Limpar código após erro

    setTimeout(() => {

      setCodigo(['', '', '', '', '', '']);

      inputRefs.current[0]?.focus();

    }, 800);

  };



  const reenviarCodigo = () => {

    setReenviarLoading(true);

    setTimeout(() => {

      setReenviarLoading(false);

      setTempoRestante(60);

      Alert.alert('Código reenviado', `Enviámos um novo código para ${email}`);

    }, 1000);

  };



  const emailMascarado = email

    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'*'.repeat(b.length)}${c}`)

    : '';



  const codigoCompleto = codigo.every(d => d !== '');



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

          <View style={styles.headerProgresso}>

            <View style={[styles.progressoDot, { backgroundColor: corPrincipal }]} />

            <View style={[styles.progressoDot, { backgroundColor: corPrincipal }]} />

            <View style={[styles.progressoDot, styles.progressoDotAtual]} />

          </View>

          <View style={styles.headerLogo}>
              <Image source={require('../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" />
            </View>

        </View>



        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* Ícone hero */}

          <View style={styles.heroContainer}>

            <View style={styles.heroCirculoExterno}>

              <View style={[styles.heroCirculoMedio, { backgroundColor: `${corPrincipal}10` }]}>

                <View style={[styles.heroIcone, { backgroundColor: `${corPrincipal}20` }]}>

                  <MaterialCommunityIcons name="email-fast" size={50} color={corPrincipal} />

                </View>

              </View>

            </View>



            {/* Ícone de check quando sucesso */}

            <Animated.View

              style={[

                styles.successBadge,

                {

                  backgroundColor: Colors.verde,

                  transform: [{ scale: successAnim }],

                },

              ]}

            >

              <Ionicons name="checkmark" size={16} color={Colors.branco} />

            </Animated.View>

          </View>



          {/* Título */}

          <Text style={styles.titulo}>Verifica o teu email</Text>

          <Text style={styles.subtitulo}>

            Enviámos um código de 6 dígitos para{'\n'}

            <Text style={styles.emailDestaque}>{emailMascarado}</Text>

          </Text>



          {/* Inputs do código */}

          <Animated.View

            style={[

              styles.codigoContainer,

              { transform: [{ translateX: shakeAnim }] },

            ]}

          >

            {codigo.map((digito, index) => (

              <View

                key={index}

                style={[

                  styles.codigoInputWrapper,

                  digito && { borderColor: corPrincipal, backgroundColor: `${corPrincipal}08` },

                  erro && { borderColor: Colors.erro, backgroundColor: `${Colors.erro}08` },

                ]}

              >

                <TextInput

                  ref={(ref) => { inputRefs.current[index] = ref; }}

                  style={[

                    styles.codigoInput,

                    digito && { color: corPrincipal },

                    erro && { color: Colors.erro },

                  ]}

                  value={digito}

                  onChangeText={(valor) => handleMudarCodigo(valor, index)}

                  onKeyPress={(e) => handleKeyPress(e, index)}

                  keyboardType="number-pad"

                  maxLength={1}

                  editable={!loading}

                  selectTextOnFocus

                />

              </View>

            ))}

          </Animated.View>



          {/* Mensagem de erro */}

          {erro && (

            <View style={styles.erroContainer}>

              <Ionicons name="alert-circle" size={16} color={Colors.erro} />

              <Text style={styles.erroTexto}>Código inválido. Tenta novamente.</Text>

            </View>

          )}



          {/* Botão verificar */}

          <TouchableOpacity

            style={[

              styles.botaoPrincipal,

              (!codigoCompleto || loading) && { opacity: 0.5 },

            ]}

            onPress={() => verificarCodigo()}

            disabled={!codigoCompleto || loading}

            activeOpacity={0.9}

          >

            <LinearGradient

              colors={gradiente}

              style={styles.botaoPrincipalGradient}

              start={{ x: 0, y: 0 }}

              end={{ x: 1, y: 0 }}

            >

              {loading ? (

                <ActivityIndicator color={Colors.branco} size="small" />

              ) : (

                <>

                  <Ionicons name="shield-checkmark" size={20} color={Colors.branco} />

                  <Text style={styles.botaoPrincipalText}>Verificar código</Text>

                </>

              )}

            </LinearGradient>

          </TouchableOpacity>



          {/* Reenviar */}

          <View style={styles.reenviarContainer}>

            <Text style={styles.reenviarTexto}>Não recebeste o código? </Text>

            {tempoRestante > 0 ? (

              <Text style={styles.reenviarTempo}>

                Reenviar em {tempoRestante}s

              </Text>

            ) : (

              <TouchableOpacity

                onPress={reenviarCodigo}

                disabled={reenviarLoading}

                activeOpacity={0.7}

              >

                {reenviarLoading ? (

                  <ActivityIndicator size="small" color={corPrincipal} />

                ) : (

                  <Text style={[styles.reenviarLink, { color: corPrincipal }]}>

                    Reenviar

                  </Text>

                )}

              </TouchableOpacity>

            )}

          </View>



          {/* Info card */}

          <View style={styles.infoCard}>

            <View style={styles.infoIcone}>

              <Ionicons name="information-circle" size={20} color={Colors.azul} />

            </View>

            <View style={styles.infoConteudo}>

              <Text style={styles.infoTitulo}>Não encontras o email?</Text>

              <Text style={styles.infoTexto}>

                Verifica a caixa de spam ou lixo electrónico. Pode demorar alguns minutos a chegar.

              </Text>

            </View>

          </View>



          {/* Trocar email */}

          <TouchableOpacity

            style={styles.trocarEmail}

            onPress={() => router.back()}

            activeOpacity={0.7}

          >

            <Ionicons name="create-outline" size={14} color={Colors.textoSecundario} />

            <Text style={styles.trocarEmailTexto}>Introduzi email errado?</Text>

          </TouchableOpacity>

        </Animated.View>

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

  headerProgresso: {

    flexDirection: 'row',

    gap: 6,

    alignItems: 'center',

  },

  progressoDot: {

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: Colors.bordaSubtil,

  },

  progressoDotAtual: {

    width: 24,

    backgroundColor: Colors.textoPrincipal,

  },

  content: {

    flex: 1,

    padding: Spacing.lg,

    alignItems: 'center',

  },



  // Hero

  heroContainer: {

    marginTop: Spacing.lg,

    marginBottom: Spacing.xl,

    position: 'relative',

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

    justifyContent: 'center',

    alignItems: 'center',

  },

  heroIcone: {

    width: 80,

    height: 80,

    borderRadius: 40,

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.sm,

  },

  successBadge: {

    position: 'absolute',

    top: 5,

    right: 5,

    width: 32,

    height: 32,

    borderRadius: 16,

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 3,

    borderColor: Colors.branco,

    ...Sombras.md,

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

  emailDestaque: {

    color: Colors.textoPrincipal,

    fontWeight: '700',

  },



  // Código

  codigoContainer: {

    flexDirection: 'row',

    gap: Spacing.sm,

    marginBottom: Spacing.lg,

  },

  codigoInputWrapper: {

    width: 48,

    height: 60,

    borderRadius: Radius.md,

    backgroundColor: Colors.fundoInput,

    borderWidth: 2,

    borderColor: 'transparent',

    justifyContent: 'center',

    alignItems: 'center',

  },

  codigoInput: {

    width: '100%',

    height: '100%',

    textAlign: 'center',

    fontSize: 24,

    fontWeight: '800',

    color: Colors.textoPrincipal,

  },



  // Erro

  erroContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    marginBottom: Spacing.md,

  },

  erroTexto: {

    ...Typography.bodySmall,

    color: Colors.erro,

    fontWeight: '600',

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



  // Reenviar

  reenviarContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    marginBottom: Spacing.xl,

  },

  reenviarTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

  },

  reenviarTempo: {

    ...Typography.bodyBold,

    color: Colors.textoTerciario,

  },

  reenviarLink: {

    ...Typography.bodyBold,

  },



  // Info

  infoCard: {

    flexDirection: 'row',

    backgroundColor: 'rgba(33, 150, 243, 0.05)',

    borderRadius: Radius.lg,

    padding: Spacing.md,

    gap: Spacing.sm,

    borderLeftWidth: 4,

    borderLeftColor: Colors.azul,

    width: '100%',

    marginBottom: Spacing.md,

  },

  infoIcone: {

    marginTop: 2,

  },

  infoConteudo: {

    flex: 1,

  },

  infoTitulo: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

    marginBottom: 2,

  },

  infoTexto: {

    ...Typography.bodySmall,

    color: Colors.textoSecundario,

    lineHeight: 18,

  },



  // Trocar email

  trocarEmail: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    paddingVertical: Spacing.sm,

  },

  trocarEmailTexto: {

    ...Typography.bodySmall,

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