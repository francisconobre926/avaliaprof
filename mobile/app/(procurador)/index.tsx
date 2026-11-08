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
import { Colors, Sombras } from '../../src/theme/colors';
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
import { carregarCatalogo } from '../../src/data/catalogo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFiltrosStore, aplicarFiltros, contarFiltros, PRECO_MIN, PRECO_MAX, Comodidade } from '../../src/store/filtrosStore';
import { formatarDataCurta, formatarMT, noitesEntre } from '../../src/utils/reservas';
import { useFavoritosStore } from '../../src/store/favoritosStore';
import TopBar from '../../src/components/TopBar';
import CartaoEspaco from '../../src/components/CartaoEspaco';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
const { width } = Dimensions.get('window');

// ============================================================
// CORES DE MARCA GOHOME (do logo oficial)
// Azul principal: #0A6BC0  ·  Laranja destaque: #E8760A
// ============================================================
const COR_ACENTO = Colors.azul;      // Laranja GoHome oficial

// ============ GRUPOS DO MARKETPLACE ============
interface GrupoInfo {
  id: GrupoCategoria | 'todos';
  nome: string;
  icone: keyof typeof Ionicons.glyphMap;
}

const GRUPOS: GrupoInfo[] = [
  { id: 'todos', nome: 'Tudo', icone: 'grid-outline' },
  { id: 'imoveis', nome: 'Casas', icone: 'home-outline' },
  { id: 'espacos', nome: 'Salões de eventos', icone: 'sparkles-outline' },
  { id: 'veiculos', nome: 'Veículos', icone: 'car-outline' },
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
  const [anunciosCatalogo, setAnunciosCatalogo] = useState<Anuncio[]>(ANUNCIOS_MOCK);
  const [grupoActivo, setGrupoActivo] = useState<string>('imoveis');
  const [categoriaActiva, setCategoriaActiva] = useState('todos');
  const filtros = useFiltrosStore(st => st.filtros);
  const definirFiltros = useFiltrosStore(st => st.definir);
  const limparTudo = useFiltrosStore(st => st.limpar);
  const favoritos = useFavoritosStore(st => st.ids);
  const alternarFavorito = useFavoritosStore(st => st.alternar);
  const carregarFavoritos = useFavoritosStore(st => st.carregar);
  const [modalLocalizacaoVisivel, setModalLocalizacaoVisivel] = useState(false);
  const [modalPrecosVisivel, setModalPrecosVisivel] = useState(false);
  const [detectandoGPS, setDetectandoGPS] = useState(false);
  const [localizacaoActual, setLocalizacaoActual] = useState({
    cidade: 'Beira',
    provincia: 'Sofala',
  });

  useEffect(() => {
    detectarLocalizacaoGPS(true);
  }, []);

  // Actualiza o catálogo sempre que o procurador regressa à Home.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      carregarFavoritos();
      carregarCatalogo().then(lista => { if (activo) setAnunciosCatalogo(lista); });
      return () => { activo = false; };
    }, [])
  );

  useEffect(() => {
    if (filtros.tipo === 'salao') setGrupoActivo('espacos');
    else if (filtros.tipo) setGrupoActivo('imoveis');
  }, [filtros.tipo]);

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

  anunciosFiltrados = aplicarFiltros(anunciosFiltrados, filtros);

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

  const toggleFavorito = (id: string) => alternarFavorito(id);

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

  const faixaActiva = FAIXAS_PRECO.find(f => f.id !== 'todos' && f.min === filtros.precoMin && (f.max ?? PRECO_MAX) === filtros.precoMax)?.id ?? (filtros.precoMin > PRECO_MIN || filtros.precoMax < PRECO_MAX ? 'personalizado' : 'todos');
  const quartosMin = filtros.quartos;
  const piscina = filtros.comodidades.includes('piscina');
  const nNoites = filtros.entrada && filtros.saida ? noitesEntre(filtros.entrada, filtros.saida) : 0;
  const periodo = nNoites > 0 ? `${formatarDataCurta(filtros.entrada!)}–${formatarDataCurta(filtros.saida!)}` : undefined;
  const iniciais = usuario?.nome?.trim()
    ? usuario.nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?';
  const filtrosAtivos = contarFiltros(filtros);
  const ciclarQuartos = () => definirFiltros({ quartos: quartosMin >= 4 ? 0 : quartosMin + 1 });
  const alternarPiscina = () => definirFiltros({
    comodidades: piscina ? filtros.comodidades.filter(c => c !== 'piscina') : [...filtros.comodidades, 'piscina' as Comodidade],
  });
  const limparFiltros = () => {
    setGrupoActivo('imoveis');
    limparTudo();
  };
  const abrirPesquisa = () => router.push('/(procurador)/pesquisar' as any);
  const abrirMapa = () => router.push('/mapa' as any);
  const irParaPerfil = () => router.push('/(procurador)/perfil' as any);

  const tituloLista = grupoActivo === 'imoveis' ? 'Casas em destaque'
    : grupoActivo === 'espacos' ? 'Salões em destaque'
    : `${grupoActivoInfo.nome} em destaque`;
  const unidadeContagem = grupoActivo === 'imoveis' ? 'casas' : grupoActivo === 'espacos' ? 'salões' : 'anúncios';

  const listaVisivel = autenticado ? anunciosFiltrados : anunciosFiltrados.slice(0, limiteVisitante);

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        stickyHeaderIndices={[]}
      >
        {/* ============ CABEÇALHO ============ */}
        <View style={styles.cabecalho}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => setModalLocalizacaoVisivel(true)} activeOpacity={0.6} accessibilityLabel="Mudar localização" style={styles.localizacaoLinha}>
              <Text style={[styles.localizacaoValor, { color: cores.textoSecundario }]} numberOfLines={1}>
                {detectandoGPS ? 'a detectar…' : localizacaoActual.cidade}
              </Text>
              <Ionicons name="chevron-down" size={13} color={cores.textoSecundario} />
            </TouchableOpacity>
            <Text style={[styles.saudacao, { color: cores.textoPrincipal }]} numberOfLines={1}>
              {getPrimeiroNome ? `Olá, ${getPrimeiroNome}` : 'Olá'}
            </Text>
          </View>
          <TouchableOpacity onPress={irParaPerfil} style={[styles.avatar, { backgroundColor: cores.principal }]} accessibilityLabel="Perfil">
            <Text style={styles.avatarTexto}>{iniciais}</Text>
          </TouchableOpacity>
        </View>

        {/* ============ PESQUISA ============ */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={abrirPesquisa}
          style={[styles.pesquisa, Sombras.md, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
          accessibilityRole="search"
          accessibilityLabel="Pesquisar: onde, datas, pessoas"
        >
          <Ionicons name="search" size={20} color={cores.textoPrincipal} />
          <Text style={[styles.pesquisaTexto, { color: cores.textoTerciario }]} numberOfLines={1}>
            Onde? · Datas · Pessoas
          </Text>
          <TouchableOpacity
            onPress={irParaFiltrosAvancados}
            style={[styles.pesquisaFiltro, { backgroundColor: cores.textoPrincipal }]}
            accessibilityLabel="Filtros"
          >
            <Ionicons name="options" size={18} color={cores.fundo} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ============ SEPARADORES: CASAS / SALÕES / … ============ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.abas} style={[styles.abasLinha, { borderBottomColor: cores.bordaSubtil }]}>
          {GRUPOS.filter(g => g.id !== 'todos').map(g => {
            const activo = grupoActivo === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGrupoActivo(g.id)}
                style={[styles.aba, activo && { borderBottomColor: cores.principal }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
              >
                <Text style={[styles.abaTexto, { color: activo ? cores.textoPrincipal : cores.textoSecundario }, activo && { fontFamily: Fonte.corpoBold }]}>
                  {g.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ============ CHIPS DE FILTRO ============ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <TouchableOpacity onPress={irParaFiltrosAvancados} style={[styles.chip, { backgroundColor: cores.textoPrincipal }]} accessibilityLabel="Filtros">
            <Ionicons name="options-outline" size={16} color={cores.fundo} />
            <Text style={[styles.chipTexto, { color: cores.fundo, fontFamily: Fonte.corpoBold }]}>Filtros</Text>
            {filtrosAtivos > 0 && (
              <View style={[styles.chipContador, { backgroundColor: cores.principal }]}>
                <Text style={styles.chipContadorTexto}>{filtrosAtivos}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={irParaFiltrosAvancados} style={[styles.chip, { backgroundColor: faixaActiva !== 'todos' ? cores.principalClara : cores.fundoSuave }]}>
            <Text style={[styles.chipTexto, { color: faixaActiva !== 'todos' ? cores.principal : cores.textoPrincipal }]}>Preço ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={ciclarQuartos} style={[styles.chip, { backgroundColor: quartosMin > 0 ? cores.principalClara : cores.fundoSuave }]}>
            <Text style={[styles.chipTexto, { color: quartosMin > 0 ? cores.principal : cores.textoPrincipal }]}>
              {quartosMin > 0 ? `${quartosMin}${quartosMin === 4 ? '+' : ''} quartos ▾` : 'Quartos ▾'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={alternarPiscina} style={[styles.chip, { backgroundColor: piscina ? cores.principalClara : cores.fundoSuave }]} accessibilityState={{ selected: piscina }}>
            <Text style={[styles.chipTexto, { color: piscina ? cores.principal : cores.textoPrincipal }]}>Piscina</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ============ LISTA ============ */}
        <View style={styles.listaCabecalho}>
          <Text style={[styles.listaTitulo, { color: cores.textoPrincipal }]}>{tituloLista}</Text>
          <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14 }}>
            {anunciosFiltrados.length} {unidadeContagem}
          </Text>
        </View>

        {listaVisivel.length > 0 ? (
          <View style={styles.lista}>
            {listaVisivel.map(anuncio => (
              <CartaoEspaco
                key={anuncio.id}
                anuncio={anuncio}
                onPress={() => abrirAnuncio(anuncio.id)}
                onFavoritar={() => toggleFavorito(anuncio.id)}
                favoritado={favoritos.includes(anuncio.id)}
                periodo={periodo}
                totalPeriodo={periodo ? `${formatarMT(anuncio.preco * nNoites)} · ${nNoites} ${nNoites === 1 ? 'noite' : 'noites'}` : undefined}
              />
            ))}
          </View>
        ) : (
          <View style={styles.vazioContainer}>
            <View style={[styles.vazioIconeCirculo, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
              <Icone name="magnify-close" size={40} color={cores.textoTerciario} />
            </View>
            <Text style={[styles.vazioTitulo, { color: cores.textoPrincipal }]}>Sem resultados</Text>
            <Text style={[styles.vazioDescricao, { color: cores.textoSecundario }]}>
              Não encontrámos anúncios com esses filtros
            </Text>
            <TouchableOpacity style={[styles.vazioBotao, { backgroundColor: cores.principal }]} onPress={limparFiltros} activeOpacity={0.8}>
              <Text style={styles.vazioBotaoTexto}>Limpar filtros</Text>
            </TouchableOpacity>
          </View>
        )}

        {!autenticado && anunciosFiltrados.length > listaVisivel.length && (
          <View style={styles.guestPrompt}>
            <View style={styles.guestPromptIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.carvao} />
            </View>
            <Text style={styles.guestPromptTitle}>Há muito mais para descobrir</Text>
            <Text style={styles.guestPromptText}>
              Cria uma conta gratuita ou inicia sessão para continuar a explorar o GoHome, consultar detalhes e guardar os teus favoritos.
            </Text>
            <TouchableOpacity
              style={styles.guestPromptButton}
              onPress={() => router.push({ pathname: '/auth', params: { returnTo: '/(procurador)' } } as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.guestPromptButtonText}>Criar conta ou entrar</Text>
              <Ionicons name="arrow-forward" size={17} color={Colors.branco} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ============ BOTÃO FLUTUANTE: MAPA ============ */}
      <TouchableOpacity
        onPress={abrirMapa}
        activeOpacity={0.9}
        style={[styles.flutuante, Sombras.lg, { backgroundColor: cores.textoPrincipal }]}
        accessibilityLabel="Ver no mapa"
      >
        <Ionicons name="map-outline" size={18} color={cores.fundo} />
        <Text style={[styles.flutuanteTexto, { color: cores.fundo }]}>Mapa</Text>
      </TouchableOpacity>

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
                    onPress={() => { definirFiltros({ precoMin: item.min, precoMax: item.max ?? PRECO_MAX }); setModalPrecosVisivel(false); }}
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
              <Icone name="crosshairs-gps" size={20} color={Colors.branco} />
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
                        color={activa ? Colors.branco : cores.principal}
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
  scrollContent: { paddingBottom: 24 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  saudacao: { ...Typography.tituloPagina },
  cabecalhoBotao: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: Colors.branco, fontFamily: Fonte.corpoBold, fontSize: 16 },
  pesquisa: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 16,
    borderRadius: 999, borderWidth: 1, paddingLeft: 20, paddingRight: 8, height: 60,
  },
  pesquisaTexto: { flex: 1, fontFamily: Fonte.corpo, fontSize: 16 },
  pesquisaFiltro: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  abasLinha: { marginTop: 20, marginHorizontal: 20, borderBottomWidth: 1, flexGrow: 0 },
  abas: { gap: 22 },
  aba: { paddingBottom: 10, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginBottom: -1 },
  abaTexto: { fontFamily: Fonte.corpoMedio, fontSize: 16 },
  chips: { paddingHorizontal: 20, gap: 10, paddingTop: 16, paddingBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, height: 44, borderRadius: 999 },
  chipTexto: { fontFamily: Fonte.corpoSemi, fontSize: 14 },
  chipContador: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  chipContadorTexto: { color: Colors.branco, fontFamily: Fonte.corpoSemi, fontSize: 12 },
  listaCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, marginTop: 24, marginBottom: 14 },
  listaTitulo: { ...Typography.tituloSecao },
  lista: { paddingHorizontal: 20 },
  flutuante: {
    position: 'absolute', alignSelf: 'center', bottom: 18, flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 26, height: 52, borderRadius: 999,
  },
  flutuanteTexto: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  localizacaoLinha: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4 },
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
  faixaRowSubtitle: { fontFamily: Fonte.corpo, fontSize: 13, marginTop: 2 },
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
    backgroundColor: 'rgba(32, 33, 36, 0.03)',
    borderWidth: 1,
    borderColor: Colors.borda,
    alignItems: 'center',
  },
  guestPromptIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(32, 33, 36, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guestPromptTitle: { color: Colors.carvao, fontSize: 20, fontFamily: Fonte.tituloSemi, letterSpacing: -0.3, textAlign: 'center' },
  guestPromptText: {
    color: Colors.textoSecundario,
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
    backgroundColor: COR_ACENTO,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignSelf: 'stretch',
  },
  guestPromptButtonText: { color: Colors.branco, fontSize: 13, fontFamily: Fonte.corpoSemi },
  container: { flex: 1 },
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
    ...Sombras.colorida(COR_ACENTO),
  },
  vazioBotaoTexto: { ...Typography.button, color: Colors.branco },
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
    ...Sombras.colorida(Colors.azul),
  },
  gpsBotaoTexto: { ...Typography.button, color: Colors.branco },
  modalSeparador: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  modalSeparadorLinha: { flex: 1, height: 1 },
  modalSeparadorTexto: { ...Typography.captionBold, fontSize: 12, letterSpacing: 1 },
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
