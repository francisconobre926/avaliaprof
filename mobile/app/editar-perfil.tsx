import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Sombras } from '../src/theme/colors';
import { Spacing, Typography, Radius } from '../src/theme/typography';
import { PROVINCIAS_MOCAMBIQUE, getDistritos } from '../src/data/mocambique';
import { useUserStore } from '../src/store/userStore';

import { Fonte } from '../src/theme/fonts';
import Icone from '../src/components/Icone';
export default function EditarPerfilScreen() {
  const router = useRouter();

  const usuario = useUserStore(state => state.usuario);
  const actualizarPerfil = useUserStore(state => state.actualizarPerfil);
  const papel = useUserStore(state => state.papel);

  // Estados locais para edição
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [telefone, setTelefone] = useState(usuario?.telefone || '');
  const [foto, setFoto] = useState<string | null>(usuario?.foto || null);
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [bairro, setBairro] = useState('');

  // UI states
  const [campoFocado, setCampoFocado] = useState<string | null>(null);
  const [modalFotoVisivel, setModalFotoVisivel] = useState(false);
  const [modalProvinciaVisivel, setModalProvinciaVisivel] = useState(false);
  const [modalDistritoVisivel, setModalDistritoVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sucessoScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (sucesso) {
      Animated.spring(sucessoScale, {
        toValue: 1,
        tension: 20,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [sucesso]);

  // Detectar alterações
  const temAlteracoes = () => {
    if (!usuario) return false;
    return (
      nome !== usuario.nome ||
      email !== usuario.email ||
      telefone !== usuario.telefone ||
      foto !== usuario.foto ||
      provincia !== '' || distrito !== '' || bairro !== ''
    );
  };

  // Quando muda província, limpar distrito se não existir na nova
  useEffect(() => {
    if (provincia) {
      const distritosNovos = getDistritos(provincia);
      if (distrito && !distritosNovos.includes(distrito)) {
        setDistrito('');
      }
    }
  }, [provincia]);

  const voltar = () => {
    if (temAlteracoes()) {
      Alert.alert(
        'Alterações não guardadas',
        'Tens alterações não guardadas. Queres sair sem guardar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair sem guardar',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const validarEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const guardar = () => {
    // Validações
    if (!nome.trim()) {
      Alert.alert('Nome obrigatório', 'Introduz o teu nome');
      return;
    }
    if (!validarEmail(email)) {
      Alert.alert('Email inválido', 'Introduz um email válido');
      return;
    }
    if (telefone.length < 9) {
      Alert.alert('Telefone inválido', 'Introduz um número válido (9 dígitos)');
      return;
    }
    if (!provincia || !distrito || !bairro) {
      Alert.alert('Localização incompleta', 'Preenche província, distrito e bairro');
      return;
    }

    // Aviso se email mudou
    const emailMudou = email !== usuario?.email;
    if (emailMudou) {
      Alert.alert(
        'Alterar email',
        'Vais precisar verificar o novo email. Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sim, alterar',
            onPress: () => processarGuardar(true),
          },
        ]
      );
      return;
    }

    processarGuardar(false);
  };

  const processarGuardar = async (emailMudou: boolean) => {
    setLoading(true);

    try {
      // O userStore actual guarda nome, email, telefone e foto.
      await actualizarPerfil({
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        foto,
      });

      setLoading(false);
      setSucesso(true);

      // Auto-close após 1.5s
      setTimeout(() => {
        if (emailMudou) {
          router.replace({
            pathname: '/auth/verificar',
            params: { email, papel: papel || 'procurador', temFoto: foto ? 'true' : 'false' },
          });
        } else {
          router.back();
        }
      }, 1500);
    } catch (error) {
      setLoading(false);
      Alert.alert('Erro ao guardar', 'Não foi possível actualizar o perfil. Tenta novamente.');
    }
  };

  const tirarFoto = async () => {
    setModalFotoVisivel(false);
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
    setModalFotoVisivel(false);
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
    setModalFotoVisivel(false);
    Alert.alert(
      'Remover foto',
      'Tens a certeza?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => setFoto(null) },
      ]
    );
  };

  const inicialAvatar = nome.charAt(0).toUpperCase() || '?';
  const camposPerfil = [nome.trim(), email.trim(), telefone.trim(), foto].filter(Boolean).length;
  const perfilCompleto = Math.round((camposPerfil / 4) * 100);
  const distritosDisponiveis = provincia ? getDistritos(provincia) : [];

  // ============ ESTADO SUCESSO ============
  if (sucesso) {
    return (
      <View style={[styles.container, styles.sucessoWrapper]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#16202E', '#123F70']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[styles.sucessoContent, { transform: [{ scale: sucessoScale }] }]}>
          <View style={styles.sucessoIconeExterno}>
            <View style={styles.sucessoIconeMedio}>
              <View style={styles.sucessoIcone}>
                <Ionicons name="checkmark" size={60} color="#168C82" />
              </View>
            </View>
          </View>
          <Text style={styles.sucessoTitulo}>Perfil actualizado!</Text>
          <Text style={styles.sucessoSubtitulo}>As tuas alterações foram guardadas</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#16202E" />
      <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#16202E', '#123F70']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={voltar}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textoPrincipal} />
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Editar perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Barra de perfil completo */}
        <View style={styles.perfilCompletoContainer}>
          <View style={styles.perfilCompletoInfo}>
            <Icone name="account-check" size={14} color={Colors.azul} />
            <Text style={styles.perfilCompletoTexto}>Perfil {perfilCompleto}% completo</Text>
          </View>
          <View style={styles.perfilCompletoBar}>
            <View style={[styles.perfilCompletoFill, { width: `${perfilCompleto}%` }]}>
              <LinearGradient
                colors={['#E8760A', '#FF9A24']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>
        </LinearGradient>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Foto de perfil */}
          <View style={styles.fotoSeccao}>
            <View style={styles.fotoWrapper}>
              <View style={styles.fotoDecorativoExterno} />
              <View style={styles.fotoDecorativoMedio} />
              <TouchableOpacity
                style={styles.fotoContainer}
                onPress={() => setModalFotoVisivel(true)}
                activeOpacity={0.9}
              >
                {foto ? (
                  <Image source={{ uri: foto }} style={styles.fotoImagem} />
                ) : (
                  <LinearGradient
                    colors={Colors.gradientePrimario}
                    style={styles.fotoInicial}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.fotoInicialTexto}>{inicialAvatar}</Text>
                  </LinearGradient>
                )}
                <View style={styles.fotoEditBadge}>
                  <Ionicons name="camera" size={18} color={Colors.branco} />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.fotoLabel}>{nome || 'Sem nome'}</Text>
            <TouchableOpacity onPress={() => setModalFotoVisivel(true)} activeOpacity={0.7}>
              <Text style={styles.fotoLink}>
                {foto ? 'Alterar foto' : 'Adicionar foto'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SECÇÃO: Informações pessoais */}
          <SeccaoHeader icone="person" titulo="Informações pessoais" />

          <View style={styles.seccaoCampos}>
            {/* Nome */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Nome completo</Text>
              <View style={[
                styles.inputWrapper,
                campoFocado === 'nome' && { borderColor: '#E8760A', borderWidth: 1.5 },
              ]}>
                <Ionicons name="person-outline" size={20} color={Colors.textoSecundario} />
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Ex: Fernando Camunga"
                  placeholderTextColor={Colors.textoTerciario}
                  onFocus={() => setCampoFocado('nome')}
                  onBlur={() => setCampoFocado(null)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.campoContainer}>
              <View style={styles.campoLabelRow}>
                <Text style={styles.campoLabel}>Email</Text>

              </View>
              <View style={[
                styles.inputWrapper,
                campoFocado === 'email' && { borderColor: '#E8760A', borderWidth: 1.5 },
              ]}>
                <Ionicons name="mail-outline" size={20} color={Colors.textoSecundario} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="teu.email@exemplo.com"
                  placeholderTextColor={Colors.textoTerciario}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setCampoFocado('email')}
                  onBlur={() => setCampoFocado(null)}
                />
              </View>
              {email !== usuario?.email && (
                <View style={styles.avisoContainer}>
                  <Ionicons name="warning" size={12} color={Colors.aviso} />
                  <Text style={styles.avisoTexto}>
                    Vais precisar verificar o novo email
                  </Text>
                </View>
              )}
            </View>

            {/* Telefone */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Telefone</Text>
              <View style={[
                styles.telefoneWrapper,
                campoFocado === 'telefone' && { borderColor: '#E8760A', borderWidth: 1.5 },
              ]}>
                <View style={styles.telefonePrefixo}>
                  <Text style={styles.telefonePrefixoBandeira}>🇲🇿</Text>
                  <Text style={styles.telefonePrefixoTexto}>+258</Text>
                </View>
                <TextInput
                  style={styles.telefoneInput}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="84 000 0000"
                  placeholderTextColor={Colors.textoTerciario}
                  keyboardType="phone-pad"
                  maxLength={9}
                  onFocus={() => setCampoFocado('telefone')}
                  onBlur={() => setCampoFocado(null)}
                />
              </View>
            </View>
          </View>

          {/* SECÇÃO: Localização */}
          <SeccaoHeader icone="location" titulo="Localização de residência" />

          <View style={styles.seccaoCampos}>
            {/* Província */}
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Província</Text>
              <TouchableOpacity
                style={[
                  styles.selectorWrapper,
                  provincia && { borderColor: '#E8760A', borderWidth: 1.5 },
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
                  distrito && { borderColor: '#E8760A', borderWidth: 1.5 },
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
            <View style={styles.campoContainer}>
              <Text style={styles.campoLabel}>Bairro</Text>
              <View style={[
                styles.inputWrapper,
                campoFocado === 'bairro' && { borderColor: Colors.azul, borderWidth: 2 },
              ]}>
                <Ionicons name="home-outline" size={20} color={Colors.textoSecundario} />
                <TextInput
                  style={styles.input}
                  value={bairro}
                  onChangeText={setBairro}
                  placeholder="Ex: Macúti, Ponta-Gêa..."
                  placeholderTextColor={Colors.textoTerciario}
                  onFocus={() => setCampoFocado('bairro')}
                  onBlur={() => setCampoFocado(null)}
                />
              </View>
            </View>
          </View>

          {/* SECÇÃO: Segurança */}
          <SeccaoHeader icone="lock-closed" titulo="Segurança" />

          <View style={styles.seccaoCampos}>
            <TouchableOpacity
              style={styles.acaoCard}
              onPress={() => router.push('/auth/nova-password')}
              activeOpacity={0.85}
            >
              <View style={styles.acaoIcone}>
                <Ionicons name="key" size={20} color={Colors.azul} />
              </View>
              <View style={styles.acaoInfo}>
                <Text style={styles.acaoTitulo}>Alterar password</Text>
                <Text style={styles.acaoDescricao}>Actualiza a tua password de acesso</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
            </TouchableOpacity>
          </View>

          {/* Info card sobre localização actual */}
          <View style={styles.infoCard}>
            <View style={styles.infoIcone}>
              <Icone name="information" size={18} color={Colors.azul} />
            </View>
            <View style={styles.infoConteudo}>
              <Text style={styles.infoTitulo}>Localização actual</Text>
              <Text style={styles.infoTexto}>
                Esta é a tua localização de residência. Podes alterar temporariamente a localização actual (para ver imóveis noutras cidades) no header da Home.
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer com botão guardar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.botaoGuardar,
            (!temAlteracoes() || loading) && { opacity: 0.5 },
          ]}
          onPress={guardar}
          disabled={!temAlteracoes() || loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#E8760A', '#F05A00']}
            style={styles.botaoGuardarGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.branco} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={Colors.branco} />
                <Text style={styles.botaoGuardarTexto}>
                  {temAlteracoes() ? 'Guardar alterações' : 'Sem alterações'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal Foto */}
      <Modal
        visible={modalFotoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalFotoVisivel(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalFotoVisivel(false)}
        >
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Foto de perfil</Text>

            <TouchableOpacity style={styles.modalOpcao} onPress={tirarFoto} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(255, 121, 0, 0.12)' }]}>
                <Ionicons name="camera" size={22} color={Colors.azul} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={styles.modalOpcaoTitulo}>Tirar foto</Text>
                <Text style={styles.modalOpcaoDescricao}>Usar câmara</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={escolherGaleria} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(22, 140, 130, 0.12)' }]}>
                <Ionicons name="images" size={22} color={Colors.verde} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={styles.modalOpcaoTitulo}>Escolher da galeria</Text>
                <Text style={styles.modalOpcaoDescricao}>Fotos existentes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
            </TouchableOpacity>

            {foto && (
              <TouchableOpacity style={styles.modalOpcao} onPress={removerFoto} activeOpacity={0.7}>
                <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(244, 67, 54, 0.15)' }]}>
                  <Ionicons name="trash" size={22} color={Colors.erro} />
                </View>
                <View style={styles.modalOpcaoInfo}>
                  <Text style={[styles.modalOpcaoTitulo, { color: Colors.erro }]}>Remover foto</Text>
                  <Text style={styles.modalOpcaoDescricao}>Voltar ao avatar com inicial</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.modalCancelar}
              onPress={() => setModalFotoVisivel(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
        icone="map-marker"
      />
    </KeyboardAvoidingView>
  );
}

function SeccaoHeader({ icone, titulo }: any) {
  return (
    <View style={styles.seccaoHeader}>
      <View style={styles.seccaoIconeContainer}>
        <Ionicons name={icone} size={16} color={Colors.azul} />
      </View>
      <Text style={styles.seccaoTitulo}>{titulo}</Text>
      <View style={styles.seccaoLinha} />
    </View>
  );
}

function ModalSelector({ visivel, titulo, subtitulo, opcoes, valorSeleccionado, onSeleccionar, onFechar, icone }: any) {
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
            <View style={styles.modalHeaderIcone}>
              <Icone name={icone} size={24} color={Colors.azul} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitulo}>{titulo}</Text>
              <Text style={styles.modalHeaderSubtitulo}>{subtitulo}</Text>
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
                    styles.modalOpcaoLista,
                    seleccionado && { backgroundColor: 'rgba(255, 121, 0, 0.10)', borderColor: Colors.azul },
                  ]}
                  onPress={() => onSeleccionar(item.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalOpcaoInfo}>
                    <Text style={[
                      styles.modalOpcaoTitulo,
                      seleccionado && { color: '#16202E', fontFamily: Fonte.corpoSemi },
                    ]}>
                      {item.label}
                    </Text>
                    {item.descricao && (
                      <Text style={styles.modalOpcaoDescricao}>{item.descricao}</Text>
                    )}
                  </View>
                  {seleccionado && (
                    <View style={styles.modalOpcaoCheck}>
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
  container: { flex: 1, backgroundColor: '#F4F7FB' },
  safeAreaTop: {
    backgroundColor: '#16202E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  botaoVoltar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerTitulo: { ...Typography.h3, color: '#FFFFFF', fontFamily: Fonte.corpoSemi },

  // Perfil completo
  perfilCompletoContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.lg,
    gap: 7,
  },
  perfilCompletoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perfilCompletoTexto: {
    ...Typography.captionBold,
    color: '#FFFFFF',
    fontSize: 11,
  },
  perfilCompletoBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  perfilCompletoFill: {
    height: '100%',
    borderRadius: 3,
  },

  scrollContent: { paddingTop: Spacing.md, paddingBottom: 120 },

  // Foto seccao
  fotoSeccao: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Spacing.lg,
    ...Sombras.sm,
  },
  fotoWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  fotoDecorativoExterno: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 121, 0, 0.20)',
  },
  fotoDecorativoMedio: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(11, 46, 89, 0.15)',
  },
  fotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.md,
  },
  fotoImagem: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  fotoInicial: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoInicialTexto: {
    fontSize: 48,
    fontFamily: Fonte.tituloSemi,
    color: Colors.branco,
  },
  fotoEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8760A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.branco,
    ...Sombras.md,
  },
  fotoLabel: {
    ...Typography.h3,
    color: Colors.textoPrincipal,
    marginBottom: 4,
  },
  fotoLink: {
    ...Typography.bodyBold,
    color: '#E8760A',
  },

  // Secções
  seccaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  seccaoIconeContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 121, 0, 0.10)',
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
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  // Campos
  campoContainer: { gap: Spacing.xs },
  campoLabel: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
    fontSize: 13,
    marginLeft: 4,
  },
  campoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verificadoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 3,
  },
  verificadoTagTexto: {
    ...Typography.captionBold,
    color: Colors.verde,
    fontSize: 10,
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

  // Aviso
  avisoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  avisoTexto: {
    ...Typography.caption,
    color: Colors.aviso,
    fontFamily: Fonte.corpoSemi,
  },

  // Acção card
  acaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.branco,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.bordaSubtil,
    ...Sombras.sm,
  },
  acaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 121, 0, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acaoInfo: {
    flex: 1,
  },
  acaoTitulo: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
  },
  acaoDescricao: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    marginTop: 2,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#EAF1F8',
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#E8760A',
    gap: Spacing.sm,
  },
  infoIcone: {
    marginTop: 2,
  },
  infoConteudo: { flex: 1 },
  infoTitulo: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
    marginBottom: 2,
  },
  infoTexto: {
    ...Typography.bodySmall,
    color: Colors.textoPrincipal,
    lineHeight: 18,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...Sombras.lg,
  },
  botaoGuardar: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Sombras.md,
  },
  botaoGuardarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
    gap: Spacing.sm,
    minHeight: 56,
  },
  botaoGuardarTexto: {
    ...Typography.buttonLarge,
    color: Colors.branco,
  },

  // Sucesso
  sucessoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sucessoContent: {
    alignItems: 'center',
  },
  sucessoIconeExterno: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  sucessoIconeMedio: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sucessoIcone: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.branco,
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.lg,
  },
  sucessoTitulo: {
    ...Typography.displayLG,
    color: Colors.branco,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontFamily: Fonte.tituloSemi,
  },
  sucessoSubtitulo: {
    ...Typography.bodyLarge,
    color: Colors.branco,
    opacity: 0.95,
    textAlign: 'center',
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
    maxHeight: '80%',
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  modalHeaderIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 121, 0, 0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitulo: { ...Typography.h3, color: Colors.textoPrincipal },
  modalHeaderSubtitulo: {
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
    borderRadius: Radius.lg,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.fundoSuave,
    gap: Spacing.md,
  },
  modalOpcaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
  modalOpcaoLista: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: Colors.fundoSuave,
  },
  modalOpcaoCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8760A',
    justifyContent: 'center',
    alignItems: 'center',
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
});