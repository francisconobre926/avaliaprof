import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import EmojiPicker from 'rn-emoji-keyboard';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { IMOVEIS_MOCK, formatarPreco } from '../../src/data/imoveis-mock';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
// Tipos
interface Mensagem {
  id: string;
  texto: string;
  autor: 'eu' | 'outro';
  hora: Date;
  tipo: 'texto' | 'foto';
  urlFoto?: string;
  lida: boolean;
}

// Dados mock da conversa
const conversasMock: Record<string, { nome: string; online: boolean; verificado: boolean; imovelId: string }> = {
  '1': { nome: 'Maria Chissano', online: true, verificado: true, imovelId: '1' },
  '2': { nome: 'Imobiliária Costa Sol', online: false, verificado: true, imovelId: '2' },
  '3': { nome: 'João Nhamirre', online: false, verificado: false, imovelId: '3' },
  '4': { nome: 'Ana Muchanga', online: false, verificado: false, imovelId: '4' },
};

// Mensagens iniciais
const mensagensIniciaisMock: Record<string, Mensagem[]> = {
  '1': [
    {
      id: 'm1',
      texto: 'Bom dia! Tenho interesse no seu quarto anunciado.',
      autor: 'eu',
      hora: new Date(Date.now() - 3600000 * 3),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm2',
      texto: 'Olá! Muito obrigada pelo contacto 😊',
      autor: 'outro',
      hora: new Date(Date.now() - 3600000 * 2.5),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm3',
      texto: 'Sim, o quarto ainda está disponível. Quando gostaria de visitar?',
      autor: 'outro',
      hora: new Date(Date.now() - 3600000 * 2),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm4',
      texto: 'Excelente! Estava a pensar visitar amanhã de manhã, seria possível?',
      autor: 'eu',
      hora: new Date(Date.now() - 3600000),
      tipo: 'texto',
      lida: true,
    },
  ],
  '2': [
    {
      id: 'm1',
      texto: 'Boa tarde, tenho interesse no apartamento T2 na Ponta-Gêa.',
      autor: 'eu',
      hora: new Date(Date.now() - 3600000 * 5),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm2',
      texto: 'Boa tarde! Muito obrigada pelo interesse. Podemos marcar visita esta semana.',
      autor: 'outro',
      hora: new Date(Date.now() - 3600000 * 4),
      tipo: 'texto',
      lida: true,
    },
  ],
  '3': [
    {
      id: 'm1',
      texto: 'Olá, gostava de saber mais sobre a casa.',
      autor: 'eu',
      hora: new Date(Date.now() - 86400000),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm2',
      texto: 'A casa tem 3 quartos e 2 casas de banho.',
      autor: 'outro',
      hora: new Date(Date.now() - 86400000 + 3600000),
      tipo: 'texto',
      lida: true,
    },
  ],
  '4': [
    {
      id: 'm1',
      texto: 'Bom dia, o quarto ainda está disponível?',
      autor: 'eu',
      hora: new Date(Date.now() - 86400000 * 3),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm2',
      texto: 'Sim! Podes visitar amanhã às 10h?',
      autor: 'outro',
      hora: new Date(Date.now() - 86400000 * 3 + 3600000),
      tipo: 'texto',
      lida: true,
    },
    {
      id: 'm3',
      texto: 'Perfeito, aguardo a tua visita amanhã às 10h',
      autor: 'outro',
      hora: new Date(Date.now() - 86400000 * 2),
      tipo: 'texto',
      lida: true,
    },
  ],
};

// Respostas automáticas simuladas
const respostasAutomaticas = [
  'Claro! Podemos combinar.',
  'Sim, sem problemas.',
  'Certo, obrigada!',
  'Óptimo, aguardo a sua confirmação.',
  'Perfeito, combinado.',
  'Pode ser, sim.',
  'Vou verificar e já te respondo.',
  'Entendido, obrigada pelo contacto.',
  'Sim, é possível.',
  'Claro que sim!',
];

