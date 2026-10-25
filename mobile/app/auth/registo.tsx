import { useState, useRef, useEffect } from 'react';

import {

  View,

  Text,
  Image,

  StyleSheet,

  TextInput,

  TouchableOpacity,

  ScrollView,

  Animated,

  StatusBar,

  KeyboardAvoidingView,

  Platform,

  ActivityIndicator,

  Alert,

  Modal,

  Pressable,

  FlatList,

} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { Colors, Sombras } from '../../src/theme/colors';

import { Spacing, Typography, Radius } from '../../src/theme/typography';

import { PROVINCIAS_MOCAMBIQUE, getDistritos } from '../../src/data/mocambique';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
export default function RegistoScreen() {

  const router = useRouter();

  const { papel } = useLocalSearchParams<{ papel: 'procurador' | 'anunciante' }>();

  // Campos identificação

  const [nome, setNome] = useState('');

  // Contacto

  const [email, setEmail] = useState('');

  const [telefone, setTelefone] = useState('');

  // Localização

  const [provincia, setProvincia] = useState('');

  const [distrito, setDistrito] = useState('');

  const [bairro, setBairro] = useState('');

  const [modalProvinciaVisivel, setModalProvinciaVisivel] = useState(false);

  const [modalDistritoVisivel, setModalDistritoVisivel] = useState(false);

  // Segurança

  const [password, setPassword] = useState('');

  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // Termos e loading

  const [aceitaTermos, setAceitaTermos] = useState(false);

  const [loading, setLoading] = useState(false);

  const [campoFocado, setCampoFocado] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(30)).current;

  const progressoAnim = useRef(new Animated.Value(0)).current;

  const isAnunciante = papel === 'anunciante';

  const corPrincipal = isAnunciante ? '#E8760A' : '#16202E';

  const gradiente = isAnunciante ? ['#E8760A', '#E96500'] as const : ['#16202E', '#174A7E'] as const;

  // Calcular progresso baseado nos campos preenchidos

  const calcularProgresso = () => {

    let preenchidos = 0;

    const total = 8;

    if (nome) preenchidos++;

    if (email) preenchidos++;

    if (telefone) preenchidos++;

    if (provincia) preenchidos++;

    if (distrito) preenchidos++;

    if (bairro) preenchidos++;

    if (password) preenchidos++;

    if (aceitaTermos) preenchidos++;

    return (preenchidos / total) * 100;

  };

  const progresso = calcularProgresso();

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

    Animated.timing(progressoAnim, {

      toValue: progresso,

      duration: 300,

      useNativeDriver: false,

    }).start();

  }, [progresso]);

  // Quando muda província, limpar distrito

  useEffect(() => {

    setDistrito('');

  }, [provincia]);

  const forcaPassword = () => {

    if (password.length === 0) return { forca: 0, cor: Colors.bordaMedia, texto: '' };

    if (password.length < 6) return { forca: 1, cor: Colors.erro, texto: 'Fraca' };

    if (password.length < 10) return { forca: 2, cor: Colors.aviso, texto: 'Média' };

    return { forca: 3, cor: Colors.verde, texto: 'Forte' };

  };

  const validarEmail = (email: string) => {
    const emailNormalizado = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);
  };

  const handleRegisto = () => {

    if (!nome.trim() || !email.trim() || !telefone.trim() || !provincia || !distrito || !bairro || !password) {

      Alert.alert('Atenção', 'Preenche todos os campos obrigatórios');

      return;

    }

    const emailNormalizado = email.trim().toLowerCase();

    if (!validarEmail(emailNormalizado)) {

      Alert.alert('Email inválido', 'Introduz um email válido');

      return;

    }

    if (telefone.length < 9) {

      Alert.alert('Telefone inválido', 'Introduz um número de telefone válido (9 dígitos)');

      return;

    }

    if (password.length < 6) {

      Alert.alert('Password fraca', 'A password deve ter pelo menos 6 caracteres');

      return;

    }

    if (password !== confirmarPassword) {

      Alert.alert('Passwords diferentes', 'As passwords não coincidem');

      return;

    }

    if (!aceitaTermos) {

      Alert.alert('Termos', 'Deves aceitar os termos e política de privacidade');

      return;

    }

    setLoading(true);

    setTimeout(() => {

      setLoading(false);

      router.push({

        pathname: '/auth/verificar',

        params: { email: emailNormalizado, papel: papel || 'procurador', temFoto: 'false' },

      });

    }, 1500);

  };

  const forca = forcaPassword();

  const distritosDisponiveis = provincia ? getDistritos(provincia) : [];

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

          <View style={[styles.papelBadge, { backgroundColor: `${corPrincipal}15` }]}>

            <Icone

              name={isAnunciante ? 'home-account' : 'account-search'}

              size={12}

              color={corPrincipal}

            />

            <Text style={[styles.papelBadgeText, { color: corPrincipal }]}>

              {isAnunciante ? 'ANUNCIANTE' : 'PROCURADOR'}

            </Text>

          </View>

          <View style={styles.headerLogo}>
              <Image source={require('../../assets/logo.png')} style={styles.headerLogoImage} resizeMode="contain" />
            </View>

        </View>

        {/* Barra de progresso */}

        <View style={styles.progressoContainer}>

          <View style={styles.progressoTrack}>

            <Animated.View

              style={[

                styles.progressoFill,

                {

                  width: progressoAnim.interpolate({

                    inputRange: [0, 100],

                    outputRange: ['0%', '100%'],

                  }),

                },

              ]}

            >

              <LinearGradient

                colors={gradiente}

                style={StyleSheet.absoluteFill}

                start={{ x: 0, y: 0 }}

                end={{ x: 1, y: 0 }}

              />

            </Animated.View>

          </View>

          <Text style={styles.progressoTexto}>{Math.round(progresso)}% completo</Text>

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

            {/* Título */}

            <View style={styles.titulos}>

              <Text style={styles.titulo}>Criar conta</Text>

              <Text style={styles.subtitulo}>

                Preenche os teus dados para começares no GoHome

              </Text>

            </View>

            {/* ============ SECÇÃO: IDENTIFICAÇÃO ============ */}

            <SeccaoHeader

              icone="person"

              titulo="Identificação"

              cor={corPrincipal}

              numero="1"

            />

            <View style={styles.seccaoCampos}>

              <CampoInput

                label="Nome completo"

                icone="person-outline"

                placeholder="Ex: Fernando Camunga"

                value={nome}

                onChangeText={setNome}

                focado={campoFocado === 'nome'}

                onFocus={() => setCampoFocado('nome')}

                onBlur={() => setCampoFocado(null)}

                corPrincipal={corPrincipal}

              />

            </View>

            {/* ============ SECÇÃO: CONTACTO ============ */}

            <SeccaoHeader

              icone="mail"

              titulo="Contacto"

              cor={corPrincipal}

              numero="2"

            />

            <View style={styles.seccaoCampos}>

              <CampoInput

                label="Email"

                icone="mail-outline"

                placeholder="teu.email@exemplo.com"

                value={email}

                onChangeText={setEmail}

                focado={campoFocado === 'email'}

                onFocus={() => setCampoFocado('email')}

                onBlur={() => setCampoFocado(null)}

                corPrincipal={corPrincipal}

                keyboardType="email-address"

                autoCapitalize="none"

              />

              {/* Telefone */}

              <View style={styles.campoContainer}>

                <Text style={styles.campoLabel}>Telefone</Text>

                <View style={[

                  styles.telefoneWrapper,

                  campoFocado === 'telefone' && { borderColor: corPrincipal, borderWidth: 2 },

                ]}>

                  <View style={styles.telefonePrefixo}>

                    <Text style={styles.telefonePrefixoBandeira}>🇲🇿</Text>

                    <Text style={styles.telefonePrefixoTexto}>+258</Text>

                  </View>

                  <TextInput

                    style={styles.telefoneInput}

                    placeholder="84 000 0000"

                    placeholderTextColor={Colors.textoTerciario}

                    value={telefone}

                    onChangeText={setTelefone}

                    keyboardType="phone-pad"

                    maxLength={9}

                    onFocus={() => setCampoFocado('telefone')}

                    onBlur={() => setCampoFocado(null)}

                  />

                </View>

              </View>

            </View>

            {/* ============ SECÇÃO: LOCALIZAÇÃO ============ */}

            <SeccaoHeader

              icone="location"

              titulo="Localização"

              cor={corPrincipal}

              numero="3"

            />

            <View style={styles.seccaoCampos}>

              {/* Província */}

              <View style={styles.campoContainer}>

                <Text style={styles.campoLabel}>Província</Text>

                <TouchableOpacity

                  style={[

                    styles.selectorWrapper,

                    provincia && { borderColor: corPrincipal, borderWidth: 2 },

                  ]}

                  onPress={() => setModalProvinciaVisivel(true)}

                  activeOpacity={0.8}

                >

                  <Ionicons name="map-outline" size={20} color={Colors.textoSecundario} />

                  <Text style={[

                    styles.selectorText,

                    !provincia && { color: Colors.textoTerciario },

                  ]}>

                    {provincia || 'Selecciona a província'}

                  </Text>

                  <Ionicons name="chevron-down" size={20} color={Colors.textoSecundario} />

                </TouchableOpacity>

              </View>

              {/* Distrito */}

              <View style={styles.campoContainer}>

                <Text style={styles.campoLabel}>Distrito</Text>

                <TouchableOpacity

                  style={[

                    styles.selectorWrapper,

                    !provincia && { opacity: 0.5 },

                    distrito && { borderColor: corPrincipal, borderWidth: 2 },

                  ]}

                  onPress={() => provincia && setModalDistritoVisivel(true)}

                  disabled={!provincia}

                  activeOpacity={0.8}

                >

                  <Icone name="map-marker" size={20} color={Colors.textoSecundario} />

                  <Text style={[

                    styles.selectorText,

                    !distrito && { color: Colors.textoTerciario },

                  ]}>

                    {distrito || (provincia ? 'Selecciona o distrito' : 'Escolhe província primeiro')}

                  </Text>

                  <Ionicons name="chevron-down" size={20} color={Colors.textoSecundario} />

                </TouchableOpacity>

              </View>

              {/* Bairro */}

              <CampoInput

                label="Bairro"

                icone="home-outline"

                placeholder="Ex: Macúti, Ponta-Gêa..."

                value={bairro}

                onChangeText={setBairro}

                focado={campoFocado === 'bairro'}

                onFocus={() => setCampoFocado('bairro')}

                onBlur={() => setCampoFocado(null)}

                corPrincipal={corPrincipal}

              />

              {/* Dica */}

              <View style={styles.dicaContainer}>

                <Ionicons name="information-circle" size={14} color={Colors.textoSecundario} />

                <Text style={styles.dicaTexto}>

                  Podes alterar a tua localização actual quando viajares

                </Text>

              </View>

            </View>

            {/* ============ SECÇÃO: SEGURANÇA ============ */}

            <SeccaoHeader

              icone="lock-closed"

              titulo="Segurança"

              cor={corPrincipal}

              numero="4"

            />

            <View style={styles.seccaoCampos}>

              {/* Password */}

              <View style={styles.campoContainer}>

                <Text style={styles.campoLabel}>Password</Text>

                <View style={[

                  styles.inputWrapper,

                  campoFocado === 'password' && { borderColor: corPrincipal, borderWidth: 2 },

                ]}>

                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textoSecundario} />

                  <TextInput

                    style={styles.input}

                    placeholder="Mínimo 6 caracteres"

                    placeholderTextColor={Colors.textoTerciario}

                    value={password}

                    onChangeText={setPassword}

                    secureTextEntry={!mostrarPassword}

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

                {password.length > 0 && (

                  <View style={styles.forcaContainer}>

                    <View style={styles.forcaBars}>

                      {[1, 2, 3].map((n) => (

                        <View

                          key={n}

                          style={[

                            styles.forcaBar,

                            { backgroundColor: forca.forca >= n ? forca.cor : Colors.bordaSubtil },

                          ]}

                        />

                      ))}

                    </View>

                    <Text style={[styles.forcaTexto, { color: forca.cor }]}>{forca.texto}</Text>

                  </View>

                )}

              </View>

              {/* Confirmar Password */}

              <View style={styles.campoContainer}>

                <Text style={styles.campoLabel}>Confirmar password</Text>

                <View style={[

                  styles.inputWrapper,

                  campoFocado === 'confirmar' && { borderColor: corPrincipal, borderWidth: 2 },

                  confirmarPassword.length > 0 && password !== confirmarPassword && { borderColor: Colors.erro, borderWidth: 2 },

                  confirmarPassword.length > 0 && password === confirmarPassword && { borderColor: Colors.verde, borderWidth: 2 },

                ]}>

                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textoSecundario} />

                  <TextInput

                    style={styles.input}

                    placeholder="Repete a password"

                    placeholderTextColor={Colors.textoTerciario}

                    value={confirmarPassword}

                    onChangeText={setConfirmarPassword}

                    secureTextEntry={!mostrarConfirmar}

                    onFocus={() => setCampoFocado('confirmar')}

                    onBlur={() => setCampoFocado(null)}

                  />

                  {confirmarPassword.length > 0 && password === confirmarPassword ? (

                    <Ionicons name="checkmark-circle" size={20} color={Colors.verde} />

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

              </View>

            </View>

            {/* Termos */}

            <TouchableOpacity

              style={styles.termosContainer}

              onPress={() => setAceitaTermos(!aceitaTermos)}

              activeOpacity={0.7}

            >

              <View style={[

                styles.checkbox,

                aceitaTermos && { backgroundColor: corPrincipal, borderColor: corPrincipal },

              ]}>

                {aceitaTermos && (

                  <Ionicons name="checkmark" size={14} color={Colors.branco} />

                )}

              </View>

              <Text style={styles.termosTexto}>

                Aceito os <Text style={[styles.termosLink, { color: corPrincipal }]}>Termos de Uso</Text> e a{' '}

                <Text style={[styles.termosLink, { color: corPrincipal }]}>Política de Privacidade</Text>

              </Text>

            </TouchableOpacity>

            {/* Botão criar conta */}

            <TouchableOpacity

              style={[styles.botaoPrincipal, loading && { opacity: 0.7 }]}

              onPress={handleRegisto}

              disabled={loading}

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

                    <Text style={styles.botaoPrincipalText}>Criar minha conta</Text>

                    <Ionicons name="arrow-forward" size={20} color={Colors.branco} />

                  </>

                )}

              </LinearGradient>

            </TouchableOpacity>

            {/* Já tenho conta */}

            <View style={styles.jaTemConta}>

              <Text style={styles.jaTemContaTexto}>Já tens conta?</Text>

              <TouchableOpacity

                onPress={() => router.replace({ pathname: '/auth/login', params: { papel } })}

                activeOpacity={0.7}

              >

                <Text style={[styles.jaTemContaLink, { color: corPrincipal }]}>Entrar</Text>

              </TouchableOpacity>

            </View>

          </Animated.View>

        </ScrollView>

        {/* Modal Província */}

        <ModalSelector

          visivel={modalProvinciaVisivel}

          titulo="Selecciona a província"

          subtitulo="Onde vives em Moçambique?"

          opcoes={PROVINCIAS_MOCAMBIQUE.map(p => ({ label: p.nome, value: p.nome, descricao: `Capital: ${p.capital}` }))}

          valorSeleccionado={provincia}

          onSeleccionar={(valor: string) => {

            setProvincia(valor);

            setModalProvinciaVisivel(false);

          }}

          onFechar={() => setModalProvinciaVisivel(false)}

          corPrincipal={corPrincipal}

          icone="map"

        />

        {/* Modal Distrito */}

        <ModalSelector

          visivel={modalDistritoVisivel}

          titulo="Selecciona o distrito"

          subtitulo={`Distritos de ${provincia}`}

          opcoes={distritosDisponiveis.map(d => ({ label: d, value: d }))}

          valorSeleccionado={distrito}

          onSeleccionar={(valor: string) => {

            setDistrito(valor);

            setModalDistritoVisivel(false);

          }}

          onFechar={() => setModalDistritoVisivel(false)}

          corPrincipal={corPrincipal}

          icone="map-marker"

        />

      </SafeAreaView>

    </KeyboardAvoidingView>

  );

}

