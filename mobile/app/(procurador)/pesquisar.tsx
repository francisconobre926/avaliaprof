import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import { ANUNCIOS_MOCK, apenasDisponiveis } from '../../src/data/anuncios-mock';
import { Anuncio } from '../../src/types';
import CardAnuncio from '../../src/components/CardAnuncio';

const { width } = Dimensions.get('window');

// ============================================================
// CORES OFICIAIS GOHOME (do logo)
// ============================================================
const AZUL_HERO_INICIO = '#003A66';
const AZUL_HERO_MEIO = '#0061A6';
const AZUL_HERO_FIM = '#0082DE';
const LARANJA_MARCA = '#FE8A00';
const LARANJA_ESCURO = '#CB6E00';

const pesquisasRecentes = [
  'T2 mobilado Beira',
  'Quarto perto UZ',
  'Apartamento Ponta-Gêa',
  'Casa para venda Matacuane',
];

const zonasPopulares = [
  { nome: 'Macúti', anuncios: 47, icone: 'beach' as const },
  { nome: 'Ponta-Gêa', anuncios: 32, icone: 'city' as const },
  { nome: 'Matacuane', anuncios: 28, icone: 'home-group' as const },
  { nome: 'Manga', anuncios: 19, icone: 'school' as const },
];

export default function PesquisarScreen() {
  const router = useRouter();
  const cores = useCores();
  const [pesquisa, setPesquisa] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [favoritos, setFavoritos] = useState<string[]>([]);

  // Filtra anúncios reais pelo termo (título, descrição, cidade, bairro, categoria)
  const resultados = useMemo<Anuncio[]>(() => {
    if (!pesquisa.trim()) return [];
    const termo = pesquisa.trim().toLocaleLowerCase('pt-PT');
    const base = apenasDisponiveis(ANUNCIOS_MOCK);
    return base.filter(anuncio =>
      [
        anuncio.titulo,
        anuncio.descricaoCurta,
        anuncio.descricao,
        anuncio.categoria,
        anuncio.cidade,
        anuncio.bairro,
        anuncio.provincia,
      ]
        .filter(Boolean)
        .some(valor => String(valor).toLocaleLowerCase('pt-PT').includes(termo))
    );
  }, [pesquisa]);

  const toggleFavorito = (id: string) => {
    setFavoritos(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const abrirAnuncio = (id: string) => {
    router.push(`/anuncio/${id}` as any);
  };

  const limparPesquisa = () => {
    setPesquisa('');
    setMostrarResultados(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle="light-content" backgroundColor={AZUL_HERO_INICIO} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LinearGradient
          colors={[AZUL_HERO_INICIO, AZUL_HERO_MEIO, AZUL_HERO_FIM]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerHero}
        >
          <View pointerEvents="none" style={styles.heroGlow} />

          <View style={styles.headerTopLine}>
            <Text style={styles.brandName}>
              <Text style={styles.brandGo}>Go</Text>
              <Text style={styles.brandHome}>Home</Text>
            </Text>
            <View style={styles.headerBadge}>
              <Ionicons name="search" size={14} color={LARANJA_MARCA} />
              <Text style={styles.headerBadgeText}>EXPLORAR</Text>
            </View>
          </View>

          <Text style={styles.headerTitulo}>Encontra o que procuras</Text>
          <Text style={styles.headerSubtitulo}>
            Imóveis, veículos, espaços e muito mais num só lugar.
          </Text>

          {/* Barra de pesquisa */}
          <View style={styles.pesquisaContainer}>
            <View style={[styles.pesquisaInputWrapper, { backgroundColor: cores.fundoElevado }]}>
              <Ionicons name="search" size={21} color={AZUL_HERO_MEIO} />
              <TextInput
                style={[styles.pesquisaInput, { color: cores.textoPrincipal }]}
                placeholder="Pesquisar imóveis, veículos, espaços..."
                placeholderTextColor={cores.textoTerciario}
                value={pesquisa}
                onChangeText={(text) => {
                  setPesquisa(text);
                  setMostrarResultados(text.length > 0);
                }}
                autoFocus={false}
                returnKeyType="search"
                clearButtonMode="never"
              />
              {pesquisa.length > 0 && (
                <TouchableOpacity onPress={limparPesquisa} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={cores.textoTerciario} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.filtrosBotao} activeOpacity={0.8}>
              <LinearGradient
                colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons name="options" size={21} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerAccent} />
        </LinearGradient>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!mostrarResultados ? (
          <>
            {/* Filtros rápidos */}
            <View style={styles.seccao}>
              <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
                Filtros rápidos
              </Text>
              <View style={styles.filtrosRapidos}>
                <FiltroRapido
                  icone="cash"
                  cor={Colors.verde}
                  label="Preço"
                  valor="Até 15K MT"
                  cores={cores}
                />
                <FiltroRapido
                  icone="bed"
                  cor={cores.principal}
                  label="Quartos"
                  valor="1-3"
                  cores={cores}
                />
                <FiltroRapido
                  icone="location"
                  cor={LARANJA_MARCA}
                  label="Zona"
                  valor="Beira"
                  cores={cores}
                />
                <FiltroRapido
                  icone="business"
                  cor={Colors.premium}
                  label="Tipo"
                  valor="Todos"
                  cores={cores}
                />
              </View>
            </View>

            {/* Pesquisas recentes */}
            <View style={styles.seccao}>
              <View style={styles.seccaoHeader}>
                <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
                  Pesquisas recentes
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.seccaoLink, { color: cores.principal }]}>Limpar</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentesContainer}>
                {pesquisasRecentes.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.recenteItem,
                      { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPesquisa(item);
                      setMostrarResultados(true);
                    }}
                  >
                    <View style={[styles.recenteIcone, { backgroundColor: cores.fundoSuave }]}>
                      <Ionicons name="time-outline" size={16} color={cores.textoSecundario} />
                    </View>
                    <Text style={[styles.recenteTexto, { color: cores.textoPrincipal }]}>
                      {item}
                    </Text>
                    <Ionicons
                      name="arrow-up-outline"
                      size={16}
                      color={cores.textoTerciario}
                      style={{ transform: [{ rotate: '45deg' }] }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Zonas populares */}
            <View style={styles.seccao}>
              <View style={styles.seccaoHeader}>
                <View>
                  <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
                    Zonas populares
                  </Text>
                  <Text style={[styles.seccaoSubtitulo, { color: cores.textoSecundario }]}>
                    Áreas com mais anúncios
                  </Text>
                </View>
              </View>
              <View style={styles.zonasGrid}>
                {zonasPopulares.map((zona) => (
                  <TouchableOpacity
                    key={zona.nome}
                    style={[styles.zonaCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setPesquisa(zona.nome);
                      setMostrarResultados(true);
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(254, 138, 0, 0.08)', 'rgba(0, 130, 222, 0.04)']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={[styles.zonaIcone, { backgroundColor: cores.fundoElevado }]}>
                      <MaterialCommunityIcons
                        name={zona.icone}
                        size={26}
                        color={cores.principal}
                      />
                    </View>
                    <Text style={[styles.zonaNome, { color: cores.textoPrincipal }]}>
                      {zona.nome}
                    </Text>
                    <Text style={[styles.zonaAnuncios, { color: cores.textoSecundario }]}>
                      {zona.anuncios} anúncios
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Card "O que procuras?" — Alerta por pesquisa guardada */}
            <TouchableOpacity style={styles.procuraCard} activeOpacity={0.9}>
              <LinearGradient
                colors={cores.gradiente}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.procuraCardConteudo}>
                <View style={styles.procuraCardIcone}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={30} color="#FFFFFF" />
                </View>
                <View style={styles.procuraCardInfo}>
                  <Text style={styles.procuraCardTitulo}>Cria um alerta</Text>
                  <Text style={styles.procuraCardTexto}>
                    Diz-nos o que queres e avisamos quando aparecer
                  </Text>
                </View>
                <View style={styles.procuraCardCTA}>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Resultados reais filtrados pelo termo */}
            <View style={styles.resultadosHeader}>
              <Text style={[styles.resultadosTitulo, { color: cores.textoSecundario }]}>
                {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'} para{' '}
                <Text style={[styles.resultadosDestaque, { color: cores.textoPrincipal }]}>
                  "{pesquisa}"
                </Text>
              </Text>
              <TouchableOpacity
                style={[styles.ordenarBotao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
              >
                <Ionicons name="swap-vertical" size={16} color={cores.textoPrincipal} />
                <Text style={[styles.ordenarTexto, { color: cores.textoPrincipal }]}>Ordenar</Text>
              </TouchableOpacity>
            </View>

            {resultados.length > 0 ? (
              <View style={styles.resultadosLista}>
                {resultados.map((anuncio) => (
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
                <View style={[styles.vazioIconeCirculo, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
                  <MaterialCommunityIcons name="magnify-close" size={44} color={cores.textoTerciario} />
                </View>
                <Text style={[styles.vazioTitulo, { color: cores.textoPrincipal }]}>
                  Sem resultados
                </Text>
                <Text style={[styles.vazioDescricao, { color: cores.textoSecundario }]}>
                  Não encontrámos nada para "{pesquisa}". Tenta uma pesquisa diferente ou usa os filtros.
                </Text>
                <TouchableOpacity
                  style={styles.vazioBotao}
                  onPress={limparPesquisa}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.vazioBotaoTexto}>Limpar pesquisa</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// COMPONENTE: Filtro rápido
// ============================================================
function FiltroRapido({ icone, cor, label, valor, cores }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.filtroRapido,
        { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.filtroRapidoIcone, { backgroundColor: `${cor}15` }]}>
        <Ionicons name={icone} size={16} color={cor} />
      </View>
      <View style={styles.filtroRapidoInfo}>
        <Text style={[styles.filtroRapidoLabel, { color: cores.textoSecundario }]}>{label}</Text>
        <Text style={[styles.filtroRapidoValor, { color: cores.textoPrincipal }]}>{valor}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { backgroundColor: AZUL_HERO_INICIO },
  headerHero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 130, 222, 0.18)',
    right: -70,
    top: 20,
  },
  headerTopLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  brandName: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  brandGo: { color: '#FFFFFF' },
  brandHome: { color: LARANJA_MARCA },
  headerBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  headerTitulo: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitulo: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 5,
    marginBottom: 20,
  },
  headerAccent: {
    position: 'absolute',
    width: 88,
    height: 4,
    borderRadius: 3,
    backgroundColor: LARANJA_MARCA,
    bottom: 0,
    left: Spacing.lg,
  },
  pesquisaContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  pesquisaInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: Spacing.sm,
    minHeight: 56,
    ...Sombras.sm,
  },
  pesquisaInput: {
    flex: 1,
    ...Typography.body,
    padding: 0,
    fontSize: 14,
  },
  filtrosBotao: {
    width: 56,
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.colorida(LARANJA_MARCA),
  },
  scrollContent: { paddingTop: Spacing.lg, paddingBottom: 28 },
  seccao: { marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  seccaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  seccaoTitulo: { ...Typography.h2, marginBottom: Spacing.md },
  seccaoSubtitulo: { ...Typography.caption, marginTop: 2 },
  seccaoLink: { ...Typography.button, fontSize: 13 },
  filtrosRapidos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filtroRapido: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    ...Sombras.sm,
  },
  filtroRapidoIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtroRapidoInfo: { flex: 1 },
  filtroRapidoLabel: { ...Typography.caption },
  filtroRapidoValor: { ...Typography.bodyBold, marginTop: 1 },
  recentesContainer: { gap: Spacing.sm },
  recenteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  recenteIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recenteTexto: { ...Typography.body, flex: 1 },
  zonasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  zonaCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Sombras.sm,
  },
  zonaIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  zonaNome: { ...Typography.h4 },
  zonaAnuncios: { ...Typography.caption, marginTop: 2 },
  procuraCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Sombras.colorida('#0082DE'),
  },
  procuraCardConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  procuraCardIcone: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  procuraCardInfo: { flex: 1 },
  procuraCardTitulo: { ...Typography.h3, color: '#FFFFFF' },
  procuraCardTexto: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  procuraCardCTA: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Resultados
  resultadosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultadosTitulo: { ...Typography.body, flex: 1 },
  resultadosDestaque: { fontWeight: '700' },
  ordenarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 4,
    borderWidth: 1,
  },
  ordenarTexto: { ...Typography.bodyBold, fontSize: 13 },
  resultadosLista: { paddingHorizontal: Spacing.lg, gap: Spacing.md },

  // Estado vazio
  vazioContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  vazioIconeCirculo: {
    width: 108,
    height: 108,
    borderRadius: 54,
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
    lineHeight: 21,
    maxWidth: 310,
  },
  vazioBotao: {
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    ...Sombras.colorida(LARANJA_MARCA),
  },
  vazioBotaoTexto: {
    ...Typography.button,
    color: '#FFFFFF',
  },
});