export default function ChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const conversa = conversasMock[id || '1'] || conversasMock['1'];
  const imovel = IMOVEIS_MOCK.find(i => i.id === conversa.imovelId);

  const [mensagens, setMensagens] = useState<Mensagem[]>(
    mensagensIniciaisMock[id || '1'] || []
  );
  const [texto, setTexto] = useState('');
  const [aEscrever, setAEscrever] = useState(false);
  const [emojiVisivel, setEmojiVisivel] = useState(false);
  const [modalAnexoVisivel, setModalAnexoVisivel] = useState(false);
  const [modalOpcoesVisivel, setModalOpcoesVisivel] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const escreverAnim1 = useRef(new Animated.Value(0)).current;
  const escreverAnim2 = useRef(new Animated.Value(0)).current;
  const escreverAnim3 = useRef(new Animated.Value(0)).current;

  // Animação dos 3 pontinhos "está a escrever"
  useEffect(() => {
    if (aEscrever) {
      const animarPonto = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: -6,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const a1 = animarPonto(escreverAnim1, 0);
      const a2 = animarPonto(escreverAnim2, 150);
      const a3 = animarPonto(escreverAnim3, 300);
      a1.start();
      a2.start();
      a3.start();

      return () => {
        a1.stop();
        a2.stop();
        a3.stop();
      };
    }
  }, [aEscrever]);

  // Auto scroll ao adicionar mensagem
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [mensagens, aEscrever]);

  const enviarMensagem = () => {
    if (!texto.trim()) return;

    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      texto: texto.trim(),
      autor: 'eu',
      hora: new Date(),
      tipo: 'texto',
      lida: false,
    };

    setMensagens(prev => [...prev, novaMensagem]);
    setTexto('');

    // Simular resposta automática após 1-3s
    setTimeout(() => {
      setAEscrever(true);
      setTimeout(() => {
        setAEscrever(false);
        const resposta: Mensagem = {
          id: (Date.now() + 1).toString(),
          texto: respostasAutomaticas[Math.floor(Math.random() * respostasAutomaticas.length)],
          autor: 'outro',
          hora: new Date(),
          tipo: 'texto',
          lida: true,
        };
        setMensagens(prev => [...prev, resposta]);
      }, 2000);
    }, 1000);
  };

  const escolherEmoji = (emoji: { emoji: string }) => {
    setTexto(prev => prev + emoji.emoji);
  };

  const tirarFoto = async () => {
    setModalAnexoVisivel(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });
    if (!result.canceled) {
      enviarFoto(result.assets[0].uri);
    }
  };

  const escolherGaleria = async () => {
    setModalAnexoVisivel(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) {
      enviarFoto(result.assets[0].uri);
    }
  };

  const enviarFoto = (uri: string) => {
    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      texto: '',
      autor: 'eu',
      hora: new Date(),
      tipo: 'foto',
      urlFoto: uri,
      lida: false,
    };
    setMensagens(prev => [...prev, novaMensagem]);
  };

  const formatarHora = (data: Date) => {
    return data.toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatarDia = (data: Date) => {
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString()) return 'Hoje';
    if (data.toDateString() === ontem.toDateString()) return 'Ontem';

    return data.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Determinar se deve mostrar separador de dia
  const deveMostrarSeparador = (index: number) => {
    if (index === 0) return true;
    const anterior = mensagens[index - 1];
    const actual = mensagens[index];
    return anterior.hora.toDateString() !== actual.hora.toDateString();
  };

  const renderMensagem = ({ item, index }: { item: Mensagem; index: number }) => {
    const isMinha = item.autor === 'eu';
    const mostrarSeparador = deveMostrarSeparador(index);

    return (
      <>
        {mostrarSeparador && (
          <View style={styles.separadorDia}>
            <View style={styles.separadorLinha} />
            <View style={styles.separadorTextoContainer}>
              <Text style={styles.separadorTexto}>{formatarDia(item.hora)}</Text>
            </View>
            <View style={styles.separadorLinha} />
          </View>
        )}

        <View style={[
          styles.mensagemContainer,
          isMinha ? styles.mensagemMinha : styles.mensagemOutro,
        ]}>
          {item.tipo === 'foto' ? (
            <TouchableOpacity activeOpacity={0.9}>
              <Image source={{ uri: item.urlFoto }} style={styles.mensagemFoto} />
              <View style={styles.mensagemFotoInfo}>
                <Text style={styles.mensagemHora}>{formatarHora(item.hora)}</Text>
                {isMinha && (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={item.lida ? Colors.azulClaro : 'rgba(255,255,255,0.8)'}
                  />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[
              styles.bolhaMensagem,
              isMinha ? styles.bolhaMinha : styles.bolhaOutro,
            ]}>
              {isMinha ? (
                <LinearGradient
                  colors={[Colors.azul, Colors.erro]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              ) : null}
              <Text style={[
                styles.mensagemTexto,
                isMinha ? styles.textoMinha : styles.textoOutro,
              ]}>
                {item.texto}
              </Text>
              <View style={styles.mensagemMeta}>
                <Text style={[
                  styles.mensagemHora,
                  isMinha ? { color: 'rgba(255,255,255,0.8)' } : { color: Colors.textoTerciario },
                ]}>
                  {formatarHora(item.hora)}
                </Text>
                {isMinha && (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color={item.lida ? Colors.azulClaro : 'rgba(255,255,255,0.7)'}
                  />
                )}
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <TopBar
        titulo={conversa.nome}
        onVoltar={() => router.back()}
        acoes={
          <>
            <TopBarBotao icone="call" rotulo="Chamar" onPress={() => Alert.alert('Chamada', 'Funcionalidade em breve')} />
            <TopBarBotao icone="ellipsis-vertical" rotulo="Opções" onPress={() => setModalOpcoesVisivel(true)} />
          </>
        }
      />
      <View style={styles.safeAreaTop}>
        {/* Card do imóvel */}
        {imovel && (
          <TouchableOpacity
            style={styles.imovelCard}
            onPress={() => router.push(`/imovel/${imovel.id}` as any)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: imovel.fotos[0] }} style={styles.imovelFoto} />
            <View style={styles.imovelInfo}>
              <View style={styles.imovelBadge}>
                <Icone name="home" size={10} color={Colors.carvao} />
                <Text style={styles.imovelBadgeText}>IMÓVEL EM CONVERSA</Text>
              </View>
              <Text style={styles.imovelTitulo} numberOfLines={1}>
                {imovel.titulo}
              </Text>
              <Text style={styles.imovelPreco}>
                {formatarPreco(imovel.preco, imovel.periodicidade)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
          </TouchableOpacity>
        )}
      </View>

      {/* Área de mensagens */}
      <KeyboardAvoidingView
        style={styles.mensagensArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={renderMensagem}
          contentContainerStyle={styles.mensagensLista}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            aEscrever ? (
              <View style={styles.escreverContainer}>
                <View style={styles.escreverBolha}>
                  <View style={styles.escreverPontos}>
                    <Animated.View
                      style={[styles.escreverPonto, { transform: [{ translateY: escreverAnim1 }] }]}
                    />
                    <Animated.View
                      style={[styles.escreverPonto, { transform: [{ translateY: escreverAnim2 }] }]}
                    />
                    <Animated.View
                      style={[styles.escreverPonto, { transform: [{ translateY: escreverAnim3 }] }]}
                    />
                  </View>
                </View>
                <Text style={styles.escreverTexto}>
                  {conversa.nome.split(' ')[0]} está a escrever...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Barra de input */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.inputBotaoAnexo}
              onPress={() => setModalAnexoVisivel(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={Colors.carvao} />
            </TouchableOpacity>

            <View style={styles.inputCampo}>
              <TextInput
                style={styles.input}
                placeholder="Mensagem..."
                placeholderTextColor={Colors.textoTerciario}
                value={texto}
                onChangeText={setTexto}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.inputBotaoEmoji}
                onPress={() => setEmojiVisivel(true)}
                activeOpacity={0.7}
              >
                <Icone name="emoticon-outline" size={22} color={Colors.textoSecundario} />
              </TouchableOpacity>
            </View>

            {texto.trim() ? (
              <TouchableOpacity
                style={styles.inputBotaoEnviar}
                onPress={enviarMensagem}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.azul, Colors.erro]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons name="send" size={18} color={Colors.branco} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.inputBotaoMic}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Áudio', 'Funcionalidade em breve')}
              >
                <Ionicons name="mic" size={20} color={Colors.branco} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Emoji Picker */}
      <EmojiPicker
        open={emojiVisivel}
        onEmojiSelected={escolherEmoji}
        onClose={() => setEmojiVisivel(false)}
        enableRecentlyUsed
        categoryPosition="bottom"
        translation={{
          recently_used: 'Recentes',
          smileys_emotion: 'Emoções',
          people_body: 'Pessoas',
          animals_nature: 'Animais',
          food_drink: 'Comida',
          travel_places: 'Viagem',
          activities: 'Actividades',
          objects: 'Objectos',
          symbols: 'Símbolos',
          flags: 'Bandeiras',
          search: 'Pesquisar',
        }}
      />

      {/* Modal Anexo */}
      <Modal
        visible={modalAnexoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAnexoVisivel(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalAnexoVisivel(false)}
        >
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Enviar anexo</Text>

            <TouchableOpacity
              style={styles.modalOpcao}
              onPress={tirarFoto}
              activeOpacity={0.7}
            >
              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>
                <Ionicons name="camera" size={22} color={Colors.carvao} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={styles.modalOpcaoTitulo}>Câmara</Text>
                <Text style={styles.modalOpcaoDescricao}>Tirar foto agora</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOpcao}
              onPress={escolherGaleria}
              activeOpacity={0.7}
            >
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(22, 163, 74, 0.10)' }]}>
                <Ionicons name="images" size={22} color={Colors.verdeTexto} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={styles.modalOpcaoTitulo}>Galeria</Text>
                <Text style={styles.modalOpcaoDescricao}>Escolher foto existente</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOpcao}
              onPress={() => {
                setModalAnexoVisivel(false);
                Alert.alert('Localização', 'Funcionalidade em breve');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>
                <Ionicons name="location" size={22} color={Colors.aviso} />
              </View>
              <View style={styles.modalOpcaoInfo}>
                <Text style={styles.modalOpcaoTitulo}>Localização</Text>
                <Text style={styles.modalOpcaoDescricao}>Partilhar tua localização</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelar}
              onPress={() => setModalAnexoVisivel(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Opções */}
      <Modal
        visible={modalOpcoesVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpcoesVisivel(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalOpcoesVisivel(false)}
        >
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Opções</Text>

            <TouchableOpacity style={styles.modalOpcao} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>
                <Ionicons name="person" size={22} color={Colors.carvao} />
              </View>
              <Text style={styles.modalOpcaoTitulo}>Ver perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>
                <Ionicons name="notifications-off" size={22} color={Colors.aviso} />
              </View>
              <Text style={styles.modalOpcaoTitulo}>Silenciar notificações</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(158, 158, 158, 0.15)' }]}>
                <Ionicons name="archive" size={22} color={Colors.textoSecundario} />
              </View>
              <Text style={styles.modalOpcaoTitulo}>Arquivar conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(179, 38, 30, 0.15)' }]}>
                <Ionicons name="flag" size={22} color={Colors.erro} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: Colors.erro }]}>Denunciar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} activeOpacity={0.7}>
              <View style={[styles.modalOpcaoIcone, { backgroundColor: 'rgba(179, 38, 30, 0.15)' }]}>
                <Ionicons name="trash" size={22} color={Colors.erro} />
              </View>
              <Text style={[styles.modalOpcaoTitulo, { color: Colors.erro }]}>Apagar conversa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelar}
              onPress={() => setModalOpcoesVisivel(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gelo },
  safeAreaTop: {
    backgroundColor: Colors.branco,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fundoSuave,
    paddingTop: Spacing.sm,
    ...Sombras.sm,
  },

  // Card imóvel
  imovelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.azulSuave,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 16,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.azulSuave,
    borderLeftWidth: 3,
    borderLeftColor: Colors.azul,
  },
  imovelFoto: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  imovelInfo: {
    flex: 1,
  },
  imovelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  imovelBadgeText: {
    ...Typography.captionBold,
    color: Colors.carvao,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  imovelTitulo: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
    fontSize: 13,
  },
  imovelPreco: {
    ...Typography.captionBold,
    color: Colors.carvao,
    fontSize: 12,
    marginTop: 2,
  },

  // Área mensagens
  mensagensArea: {
    flex: 1,
  },
  mensagensLista: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  // Separador dia
  separadorDia: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  separadorLinha: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  separadorTextoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  separadorTexto: {
    ...Typography.captionBold,
    color: Colors.textoSecundario,
    fontSize: 12,
    letterSpacing: 0.5,
  },

  // Mensagem
  mensagemContainer: {
    marginBottom: Spacing.xs,
    maxWidth: '78%',
  },
  mensagemMinha: {
    alignSelf: 'flex-end',
  },
  mensagemOutro: {
    alignSelf: 'flex-start',
  },
  bolhaMensagem: {
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    overflow: 'hidden',
    minWidth: 80,
  },
  bolhaMinha: {
    borderBottomRightRadius: 4,
    ...Sombras.sm,
  },
  bolhaOutro: {
    backgroundColor: Colors.branco,
    borderBottomLeftRadius: 4,
    ...Sombras.sm,
  },
  mensagemTexto: {
    ...Typography.body,
    lineHeight: 20,
  },
  textoMinha: {
    color: Colors.branco,
  },
  textoOutro: {
    color: Colors.textoPrincipal,
  },
  mensagemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  mensagemHora: {
    fontSize: 12,
    fontFamily: Fonte.corpoMedio,
  },

  // Foto na mensagem
  mensagemFoto: {
    width: 220,
    height: 220,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  mensagemFotoInfo: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },

  // A escrever
  escreverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  escreverBolha: {
    backgroundColor: Colors.branco,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    ...Sombras.sm,
  },
  escreverPontos: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    height: 12,
  },
  escreverPonto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textoSecundario,
  },
  escreverTexto: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    fontStyle: 'italic',
  },

  // Input
  inputSafeArea: {
    backgroundColor: Colors.branco,
    borderTopWidth: 1,
    borderTopColor: Colors.bordaSubtil,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  inputBotaoAnexo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.azulSuave,
  },
  inputCampo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.fundoSuave,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.fundoSuave,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    minHeight: 44,
    maxHeight: 120,
    gap: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textoPrincipal,
    paddingVertical: 6,
    maxHeight: 100,
  },
  inputBotaoEmoji: {
    padding: 4,
  },
  inputBotaoEnviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.colorida(Colors.azul),
  },
  inputBotaoMic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.azul,
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.colorida(Colors.azul),
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
    marginBottom: Spacing.lg,
    textAlign: 'center',
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
  modalCancelar: {
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalCancelarTexto: {
    ...Typography.button,
    color: Colors.textoSecundario,
  },
});