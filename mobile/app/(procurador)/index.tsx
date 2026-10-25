import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Modal,
  Pressable,
  FlatList,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import {
  ANUNCIOS_MOCK,
  filtrarPorGrupo,
  filtrarPorCategoria,
  contarPorGrupo,
  apenasDisponiveis,
} from '../../src/data/anuncios-mock';
import { FAIXAS_PRECO } from '../../src/data/faixas-preco';
import { PROVINCIAS_MOCAMBIQUE } from '../../src/data/mocambique';
import { useUserStore } from '../../src/store/userStore';
import { useCores } from '../../src/store/themeStore';
import { useReferralStore } from '../../src/store/referralStore';
import { useAuthGateStore } from '../../src/store/authGateStore';
import { GrupoCategoria, CategoriaAnuncio, Anuncio } from '../../src/types';
import { listarAnunciosLocais, AnuncioLocal } from '../../src/store/anunciosLocal';
import CardAnuncio from '../../src/components/CardAnuncio';

const { width } = Dimensions.get('window');

// ============================================================
// CORES DE MARCA GOHOME (do logo oficial)
// Azul principal: #0082DE  ·  Laranja destaque: #FE8A00
// ============================================================
const AZUL_HERO_INICIO = '#003A66';   // Azul profundo (topo do gradiente)
const AZUL_HERO_MEIO = '#0061A6';     // Azul escuro
const AZUL_HERO_FIM = '#0082DE';      // Azul principal GoHome
const LARANJA_MARCA = '#FE8A00';      // Laranja GoHome oficial
const LARANJA_ESCURO = '#CB6E00';

/**
 * Converte um anúncio guardado no dispositivo para o formato consumido
 * pelo catálogo público. Os anúncios pendentes de pagamento não são
 * publicados na lista pública.
 */
function converterAnuncioLocal(anuncio: AnuncioLocal): Anuncio {
  const categoria = String(anuncio.categoria || 'casa').toLowerCase();
  const grupoPorCategoria: Record<string, string> = {
    casa: 'imoveis', apartamento: 'imoveis', quarto: 'imoveis', moradia: 'imoveis',
    terreno: 'terrenos', lote: 'terrenos',
    espaco_eventos: 'espacos', espaco_casamento: 'espacos',
    espaco_reuniao: 'espacos', espaco_formacao: 'espacos', estudio: 'espacos',
    hotel: 'alojamento', pensao: 'alojamento', hospedagem: 'alojamento',
    quarto_hotel: 'alojamento',
    loja: 'comercial', escritorio: 'comercial', salao: 'comercial',
    espaco_comercial: 'comercial',
    carro: 'veiculos', mota: 'veiculos', carrinha: 'veiculos', camiao: 'veiculos',
    equipamento: 'equipamentos', maquina: 'equipamentos',
  };
  const fotos = Array.isArray(anuncio.fotos) ? anuncio.fotos.filter(Boolean) : [];
  const descricao = String(anuncio.descricao || '');
  const zona = [anuncio.bairro, anuncio.cidade].filter(Boolean).join(', ');

  return {
    ...anuncio,
    id: String(anuncio.id),
    titulo: String(anuncio.titulo || 'Anúncio GoHome'),
    categoria: categoria as any,
    finalidade: String(anuncio.finalidade || 'arrendar') as any,
    bairro: String(anuncio.bairro || 'Localização por confirmar'),
    cidade: String(anuncio.cidade || 'Moçambique'),
    provincia: String((anuncio as any).provincia || 'Sofala'),
    preco: Number(anuncio.preco || 0),
    descricao,
    descricaoCurta: descricao.slice(0, 120),
    fotos,
    imagem: fotos[0] || undefined,
    zona,
    grupo: grupoPorCategoria[categoria] || 'imoveis',
    grupoCategoria: grupoPorCategoria[categoria] || 'imoveis',
    publicadoEm: anuncio.publicadoEm || new Date().toISOString(),
    caracteristicas: anuncio.caracteristicas || {},
    anuncianteNome: anuncio.anuncianteNome || 'Anunciante GoHome',
    anuncianteTelefone1: anuncio.anuncianteTelefone1 || '',
    anuncianteTelefone2: anuncio.anuncianteTelefone2 || '',
    latitude: anuncio.latitude ?? null,
    longitude: anuncio.longitude ?? null,
    origemDemo: false,
  } as unknown as Anuncio;
}


// ============ GRUPOS DO MARKETPLACE ============
interface GrupoInfo {
  id: GrupoCategoria | 'todos';
  nome: string;
  icone: string;
}

