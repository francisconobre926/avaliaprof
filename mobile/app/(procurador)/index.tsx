import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Pressable,
  FlatList,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import {
  ANUNCIOS_MOCK,
  filtrarPorGrupo,
  filtrarPorCategoria,
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
import TopBar from '../../src/components/TopBar';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
const { width } = Dimensions.get('window');

// ============================================================
// CORES DE MARCA GOHOME (do logo oficial)
// Azul principal: #0A6BC0  ·  Laranja destaque: #E8760A
// ============================================================
const LARANJA_MARCA = '#E8760A';      // Laranja GoHome oficial

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
  icone: keyof typeof Ionicons.glyphMap;
}

const GRUPOS: GrupoInfo[] = [
  { id: 'todos', nome: 'Tudo', icone: 'grid-outline' },
  { id: 'imoveis', nome: 'Imóveis', icone: 'home-outline' },
  { id: 'veiculos', nome: 'Veículos', icone: 'car-outline' },
  { id: 'espacos', nome: 'Espaços', icone: 'sparkles-outline' },
  { id: 'alojamento', nome: 'Alojamento', icone: 'bed-outline' },
  { id: 'comercial', nome: 'Comercial', icone: 'storefront-outline' },
  { id: 'equipamentos', nome: 'Equipam.', icone: 'construct-outline' },
  { id: 'terrenos', nome: 'Terrenos', icone: 'map-outline' },
];