// ============ COMPONENTES ============

function SeccaoHeader({ icone, titulo, cor, numero }: any) {

  return (

    <View style={styles.seccaoHeader}>

      <View style={[styles.seccaoNumero, { backgroundColor: cor }]}>

        <Text style={styles.seccaoNumeroTexto}>{numero}</Text>

      </View>

      <View style={[styles.seccaoIconeContainer, { backgroundColor: `${cor}15` }]}>

        <Ionicons name={icone} size={18} color={cor} />

      </View>

      <Text style={styles.seccaoTitulo}>{titulo}</Text>

      <View style={styles.seccaoLinha} />

    </View>

  );

}

function CampoInput({ label, icone, placeholder, value, onChangeText, focado, onFocus, onBlur, corPrincipal, keyboardType, autoCapitalize }: any) {

  return (

    <View style={styles.campoContainer}>

      <Text style={styles.campoLabel}>{label}</Text>

      <View style={[

        styles.inputWrapper,

        focado && { borderColor: corPrincipal, borderWidth: 2 },

      ]}>

        <Ionicons name={icone} size={20} color={Colors.textoSecundario} />

        <TextInput

          style={styles.input}

          placeholder={placeholder}

          placeholderTextColor={Colors.textoTerciario}

          value={value}

          onChangeText={onChangeText}

          onFocus={onFocus}

          onBlur={onBlur}

          keyboardType={keyboardType || 'default'}

          autoCapitalize={autoCapitalize || 'sentences'}

        />

      </View>

    </View>

  );

}