const GRUPOS: GrupoInfo[] = [
  { id: 'todos', nome: 'Tudo', icone: 'view-grid' },
  { id: 'imoveis', nome: 'Imóveis', icone: 'home-city' },
  { id: 'veiculos', nome: 'Veículos', icone: 'car' },
  { id: 'espacos', nome: 'Espaços', icone: 'party-popper' },
  { id: 'alojamento', nome: 'Alojamento', icone: 'bed' },
  { id: 'comercial', nome: 'Comercial', icone: 'storefront' },
  { id: 'equipamentos', nome: 'Equipamentos', icone: 'wrench' },
  { id: 'terrenos', nome: 'Terrenos', icone: 'map' },
];

// ============ CATEGORIAS POR GRUPO ============
interface CategoriaInfo {
  id: CategoriaAnuncio | 'todos';
  nome: string;
  icone: any;
}

const CATEGORIAS_POR_GRUPO: Record<string, CategoriaInfo[]> = {
  todos: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
  ],
  imoveis: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'quarto', nome: 'Quartos', icone: 'bed-outline' },
    { id: 'apartamento', nome: 'Apartamentos', icone: 'business-outline' },
    { id: 'casa', nome: 'Casas', icone: 'home-outline' },
    { id: 'moradia', nome: 'Moradias', icone: 'home' },
  ],
  veiculos: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'carro', nome: 'Carros', icone: 'car-outline' },
    { id: 'mota', nome: 'Motas', icone: 'bicycle-outline' },
    { id: 'carrinha', nome: 'Carrinhas', icone: 'car-sport-outline' },
    { id: 'camiao', nome: 'Camiões', icone: 'bus-outline' },
  ],
  espacos: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'espaco_eventos', nome: 'Eventos', icone: 'calendar-outline' },
    { id: 'espaco_casamento', nome: 'Casamentos', icone: 'heart-outline' },
    { id: 'espaco_reuniao', nome: 'Reuniões', icone: 'people-outline' },
    { id: 'estudio', nome: 'Estúdios', icone: 'mic-outline' },
  ],
  alojamento: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'hotel', nome: 'Hotéis', icone: 'bed-outline' },
    { id: 'pensao', nome: 'Pensões', icone: 'home-outline' },
    { id: 'hospedagem', nome: 'Hospedagem', icone: 'business-outline' },
  ],
  comercial: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'loja', nome: 'Lojas', icone: 'storefront-outline' },
    { id: 'escritorio', nome: 'Escritórios', icone: 'briefcase-outline' },
    { id: 'salao', nome: 'Salões', icone: 'business-outline' },
  ],
  equipamentos: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'equipamento', nome: 'Equipamentos', icone: 'cog-outline' },
    { id: 'maquina', nome: 'Máquinas', icone: 'construct-outline' },
  ],
  terrenos: [
    { id: 'todos', nome: 'Todos', icone: 'grid-outline' },
    { id: 'terreno', nome: 'Terrenos', icone: 'map-outline' },
    { id: 'lote', nome: 'Lotes', icone: 'location-outline' },
  ],
};