// ============ CATEGORIAS POR GRUPO ============
interface CategoriaInfo {
  id: CategoriaAnuncio | 'todos' | (string & {}); // inclui categorias legacy (ex.: espaco_casamento)
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
      <TopBar />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Localização activa — define a zona dos resultados */}
        <TouchableOpacity
          style={styles.localizacaoLinha}
          onPress={() => setModalLocalizacaoVisivel(true)}
          activeOpacity={0.6}
          accessibilityLabel="Mudar localização"
        >
          <Ionicons
            name={detectandoGPS ? 'locate-outline' : 'location-outline'}
            size={15}
            color={cores.textoSecundario}
          />
          <Text style={[styles.localizacaoRotulo, { color: cores.textoSecundario }]}>A procurar em</Text>
          <Text numberOfLines={1} style={[styles.localizacaoValor, { color: cores.textoPrincipal }]}>
            {detectandoGPS ? 'a detectar…' : localizacaoActual.cidade}
          </Text>
          <Ionicons name="chevron-down" size={14} color={cores.textoPrincipal} />
        </TouchableOpacity>

        {/* ============ PESQUISA ============ */}
        <View style={[styles.filtroCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <View style={styles.pesquisaLinha}>
            <Ionicons name="search" size={18} color={cores.textoSecundario} />
            <TextInput
              value={termoPesquisa}
              onChangeText={setTermoPesquisa}
              placeholder="Casa, carro, salão de eventos…"
              placeholderTextColor={cores.textoTerciario}
              style={[styles.pesquisaInput, { color: cores.textoPrincipal }]}
              returnKeyType="search"
              accessibilityLabel="Pesquisar anúncios"
            />
            {termoPesquisa.length > 0 && (
              <TouchableOpacity onPress={() => setTermoPesquisa('')} hitSlop={8} accessibilityLabel="Limpar pesquisa">
                <Ionicons name="close-circle" size={17} color={cores.textoTerciario} />
              </TouchableOpacity>
            )}
            <View style={[styles.pesquisaDivisor, { backgroundColor: cores.bordaSubtil }]} />
            <TouchableOpacity
              style={styles.filtrosBotao}
              activeOpacity={0.7}
              onPress={irParaFiltrosAvancados}
              accessibilityLabel="Filtros"
            >
              <Ionicons name="options-outline" size={19} color={cores.textoPrincipal} />
              {faixaActiva !== 'todos' && (
                <View style={[styles.filtrosPonto, { borderColor: cores.fundoElevado }]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ GRUPOS DO MARKETPLACE ============ */}
        <View style={styles.gruposSeccao}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gruposContainer}
          >
            {GRUPOS.map((grupo) => {
              const activo = grupoActivo === grupo.id;
              return (
                <TouchableOpacity
                  key={grupo.id}
                  style={styles.grupoItem}
                  onPress={() => setGrupoActivo(grupo.id)}
                  activeOpacity={0.75}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activo }}
                >
                  <View
                    style={[
                      styles.grupoIcone,
                      activo
                        ? { backgroundColor: cores.textoPrincipal }
                        : { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil, borderWidth: 1 },
                    ]}
                  >
                    <Ionicons
                      name={activo ? (grupo.icone.replace('-outline', '') as any) : grupo.icone}
                      size={22}
                      color={activo ? cores.fundo : cores.textoPrincipal}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.grupoNome,
                      { color: activo ? cores.textoPrincipal : cores.textoSecundario },
                      activo && { fontFamily: Fonte.corpoSemi },
                    ]}
                  >
                    {grupo.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
                      activo && { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal },
                    ]}
                    onPress={() => setCategoriaActiva(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icone}
                      size={16}
                      color={activo ? cores.fundo : cores.textoPrincipal}
                    />
                    <Text style={[
                      styles.categoriaChipTexto,
                      { color: activo ? cores.fundo : cores.textoPrincipal },
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
                    <Icone name="tag" size={11} color="#FFFFFF" />
                    <Text style={styles.bannerBadgeText}>PROMOÇÃO LANÇAMENTO</Text>
                  </View>
                  <Text style={styles.bannerTitulo}>50% de desconto</Text>
                  <Text style={styles.bannerSubtitulo}>
                    {`Em TUDO, durante 3 meses\nem ${localizacaoActual.cidade}`}
                  </Text>
                  <View style={styles.bannerCTA}>
                    <Text style={styles.bannerCTAText}>Saber mais</Text>
                    <Ionicons name="arrow-forward" size={14} color="#15181D" />
                  </View>
                </View>
                <View style={styles.bannerRight}>
                  <View style={styles.bannerCircle1} />
                  <View style={styles.bannerCircle2} />
                  <Icone name="home-city" size={72} color="rgba(255, 255, 255, 0.28)" />
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
                colors={['#1E2836', '#16202E']}
                style={styles.banner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerLeft}>
                  <View style={styles.bannerBadge}>
                    <Icone name="gift-outline" size={12} color="#FFFFFF" />
                    <Text style={styles.bannerBadgeText}>CONVIDA E GANHA</Text>
                  </View>
                  <Text style={styles.bannerTitulo}>Ganha 10%</Text>
                  <Text style={styles.bannerSubtitulo}>
                    {`Partilha ${meuCodigo || 'o teu código'}\ne recebe sempre que pagarem`}
                  </Text>
                  <View style={styles.bannerCTA}>
                    <Text style={styles.bannerCTAText}>Partilhar agora</Text>
                    <Ionicons name="arrow-forward" size={14} color="#15181D" />
                  </View>
                </View>
                <View style={styles.bannerRight}>
                  <View style={styles.bannerCircle1} />
                  <View style={styles.bannerCircle2} />
                  <Icone name="account-multiple-plus" size={72} color="rgba(255, 255, 255, 0.28)" />
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
                <Icone name="magnify-close" size={40} color={cores.textoTerciario} />
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
                <Ionicons name="lock-closed-outline" size={20} color="#15181D" />
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
            <View style={styles.faixasCabecalho}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.faixasTitulo, { color: cores.textoPrincipal }]}>Orçamento mensal</Text>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSecundario }]}>Valores em meticais (MT)</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalPrecosVisivel(false)}
                style={[styles.modalFechar, { backgroundColor: cores.fundoSuave }]}
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={20} color={cores.textoPrincipal} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={FAIXAS_PRECO}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.faixaSeparador, { backgroundColor: cores.bordaSubtil }]} />
              )}
              renderItem={({ item }) => {
                const activo = faixaActiva === item.id;
                return (
                  <TouchableOpacity
                    style={styles.faixaRow}
                    onPress={() => { setFaixaActiva(item.id); setModalPrecosVisivel(false); }}
                    activeOpacity={0.6}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: activo }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.faixaRowTitle, { color: cores.textoPrincipal }]}>{item.label}</Text>
                      <Text style={[styles.faixaRowSubtitle, { color: cores.textoSecundario }]} numberOfLines={1}>
                        {item.id === 'todos' ? item.descricao : `${item.publicoAlvo} · ${item.descricao}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.faixaRadio,
                        activo
                          ? { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal }
                          : { borderColor: cores.bordaMedia },
                      ]}
                    >
                      {activo && <Ionicons name="checkmark" size={14} color={cores.fundo} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
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
                <Icone name="map-marker-radius" size={24} color={cores.principal} />
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
              <Icone name="crosshairs-gps" size={20} color="#FFFFFF" />
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
                      <Icone
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
  localizacaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 14,
    marginHorizontal: Spacing.lg,
    paddingVertical: 4,
  },
  localizacaoRotulo: { fontFamily: Fonte.corpo, fontSize: 13 },
  localizacaoValor: { fontFamily: Fonte.corpoSemi, fontSize: 13, flexShrink: 1 },
  faixasCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 8,
  },
  faixasTitulo: { ...Typography.h2 },
  faixaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
  },
  faixaSeparador: { height: StyleSheet.hairlineWidth },
  faixaRowTitle: {
    fontFamily: Fonte.tituloSemi,
    fontSize: 16,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  faixaRowSubtitle: { fontFamily: Fonte.corpo, fontSize: 12.5, marginTop: 2 },
  faixaRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrompt: {
    marginTop: 20,
    marginHorizontal: Spacing.lg,
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(21, 24, 29, 0.03)',
    borderWidth: 1,
    borderColor: '#E7E5DF',
    alignItems: 'center',
  },
  guestPromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(21, 24, 29, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestPromptTitle: { color: '#15181D', fontSize: 19, fontFamily: Fonte.tituloSemi, letterSpacing: -0.3, textAlign: 'center' },
  guestPromptText: {
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 13,
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
  guestPromptButtonText: { color: '#FFFFFF', fontSize: 13, fontFamily: Fonte.corpoSemi },
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
  avatarLetra: { ...Typography.h3, color: '#FFFFFF', fontFamily: Fonte.corpoSemi },
  headerSaudacao: { ...Typography.bodyBold, marginBottom: 2 },
  headerLocalizacao: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headerLocalizacaoTexto: { ...Typography.caption, fontFamily: Fonte.corpoSemi },
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
    backgroundColor: '#C2412D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  headerBotaoBadgeText: { color: '#FFFFFF', fontSize: 9, fontFamily: Fonte.corpoSemi },

  scrollContent: { paddingBottom: Spacing.xxxl + 12 },

  filtroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  pesquisaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
    height: 48,
  },
  pesquisaInput: { flex: 1, fontFamily: Fonte.corpo, fontSize: 15, padding: 0 },
  pesquisaDivisor: { width: StyleSheet.hairlineWidth, height: 22 },
  filtrosBotao: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtrosPonto: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: LARANJA_MARCA,
  },
  gruposSeccao: { marginTop: 20 },
  gruposContainer: {
    paddingHorizontal: Spacing.lg,
    gap: 4,
  },
  grupoItem: { width: 72, alignItems: 'center' },
  grupoIcone: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  grupoNome: { fontFamily: Fonte.corpoMedio, fontSize: 12 },

  bannerContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  bannerDotActivo: {
    width: 18,
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
    backgroundColor: LARANJA_MARCA,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
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
    opacity: 0.72,
    marginBottom: Spacing.md,
  },
  bannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  bannerCTAText: { ...Typography.buttonSmall, color: '#15181D' },
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerCircle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    ...Sombras.colorida('#0A6BC0'),
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