function ModalSelector({ visivel, titulo, subtitulo, opcoes, valorSeleccionado, onSeleccionar, onFechar, corPrincipal, icone }: any) {

  return (

    <Modal

      visible={visivel}

      transparent

      animationType="slide"

      onRequestClose={onFechar}

    >

      <View style={styles.modalOverlay}>

        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />

        <View style={styles.modalContent}>

          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>

            <View style={[styles.modalIconeContainer, { backgroundColor: `${corPrincipal}15` }]}>

              <Icone name={icone} size={24} color={corPrincipal} />

            </View>

            <View style={{ flex: 1 }}>

              <Text style={styles.modalTitulo}>{titulo}</Text>

              <Text style={styles.modalSubtitulo}>{subtitulo}</Text>

            </View>

            <TouchableOpacity onPress={onFechar} style={styles.modalFechar}>

              <Ionicons name="close" size={20} color={Colors.textoSecundario} />

            </TouchableOpacity>

          </View>

          <FlatList

            data={opcoes}

            keyExtractor={(item) => item.value}

            showsVerticalScrollIndicator={false}

            renderItem={({ item }) => {

              const seleccionado = valorSeleccionado === item.value;

              return (

                <TouchableOpacity

                  style={[

                    styles.modalOpcao,

                    seleccionado && { backgroundColor: `${corPrincipal}10`, borderColor: corPrincipal },

                  ]}

                  onPress={() => onSeleccionar(item.value)}

                  activeOpacity={0.7}

                >

                  <View style={styles.modalOpcaoInfo}>

                    <Text style={[

                      styles.modalOpcaoTitulo,

                      seleccionado && { color: corPrincipal, fontFamily: Fonte.corpoSemi },

                    ]}>

                      {item.label}

                    </Text>

                    {item.descricao && (

                      <Text style={styles.modalOpcaoDescricao}>{item.descricao}</Text>

                    )}

                  </View>

                  {seleccionado && (

                    <View style={[styles.modalOpcaoCheck, { backgroundColor: corPrincipal }]}>

                      <Ionicons name="checkmark" size={14} color={Colors.branco} />

                    </View>

                  )}

                </TouchableOpacity>

              );

            }}

            contentContainerStyle={{ paddingBottom: Spacing.xl }}

          />

        </View>

      </View>

    </Modal>

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

  },

  botaoVoltar: {

    width: 40,

    height: 40,

    borderRadius: 20,

    justifyContent: 'center',

    alignItems: 'center',

    backgroundColor: Colors.fundoSuave,

  },

  papelBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: Spacing.md,

    paddingVertical: 6,

    borderRadius: Radius.full,

    gap: 4,

  },

  papelBadgeText: {

    ...Typography.captionBold,

    letterSpacing: 0.5,

    fontSize: 10,

  },

  // Progresso

  progressoContainer: {

    paddingHorizontal: Spacing.lg,

    paddingBottom: Spacing.md,

    borderBottomWidth: 1,

    borderBottomColor: Colors.bordaSubtil,

  },

  progressoTrack: {

    height: 4,

    backgroundColor: Colors.fundoInput,

    borderRadius: 2,

    overflow: 'hidden',

    marginBottom: 4,

  },

  progressoFill: {

    height: '100%',

    borderRadius: 2,

  },

  progressoTexto: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    textAlign: 'right',

    fontFamily: Fonte.corpoSemi,

  },

  scrollContent: { paddingBottom: Spacing.xl },

  content: { padding: Spacing.lg },

  titulos: { marginBottom: Spacing.lg },

  titulo: {

    ...Typography.displayMD,

    color: Colors.textoPrincipal,

    marginBottom: Spacing.xs,

  },

  subtitulo: {

    ...Typography.body,

    color: Colors.textoSecundario,

    lineHeight: 22,

  },

  // Secções

  seccaoHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: Spacing.lg,

    marginBottom: Spacing.md,

    gap: Spacing.sm,

  },

  seccaoNumero: {

    width: 24,

    height: 24,

    borderRadius: 12,

    justifyContent: 'center',

    alignItems: 'center',

    ...Sombras.sm,

  },

  seccaoNumeroTexto: {

    color: Colors.branco,

    fontFamily: Fonte.corpoSemi,

    fontSize: 12,

  },

  seccaoIconeContainer: {

    width: 32,

    height: 32,

    borderRadius: 10,

    justifyContent: 'center',

    alignItems: 'center',

  },

  seccaoTitulo: {

    ...Typography.h4,

    color: Colors.textoPrincipal,

  },

  seccaoLinha: {

    flex: 1,

    height: 1,

    backgroundColor: Colors.bordaSubtil,

    marginLeft: Spacing.sm,

  },

  seccaoCampos: {

    gap: Spacing.md,

    marginBottom: Spacing.sm,

  },

  // Campos

  campoContainer: { gap: Spacing.xs },

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

  selectorWrapper: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: Colors.fundoInput,

    borderRadius: Radius.md,

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.md,

    gap: Spacing.sm,

    borderWidth: 1,

    borderColor: 'transparent',

    minHeight: 52,

  },

  selectorText: {

    flex: 1,

    ...Typography.body,

    color: Colors.textoPrincipal,

  },

  // Telefone

  telefoneWrapper: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: Colors.fundoInput,

    borderRadius: Radius.md,

    paddingHorizontal: 4,

    paddingVertical: 4,

    borderWidth: 1,

    borderColor: 'transparent',

    minHeight: 52,

  },

  telefonePrefixo: {

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: Colors.branco,

    paddingHorizontal: Spacing.md,

    paddingVertical: Spacing.sm,

    borderRadius: Radius.sm,

    gap: 6,

    borderRightWidth: 1,

    borderRightColor: Colors.bordaSubtil,

    marginRight: Spacing.sm,

  },

  telefonePrefixoBandeira: { fontFamily: Fonte.corpo, fontSize: 18 },

  telefonePrefixoTexto: {

    ...Typography.bodyBold,

    color: Colors.textoPrincipal,

  },

  telefoneInput: {

    flex: 1,

    ...Typography.body,

    color: Colors.textoPrincipal,

    padding: 0,

    paddingVertical: Platform.OS === 'android' ? Spacing.md : 0,

    letterSpacing: 1,

  },

  // Dica

  dicaContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    paddingHorizontal: 4,

  },

  dicaTexto: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    flex: 1,

    fontStyle: 'italic',

  },

  // Força

  forcaContainer: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: Spacing.xs,

    paddingHorizontal: 4,

  },

  forcaBars: {

    flexDirection: 'row',

    gap: 4,

    flex: 1,

    marginRight: Spacing.sm,

  },

  forcaBar: {

    flex: 1,

    height: 4,

    borderRadius: 2,

  },

  forcaTexto: {

    ...Typography.captionBold,

    fontSize: 11,

  },

  // Termos

  termosContainer: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: Spacing.sm,

    marginTop: Spacing.lg,

    marginBottom: Spacing.lg,

  },

  checkbox: {

    width: 20,

    height: 20,

    borderRadius: 4,

    borderWidth: 2,

    borderColor: Colors.bordaMedia,

    justifyContent: 'center',

    alignItems: 'center',

    marginTop: 2,

  },

  termosTexto: {

    flex: 1,

    ...Typography.bodySmall,

    color: Colors.textoSecundario,

    lineHeight: 18,

  },

  termosLink: {

    fontFamily: Fonte.corpoSemi,

  },

  // Botão

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

    paddingHorizontal: Spacing.lg,

    gap: Spacing.sm,

    minHeight: 56,

  },

  botaoPrincipalText: {

    ...Typography.buttonLarge,

    color: Colors.branco,

  },

  // Já tenho

  jaTemConta: {

    flexDirection: 'row',

    justifyContent: 'center',

    alignItems: 'center',

    marginTop: Spacing.xl,

    gap: 4,

  },

  jaTemContaTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

  },

  jaTemContaLink: {

    ...Typography.bodyBold,

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

    maxHeight: '75%',

  },

  modalHandle: {

    width: 40,

    height: 4,

    borderRadius: 2,

    backgroundColor: Colors.bordaMedia,

    alignSelf: 'center',

    marginBottom: Spacing.md,

  },

  modalHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: Spacing.lg,

    gap: Spacing.sm,

  },

  modalIconeContainer: {

    width: 44,

    height: 44,

    borderRadius: 14,

    justifyContent: 'center',

    alignItems: 'center',

  },

  modalTitulo: {

    ...Typography.h3,

    color: Colors.textoPrincipal,

  },

  modalSubtitulo: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    marginTop: 2,

  },

  modalFechar: {

    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: Colors.fundoSuave,

    justifyContent: 'center',

    alignItems: 'center',

  },

  modalOpcao: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: Spacing.md,

    borderRadius: Radius.md,

    marginBottom: Spacing.xs,

    borderWidth: 1,

    borderColor: 'transparent',

    backgroundColor: Colors.fundoSuave,

  },

  modalOpcaoInfo: {

    flex: 1,

  },

  modalOpcaoTitulo: {

    ...Typography.body,

    color: Colors.textoPrincipal,

    fontFamily: Fonte.corpoSemi,

  },

  modalOpcaoDescricao: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    marginTop: 2,

  },

  modalOpcaoCheck: {

    width: 24,

    height: 24,

    borderRadius: 12,

    justifyContent: 'center',

    alignItems: 'center',

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