export default function HomeProcurador() {
  const router = useRouter();
  const cores = useCores();

  // Estado do utilizador
  const usuario = useUserStore(state => state.usuario);
  const modoConvidado = useUserStore(state => state.modoConvidado);
  const autenticado = usuario !== null && !modoConvidado;

  const getInicialAvatar = usuario?.nome?.trim()
    ? usuario.nome.trim().charAt(0).toUpperCase()
    : '?';
  const getPrimeiroNome = usuario?.nome?.trim().split(/\s+/)[0] || '';
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Referral
  const meuCodigo = useReferralStore(state => state.meuCodigo);

  // Estado local
  const [bannerIndex, setBannerIndex] = useState(0);
  const [anunciosCatalogo, setAnunciosCatalogo] = useState<Anuncio[]>(ANUNCIOS_MOCK);
  const [grupoActivo, setGrupoActivo] = useState<string>('todos');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const [faixaActiva, setFaixaActiva] = useState('todos');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [modalLocalizacaoVisivel, setModalLocalizacaoVisivel] = useState(false);
  const [modalPrecosVisivel, setModalPrecosVisivel] = useState(false);
  const [detectandoGPS, setDetectandoGPS] = useState(false);
  const [localizacaoActual, setLocalizacaoActual] = useState({
    cidade: 'Beira',
    provincia: 'Sofala',
  });

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    detectarLocalizacaoGPS(true);
  }, []);

  // Actualiza o catálogo sempre que o procurador regressa à Home.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      const carregarAnunciosLocais = async () => {
        try {
          const locais = await listarAnunciosLocais();
          if (!activo) return;
          const publicados = locais
            .filter(item => String(item.estadoPagamento || '').toLowerCase() === 'confirmado')
            .filter(item => String(item.estadoAnuncio || 'activo').toLowerCase() === 'activo')
            .map(converterAnuncioLocal);
          const idsLocais = new Set(publicados.map(item => item.id));
          const demonstracaoSemDuplicados = ANUNCIOS_MOCK.filter(item => !idsLocais.has(item.id));
          setAnunciosCatalogo([...publicados, ...demonstracaoSemDuplicados]);
        } catch (erro) {
          console.warn('Não foi possível carregar anúncios locais do GoHome:', erro);
          if (activo) setAnunciosCatalogo(ANUNCIOS_MOCK);
        }
      };
      void carregarAnunciosLocais();
      return () => { activo = false; };
    }, [])
  );

  // Rotação automática do banner a cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCategoriaActiva('todos');
  }, [grupoActivo]);

  const detectarLocalizacaoGPS = async (silencioso: boolean = false) => {
    try {
      setDetectandoGPS(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        if (!silencioso) {
          Alert.alert('Permissão de localização', 'Precisamos de acesso à tua localização.');
        }
        setDetectandoGPS(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        const cidade = geocode.city || geocode.subregion || 'Beira';
        const regiao = geocode.region || 'Sofala';

        const provinciaEncontrada = PROVINCIAS_MOCAMBIQUE.find(
          p => p.nome.toLowerCase().includes(regiao.toLowerCase()) ||
               regiao.toLowerCase().includes(p.nome.toLowerCase())
        );

        if (provinciaEncontrada) {
          setLocalizacaoActual({
            cidade,
            provincia: provinciaEncontrada.nome,
          });

          if (!silencioso) {
            Alert.alert('Localização detectada', `Estás em ${cidade}, ${provinciaEncontrada.nome}`);
          }
        }
      }
    } catch (error) {
      if (!silencioso) Alert.alert('Erro', 'Não foi possível detectar a localização');
    } finally {
      setDetectandoGPS(false);
    }
  };

  // ============ APLICAR FILTROS ============
  let anunciosFiltrados = apenasDisponiveis(anunciosCatalogo);
  anunciosFiltrados = filtrarPorGrupo(anunciosFiltrados, grupoActivo);
  anunciosFiltrados = filtrarPorCategoria(anunciosFiltrados, categoriaActiva);

  if (termoPesquisa.trim()) {
    const termo = termoPesquisa.trim().toLocaleLowerCase('pt-PT');
    anunciosFiltrados = anunciosFiltrados.filter(anuncio =>
      [anuncio.titulo, anuncio.descricaoCurta, anuncio.descricao, anuncio.categoria, anuncio.cidade, anuncio.bairro, anuncio.provincia]
        .filter(Boolean)
        .some(valor => String(valor).toLocaleLowerCase('pt-PT').includes(termo))
    );
  }

  if (faixaActiva !== 'todos') {
    const faixa = FAIXAS_PRECO.find(f => f.id === faixaActiva);
    if (faixa) {
      anunciosFiltrados = anunciosFiltrados.filter(a =>
        a.preco >= faixa.min && (faixa.max === null || a.preco <= faixa.max)
      );
    }
  }

  const limiteVisitante = 6;
  const baseDestaques = anunciosFiltrados.slice(0, 3);
  const anunciosDestaque = autenticado ? baseDestaques : baseDestaques.slice(0, limiteVisitante);
  const idsDestaque = new Set(anunciosDestaque.map(anuncio => anuncio.id));
  const restantesParaLista = anunciosFiltrados.filter(anuncio => !idsDestaque.has(anuncio.id));
  const vagasLista = autenticado ? restantesParaLista.length : Math.max(0, limiteVisitante - anunciosDestaque.length);
  const anunciosVisiveis = restantesParaLista.slice(0, vagasLista);
  const totalVisivelVisitante = anunciosDestaque.length + anunciosVisiveis.length;
  const categoriasActuais = CATEGORIAS_POR_GRUPO[grupoActivo] || CATEGORIAS_POR_GRUPO.todos;
  const grupoActivoInfo = GRUPOS.find(g => g.id === grupoActivo) || GRUPOS[0];

  const toggleFavorito = (id: string) => {
    setFavoritos(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const irParaFiltrosAvancados = () => setModalPrecosVisivel(true);

  const abrirAuthGate = useAuthGateStore(state => state.abrir);

  const abrirAnuncio = (id: string) => {
    if (!autenticado) {
      abrirAuthGate('ver_detalhes', () => {
        router.push(`/anuncio/${id}` as any);
      });
      return;
    }
    router.push(`/anuncio/${id}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={AZUL_HERO_INICIO}
      />

      <SafeAreaView style={styles.heroSafeArea} edges={['top']}>
        <LinearGradient
          colors={[AZUL_HERO_INICIO, AZUL_HERO_MEIO, AZUL_HERO_FIM]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <View pointerEvents="none" style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            {/* Logo GoHome (azul "Go" + laranja "Home" como no logo oficial) */}
            <Text style={styles.brandLogo}>
              <Text style={styles.brandGo}>Go</Text>
              <Text style={styles.brandHome}>Home</Text>
            </Text>
            <TouchableOpacity style={styles.heroNotification} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={25} color={AZUL_HERO_MEIO} />
              <View style={styles.heroNotificationBadge}>
                <Text style={styles.heroNotificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.heroWelcomeRow}>
            <View style={styles.heroWelcomeText}>
              <Text style={styles.heroEyebrow}>
                {autenticado ? getSaudacao() : 'Bem-vindo(a)'}
              </Text>
              <Text numberOfLines={2} style={styles.heroTitle}>
                {autenticado
                  ? `${getPrimeiroNome}, encontra o que procuras.`
                  : 'Encontra o teu próximo lugar.'}
              </Text>
              <TouchableOpacity
                style={styles.heroLocation}
                onPress={() => setModalLocalizacaoVisivel(true)}
                activeOpacity={0.75}
              >
                {detectandoGPS ? (
                  <MaterialCommunityIcons name="crosshairs-gps" size={17} color={LARANJA_MARCA} />
                ) : (
                  <Ionicons name="location" size={17} color={LARANJA_MARCA} />
                )}
                <Text style={styles.heroLocationText}>
                  {detectandoGPS
                    ? 'A detectar localização...'
                    : `${localizacaoActual.cidade}, ${localizacaoActual.provincia}`}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.heroIllustration}>
              <View style={styles.heroIllustrationCircle} />
              <MaterialCommunityIcons
                name="home-city-outline"
                size={88}
                color="rgba(255,255,255,0.82)"
              />
            </View>
          </View>
          <View style={styles.heroOrangeAccent} />

          {/* Barra de pesquisa integrada no cabeçalho */}
          <View style={styles.pesquisaContainer}>
            <View
              style={[
                styles.pesquisaInputWrapper,
                { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
              ]}
            >
              <Ionicons name="search" size={20} color={cores.textoSecundario} />
              <TextInput
                value={termoPesquisa}
                onChangeText={setTermoPesquisa}
                placeholder="Ex.: casa para arrendar na Beira"
                placeholderTextColor={cores.textoTerciario}
                style={[styles.pesquisaInput, { color: cores.textoPrincipal }]}
                returnKeyType="search"
                accessibilityLabel="Pesquisar anúncios"
                clearButtonMode="while-editing"
              />
            </View>
            <TouchableOpacity
              style={styles.filtrosBotao}
              activeOpacity={0.8}
              onPress={irParaFiltrosAvancados}
            >
              <LinearGradient
                colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="options" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Filtro rápido por orçamento */}
        <View style={styles.precoSection}>
          <View style={styles.precoSectionHeader}>
            <View style={styles.precoHeading}>
              <View style={styles.precoIconWrap}>
                <Ionicons name="pricetag-outline" size={17} color={LARANJA_MARCA} />
              </View>
              <View>
                <Text style={[styles.precoTitle, { color: cores.textoPrincipal }]}>O teu orçamento</Text>
                <Text style={[styles.precoSubtitle, { color: cores.textoSecundario }]}>Filtra por faixa de preço</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setModalPrecosVisivel(true)} style={styles.verFaixasButton} activeOpacity={0.8}>
              <Text style={[styles.verFaixasText, { color: cores.principal }]}>Ver faixas</Text>
              <Ionicons name="chevron-forward" size={15} color={cores.principal} />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.precoChips}>
            {FAIXAS_PRECO.map(faixa => {
              const activo = faixaActiva === faixa.id;
              return (
                <TouchableOpacity
                  key={faixa.id}
                  onPress={() => setFaixaActiva(faixa.id)}
                  activeOpacity={0.82}
                  style={[
                    styles.precoChip,
                    {
                      backgroundColor: activo ? LARANJA_MARCA : cores.fundoElevado,
                      borderColor: activo ? LARANJA_MARCA : cores.bordaSubtil,
                    },
                  ]}
                >
                  <Text style={[
                    styles.precoChipText,
                    { color: activo ? '#FFFFFF' : cores.textoPrincipal },
                  ]}>
                    {faixa.labelCurto}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ============ GRUPOS DO MARKETPLACE ============ */}
        <View style={styles.gruposSeccao}>
          <Text style={[styles.gruposTitulo, { color: cores.textoPrincipal }]}>
            O que procuras?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gruposContainer}
          >
            {GRUPOS.map((grupo) => {
              const activo = grupoActivo === grupo.id;
              const contagem = grupo.id === 'todos'
                ? anunciosCatalogo.length
                : contarPorGrupo(anunciosCatalogo, grupo.id);
              const palavraContagem = contagem === 1 ? 'anúncio' : 'anúncios';

              return (
                <TouchableOpacity
                  key={grupo.id}
                  style={[
                    styles.grupoCard,
                    { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                    activo && { borderColor: cores.principal, borderWidth: 2 },
                  ]}
                  onPress={() => setGrupoActivo(grupo.id)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.grupoIcone,
                      { backgroundColor: activo ? cores.principal : cores.fundoSuave },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={grupo.icone as any}
                      size={22}
                      color={activo ? '#FFFFFF' : cores.textoSecundario}
                    />
                  </View>
                  <Text
                    style={[
                      styles.grupoNome,
                      { color: activo ? cores.principal : cores.textoPrincipal },
                    ]}
                  >
                    {grupo.nome}
                  </Text>
                  <Text style={[styles.grupoContagem, { color: cores.textoSecundario }]}>
                    {`${contagem} ${palavraContagem}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ============ BANNER ROTATIVO ============ */}
        <View style={styles.bannerContainer}>
          {bannerIndex === 0 ? (
            // Banner 1 — Promoção 50% (gradiente marca GoHome: azul→laranja)
            <TouchableOpacity activeOpacity={0.95}>
              <LinearGradient
                colors={cores.gradiente}
                style={styles.banner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerLeft}>
                  <View style={styles.bannerBadge}>
                    <MaterialCommunityIcons name="tag" size={12} color="#FFFFFF" />
                    <Text style={styles.bannerBadgeText}>PROMOÇÃO LANÇAMENTO</Text>
                  </View>
                  <Text style={styles.bannerTitulo}>50% de desconto</Text>
                  <Text style={styles.bannerSubtitulo}>
                    {`Em TUDO, durante 3 meses\nem ${localizacaoActual.cidade}`}
                  </Text>
                  <View style={styles.bannerCTA}>
                    <Text style={styles.bannerCTAText}>Saber mais</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.bannerRight}>
                  <View style={styles.bannerCircle1} />
                  <View style={styles.bannerCircle2} />
                  <MaterialCommunityIcons name="home-city" size={80} color="rgba(255, 255, 255, 0.9)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            // Banner 2 — Programa de referência (laranja GoHome)
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => router.push('/referencia' as any)}
            >
              <LinearGradient
                colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                style={styles.banner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerLeft}>
                  <View style={styles.bannerBadge}>
                    <MaterialCommunityIcons name="gift-outline" size={12} color="#FFFFFF" />
                    <Text style={styles.bannerBadgeText}>CONVIDA E GANHA</Text>
                  </View>
                  <Text style={styles.bannerTitulo}>Ganha 10%</Text>
                  <Text style={styles.bannerSubtitulo}>
                    {`Partilha ${meuCodigo || 'o teu código'}\ne recebe sempre que pagarem`}
                  </Text>
                  <View style={styles.bannerCTA}>
                    <Text style={styles.bannerCTAText}>Partilhar agora</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </View>
                </View>
                <View style={styles.bannerRight}>
                  <View style={styles.bannerCircle1} />
                  <View style={styles.bannerCircle2} />
                  <MaterialCommunityIcons name="account-multiple-plus" size={80} color="rgba(255, 255, 255, 0.9)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Indicadores de página */}
          <View style={styles.bannerDots}>
            <TouchableOpacity
              onPress={() => setBannerIndex(0)}
              style={[
                styles.bannerDot,
                bannerIndex === 0 && styles.bannerDotActivo,
              ]}
            />
            <TouchableOpacity
              onPress={() => setBannerIndex(1)}
              style={[
                styles.bannerDot,
                bannerIndex === 1 && styles.bannerDotActivo,
              ]}
            />
          </View>
        </View>

        {/* Categorias do grupo activo */}
        {grupoActivo !== 'todos' && categoriasActuais.length > 1 && (
          <View style={styles.seccao}>
            <View style={styles.seccaoHeader}>
              <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
                {grupoActivoInfo.nome}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriasContainer}
            >
              {categoriasActuais.map((cat) => {
                const activo = categoriaActiva === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoriaChip,
                      { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                      activo && { backgroundColor: cores.principal, borderColor: cores.principal },
                    ]}
                    onPress={() => setCategoriaActiva(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icone}
                      size={16}
                      color={activo ? '#FFFFFF' : cores.textoPrincipal}
                    />
                    <Text style={[
                      styles.categoriaChipTexto,
                      { color: activo ? '#FFFFFF' : cores.textoPrincipal },
                    ]}>
                      {cat.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Destaques */}
        {anunciosDestaque.length > 0 && (
          <View style={styles.seccao}>
            <View style={styles.seccaoHeader}>
              <View>
                <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
                  Destaques
                </Text>
                <Text style={[styles.seccaoSubtitulo, { color: cores.textoSecundario }]}>
                  {grupoActivo === 'todos' ? 'Em todas as categorias' : grupoActivoInfo.nome}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.seccaoLink, { color: cores.principal }]}>Ver tudo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destaquesContainer}
              snapToInterval={252}
              decelerationRate="fast"
            >
              {anunciosDestaque.map((anuncio) => (
                <CardAnuncio
                  key={anuncio.id}
                  anuncio={anuncio}
                  variante="horizontal"
                  onPress={() => abrirAnuncio(anuncio.id)}
                  onFavoritar={() => toggleFavorito(anuncio.id)}
                  favoritado={favoritos.includes(anuncio.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista principal */}
        <View style={styles.seccao}>
          <View style={styles.seccaoHeader}>
            <View>
              <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
                {grupoActivo === 'todos' ? 'Todos os anúncios' : grupoActivoInfo.nome}
              </Text>
              <Text style={[styles.seccaoSubtitulo, { color: cores.textoSecundario }]}>
                {autenticado
                  ? `${anunciosFiltrados.length} ${anunciosFiltrados.length === 1 ? 'resultado' : 'resultados'}`
                  : `${totalVisivelVisitante} de ${anunciosFiltrados.length} anúncios disponíveis`}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={irParaFiltrosAvancados}>
              <Ionicons name="options-outline" size={22} color={cores.textoPrincipal} />
            </TouchableOpacity>
          </View>

          {anunciosVisiveis.length > 0 ? (
            <View style={styles.anunciosLista}>
              {anunciosVisiveis.map((anuncio) => (
                <CardAnuncio
                  key={anuncio.id}
                  anuncio={anuncio}
                  variante="vertical"
                  onPress={() => abrirAnuncio(anuncio.id)}
                  onFavoritar={() => toggleFavorito(anuncio.id)}
                  favoritado={favoritos.includes(anuncio.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.vazioContainer}>
              <View
                style={[
                  styles.vazioIconeCirculo,
                  { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil },
                ]}
              >
                <MaterialCommunityIcons name="magnify-close" size={40} color={cores.textoTerciario} />
              </View>
              <Text style={[styles.vazioTitulo, { color: cores.textoPrincipal }]}>
                Sem resultados
              </Text>
              <Text style={[styles.vazioDescricao, { color: cores.textoSecundario }]}>
                Não encontrámos anúncios com esses filtros
              </Text>
              <TouchableOpacity
                style={[styles.vazioBotao, { backgroundColor: cores.principal }]}
                onPress={() => {
                  setGrupoActivo('todos');
                  setCategoriaActiva('todos');
                  setFaixaActiva('todos');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.vazioBotaoTexto}>Limpar filtros</Text>
              </TouchableOpacity>
            </View>
          )}

          {!autenticado && anunciosFiltrados.length > totalVisivelVisitante && (
            <View style={styles.guestPrompt}>
              <View style={styles.guestPromptIcon}>
                <Ionicons name="lock-closed-outline" size={22} color={LARANJA_MARCA} />
              </View>
              <Text style={styles.guestPromptTitle}>Há muito mais para descobrir</Text>
              <Text style={styles.guestPromptText}>
                Já exploraste os primeiros anúncios. Cria uma conta gratuita ou inicia sessão para continuar a explorar o GoHome, consultar detalhes e guardar os teus favoritos.
              </Text>
              <TouchableOpacity
                style={styles.guestPromptButton}
                onPress={() => router.push({ pathname: '/auth', params: { returnTo: '/(procurador)' } } as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.guestPromptButtonText}>Criar conta ou entrar</Text>
                <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* ============ MODAL: FAIXAS DE PREÇO ============ */}
      <Modal visible={modalPrecosVisivel} transparent animationType="slide" onRequestClose={() => setModalPrecosVisivel(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalPrecosVisivel(false)} />
          <View style={[styles.modalContent, { backgroundColor: cores.fundoElevado, maxHeight: '78%' }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />
            <View style={styles.modalHeader}>
              <View style={styles.precoIconWrap}>
                <Ionicons name="pricetag-outline" size={22} color={LARANJA_MARCA} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>Escolhe o teu orçamento</Text>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSecundario }]}>Mostramos anúncios dentro desta faixa</Text>
              </View>
              <TouchableOpacity onPress={() => setModalPrecosVisivel(false)} style={styles.modalFechar}>
                <Ionicons name="close" size={21} color={cores.textoSecundario} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={FAIXAS_PRECO}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const activo = faixaActiva === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.faixaRow,
                      {
                        backgroundColor: activo ? 'rgba(254, 138, 0, 0.08)' : cores.fundoSuave,
                        borderColor: activo ? LARANJA_MARCA : cores.bordaSubtil,
                      },
                    ]}
                    onPress={() => { setFaixaActiva(item.id); setModalPrecosVisivel(false); }}
                    activeOpacity={0.82}
                  >
                    <View style={[
                      styles.faixaRowIcon,
                      { backgroundColor: activo ? LARANJA_MARCA : 'rgba(254, 138, 0, 0.12)' },
                    ]}>
                      <MaterialCommunityIcons
                        name={item.icone as any}
                        size={20}
                        color={activo ? '#FFFFFF' : LARANJA_MARCA}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.faixaRowTitle, { color: cores.textoPrincipal }]}>{item.label}</Text>
                      <Text style={[styles.faixaRowSubtitle, { color: cores.textoSecundario }]}>{item.descricao}</Text>
                    </View>
                    {activo && <Ionicons name="checkmark-circle" size={22} color={LARANJA_MARCA} />}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: Spacing.lg }}
            />
          </View>
        </View>
      </Modal>

      {/* ============ MODAL: TROCAR LOCALIZAÇÃO ============ */}
      <Modal
        visible={modalLocalizacaoVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalLocalizacaoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalLocalizacaoVisivel(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: cores.fundoElevado }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIconeContainer, { backgroundColor: cores.principalClara }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color={cores.principal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>Localização actual</Text>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSecundario }]}>Escolhe onde estás</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalLocalizacaoVisivel(false)}
                style={[styles.modalFechar, { backgroundColor: cores.fundoSuave }]}
              >
                <Ionicons name="close" size={20} color={cores.textoSecundario} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.gpsBotao}
              onPress={() => {
                setModalLocalizacaoVisivel(false);
                detectarLocalizacaoGPS(false);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={cores.gradiente}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#FFFFFF" />
              <Text style={styles.gpsBotaoTexto}>Usar localização actual (GPS)</Text>
            </TouchableOpacity>

            <View style={styles.modalSeparador}>
              <View style={[styles.modalSeparadorLinha, { backgroundColor: cores.bordaSubtil }]} />
              <Text style={[styles.modalSeparadorTexto, { color: cores.textoTerciario }]}>
                OU ESCOLHE MANUALMENTE
              </Text>
              <View style={[styles.modalSeparadorLinha, { backgroundColor: cores.bordaSubtil }]} />
            </View>

            <FlatList
              data={PROVINCIAS_MOCAMBIQUE}
              keyExtractor={(item) => item.nome}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const activa = localizacaoActual.provincia === item.nome;
                return (
                  <TouchableOpacity
                    style={[
                      styles.provinciaCard,
                      { backgroundColor: cores.fundoSuave },
                      activa && { backgroundColor: cores.principalClara, borderWidth: 1, borderColor: cores.principal },
                    ]}
                    onPress={() => {
                      setLocalizacaoActual({ cidade: item.capital, provincia: item.nome });
                      setModalLocalizacaoVisivel(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.provinciaIcone,
                      { backgroundColor: activa ? cores.principal : cores.principalClara },
                    ]}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={18}
                        color={activa ? '#FFFFFF' : cores.principal}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.provinciaNome,
                        { color: activa ? cores.principal : cores.textoPrincipal },
                      ]}>
                        {item.nome}
                      </Text>
                      <Text style={[styles.provinciaCapital, { color: cores.textoSecundario }]}>
                        {`Capital: ${item.capital}`}
                      </Text>
                    </View>
                    {activa && (
                      <Ionicons name="checkmark-circle" size={20} color={cores.principal} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  heroSafeArea: { backgroundColor: AZUL_HERO_INICIO },
  heroHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: 'rgba(0, 130, 222, 0.22)',
    right: -75,
    top: 25,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 62,
  },
  brandLogo: { fontSize: 31, fontWeight: '900', letterSpacing: -1.5 },
  brandGo: { color: '#FFFFFF' },
  brandHome: { color: LARANJA_MARCA },
  heroNotification: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  heroNotificationBadge: {
    position: 'absolute',
    top: 1,
    right: 0,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: LARANJA_MARCA,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroNotificationBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  heroWelcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 23,
    minHeight: 130,
  },
  heroWelcomeText: { flex: 1, zIndex: 2, paddingRight: 4 },
  heroEyebrow: { color: 'rgba(255,255,255,0.78)', fontSize: 16, fontWeight: '600', marginBottom: 5 },
  heroTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, fontWeight: '900', letterSpacing: -0.6 },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 13,
    paddingVertical: 5,
    paddingRight: 8,
  },
  heroLocationText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  heroIllustration: {
    width: 95,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  heroIllustrationCircle: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(0, 130, 222, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroOrangeAccent: {
    position: 'absolute',
    height: 4,
    width: 76,
    borderRadius: 4,
    backgroundColor: LARANJA_MARCA,
    bottom: 92,
    left: Spacing.lg,
  },
  precoSection: { marginTop: 18, paddingHorizontal: Spacing.lg },
  precoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  precoHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  precoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: 'rgba(254, 138, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  precoTitle: { fontSize: 15, fontWeight: '800' },
  precoSubtitle: { fontSize: 11, marginTop: 2 },
  verFaixasButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  verFaixasText: { fontSize: 12, fontWeight: '800' },
  precoChips: { gap: 8, paddingRight: Spacing.lg },
  precoChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  precoChipText: { fontSize: 12, fontWeight: '800' },
  faixaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 9,
  },
  faixaRowIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faixaRowTitle: { fontSize: 14, fontWeight: '800' },
  faixaRowSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  guestPrompt: {
    marginTop: 20,
    marginHorizontal: Spacing.lg,
    padding: 20,
    borderRadius: 22,
    backgroundColor: 'rgba(254, 138, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(254, 138, 0, 0.25)',
    alignItems: 'center',
  },
  guestPromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(254, 138, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestPromptTitle: { color: '#17324D', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  guestPromptText: {
    color: '#687789',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 16,
  },
  guestPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: LARANJA_MARCA,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignSelf: 'stretch',
  },
  guestPromptButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  container: { flex: 1 },
  safeArea: {},

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 76,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.sm,
  },
  avatarLetra: { ...Typography.h3, color: '#FFFFFF', fontWeight: '800' },
  headerSaudacao: { ...Typography.bodyBold, marginBottom: 2 },
  headerLocalizacao: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headerLocalizacaoTexto: { ...Typography.caption, fontWeight: '600' },
  headerBotao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    ...Sombras.sm,
  },
  headerBotaoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  headerBotaoBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },

  scrollContent: { paddingBottom: Spacing.xxxl + 12 },

  pesquisaContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingTop: 0,
    marginTop: 22,
    gap: Spacing.sm,
    zIndex: 5,
  },
  pesquisaInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: Spacing.base,
    paddingVertical: 15,
    gap: Spacing.sm,
    borderWidth: 1,
    minHeight: 54,
    ...Sombras.sm,
  },
  pesquisaInput: { flex: 1, ...Typography.body, padding: 0 },
  filtrosBotao: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.colorida(LARANJA_MARCA),
  },

  gruposSeccao: { marginTop: Spacing.xl },
  gruposTitulo: {
    ...Typography.h2,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  gruposContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  grupoCard: {
    width: Math.min(126, width * 0.34),
    minHeight: 132,
    padding: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    ...Sombras.sm,
    alignItems: 'flex-start',
  },
  grupoIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  grupoNome: {
    ...Typography.bodyBold,
    fontSize: 13,
    marginBottom: 2,
  },
  grupoContagem: {
    ...Typography.caption,
    fontSize: 10,
  },

  bannerContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
    ...Sombras.colorida(LARANJA_MARCA),
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  bannerDotActivo: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  banner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    minHeight: 172,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerLeft: { flex: 1, zIndex: 2 },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  bannerBadgeText: {
    ...Typography.captionBold,
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bannerTitulo: { ...Typography.displayMD, color: '#FFFFFF', marginBottom: Spacing.xs },
  bannerSubtitulo: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: Spacing.md,
  },
  bannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  bannerCTAText: { ...Typography.buttonSmall, color: '#FFFFFF' },
  bannerRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
    position: 'relative',
  },
  bannerCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bannerCircle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  seccao: { marginTop: Spacing.xl },
  seccaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  seccaoTitulo: { ...Typography.h2, letterSpacing: -0.35 },
  seccaoSubtitulo: { ...Typography.caption, marginTop: 2 },
  seccaoLink: { ...Typography.button },

  categoriasContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  categoriaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  categoriaChipTexto: { ...Typography.bodyBold },

  destaquesContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md },

  anunciosLista: { paddingHorizontal: Spacing.lg, gap: Spacing.md },

  vazioContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  vazioIconeCirculo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  vazioTitulo: { ...Typography.h3, marginBottom: Spacing.xs, textAlign: 'center' },
  vazioDescricao: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  vazioBotao: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Sombras.colorida(LARANJA_MARCA),
  },
  vazioBotaoTexto: { ...Typography.button, color: '#FFFFFF' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    maxHeight: '84%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
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
  modalTitulo: { ...Typography.h3 },
  modalSubtitulo: { ...Typography.caption, marginTop: 2 },
  modalFechar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  gpsBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    overflow: 'hidden',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    ...Sombras.colorida('#0082DE'),
  },
  gpsBotaoTexto: { ...Typography.button, color: '#FFFFFF' },
  modalSeparador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  modalSeparadorLinha: { flex: 1, height: 1 },
  modalSeparadorTexto: { ...Typography.captionBold, fontSize: 10, letterSpacing: 1 },

  provinciaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
    gap: Spacing.md,
  },
  provinciaIcone: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  provinciaNome: { ...Typography.bodyBold },
  provinciaCapital: { ...Typography.caption, marginTop: 2 },
});