import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import { ANUNCIOS_MOCK, apenasDisponiveis } from '../../src/data/anuncios-mock';
import CardAnuncio from '../../src/components/CardAnuncio';

// ============================================================
// CORES OFICIAIS GOHOME (do logo)
// ============================================================
const AZUL_HERO_INICIO = '#003A66';
const AZUL_HERO_MEIO = '#0061A6';
const AZUL_HERO_FIM = '#0082DE';
const LARANJA_MARCA = '#FE8A00';
const LARANJA_ESCURO = '#CB6E00';

export default function FavoritosScreen() {
  const router = useRouter();
  const cores = useCores();

  // ⚠️ Favoritos ainda in-memory (sem persistência).
  // TODO: criar favoritosStore (Zustand + AsyncStorage) na próxima fase.
  const [favoritados, setFavoritados] = useState<string[]>(['1', '2', '3']);
  const [aba, setAba] = useState<'anuncios' | 'colecoes'>('anuncios');

  // Usa ANUNCIOS_MOCK (consistente com o resto da app)
  const favoritos = apenasDisponiveis(ANUNCIOS_MOCK).filter(
    anuncio => favoritados.includes(anuncio.id),
  );

  const removerFavorito = (id: string) => {
    setFavoritados(actual => actual.filter(favoritoId => favoritoId !== id));
  };

  const abrirAnuncio = (id: string) => {
    router.push(`/anuncio/${id}` as any);
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
          style={styles.hero}
        >
          <View pointerEvents="none" style={styles.heroGlow} />

          <View style={styles.brandRow}>
            <Text style={styles.brandText}>
              <Text style={styles.brandGo}>Go</Text>
              <Text style={styles.brandHome}>Home</Text>
            </Text>
            <View style={styles.brandPill}>
              <Ionicons name="heart" size={12} color={LARANJA_MARCA} />
              <Text style={styles.brandPillText}>GUARDADOS</Text>
            </View>
          </View>

          <View style={styles.heroTextBlock}>
            <Text style={styles.heroEyebrow}>OS TEUS GUARDADOS</Text>
            <Text style={styles.headerTitulo}>Favoritos</Text>
            <Text style={styles.heroDescricao}>
              Guarda os anúncios que combinam contigo.
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statIconWrap}>
              <Ionicons name="heart" size={18} color={LARANJA_MARCA} />
            </View>
            <View style={styles.statTextWrap}>
              <Text style={styles.statNumber}>{favoritos.length}</Text>
              <Text style={styles.statLabel}>
                {favoritos.length === 1 ? 'anúncio guardado' : 'anúncios guardados'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <Text style={styles.statHint}>Acede quando quiseres</Text>
          </View>
        </LinearGradient>

        <View style={[styles.tabsShell, { backgroundColor: cores.fundo }]}>
          <View style={[styles.abas, { backgroundColor: cores.fundoSuave }]}>
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === 'anuncios' }}
              style={[
                styles.aba,
                aba === 'anuncios' && [styles.abaActiva, { backgroundColor: cores.fundoElevado }],
              ]}
              onPress={() => setAba('anuncios')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="heart"
                size={17}
                color={aba === 'anuncios' ? LARANJA_MARCA : cores.textoTerciario}
              />
              <Text
                style={[
                  styles.abaTexto,
                  { color: aba === 'anuncios' ? cores.textoPrincipal : cores.textoTerciario },
                ]}
              >
                Anúncios
              </Text>
              <View
                style={[
                  styles.abaBadge,
                  { backgroundColor: aba === 'anuncios' ? LARANJA_MARCA : cores.bordaMedia },
                ]}
              >
                <Text
                  style={[
                    styles.abaBadgeTexto,
                    { color: aba === 'anuncios' ? '#FFFFFF' : cores.textoSecundario },
                  ]}
                >
                  {favoritos.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === 'colecoes' }}
              style={[
                styles.aba,
                aba === 'colecoes' && [styles.abaActiva, { backgroundColor: cores.fundoElevado }],
              ]}
              onPress={() => setAba('colecoes')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="folder-heart"
                size={19}
                color={aba === 'colecoes' ? LARANJA_MARCA : cores.textoTerciario}
              />
              <Text
                style={[
                  styles.abaTexto,
                  { color: aba === 'colecoes' ? cores.textoPrincipal : cores.textoTerciario },
                ]}
              >
                Colecções
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {aba === 'anuncios' ? (
          favoritos.length > 0 ? (
            <>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={[styles.sectionTitle, { color: cores.textoPrincipal }]}>
                    A tua selecção
                  </Text>
                  <Text style={[styles.sectionSubtitle, { color: cores.textoSecundario }]}>
                    Anúncios que marcaste para rever
                  </Text>
                </View>
                <View style={[styles.sectionIcon, { backgroundColor: cores.principalClara }]}>
                  <Ionicons name="bookmark-outline" size={18} color={cores.principal} />
                </View>
              </View>
              <View style={styles.lista}>
                {favoritos.map((anuncio) => (
                  <CardAnuncio
                    key={anuncio.id}
                    anuncio={anuncio}
                    variante="vertical"
                    onPress={() => abrirAnuncio(anuncio.id)}
                    onFavoritar={() => removerFavorito(anuncio.id)}
                    favoritado={true}
                  />
                ))}
              </View>
            </>
          ) : (
            <EstadoVazio
              icone="heart-outline"
              titulo="Ainda não tens favoritos"
              descricao="Quando encontrares um anúncio interessante, toca no coração para o guardar aqui e consultá-lo mais tarde."
              cta="Explorar anúncios"
              onPress={() => router.push('/(procurador)')}
              cores={cores}
            />
          )
        ) : (
          <View style={styles.colecoesContainer}>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: cores.textoPrincipal }]}>
                  As tuas colecções
                </Text>
                <Text style={[styles.sectionSubtitle, { color: cores.textoSecundario }]}>
                  Organiza por localização ou tema
                </Text>
              </View>
              <View style={[styles.sectionIcon, { backgroundColor: cores.principalClara }]}>
                <MaterialCommunityIcons name="folder-heart-outline" size={20} color={cores.principal} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.colecaoCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[AZUL_HERO_INICIO, AZUL_HERO_FIM]}
                style={styles.colecaoIcone}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="school-outline" size={27} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.colecaoInfo}>
                <Text style={[styles.colecaoNome, { color: cores.textoPrincipal }]}>Perto da UZ</Text>
                <Text style={[styles.colecaoContagem, { color: cores.textoSecundario }]}>
                  5 anúncios · Zona universitária
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={cores.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.colecaoCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                style={styles.colecaoIcone}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="waves" size={27} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.colecaoInfo}>
                <Text style={[styles.colecaoNome, { color: cores.textoPrincipal }]}>Vista para o mar</Text>
                <Text style={[styles.colecaoContagem, { color: cores.textoSecundario }]}>
                  3 anúncios · Zona costeira
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={cores.textoTerciario} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.novaColecaoBotao,
                { backgroundColor: 'rgba(254, 138, 0, 0.04)', borderColor: LARANJA_MARCA },
              ]}
              activeOpacity={0.85}
            >
              <View style={styles.novaColecaoIcone}>
                <Ionicons name="add" size={23} color={LARANJA_MARCA} />
              </View>
              <View style={styles.novaColecaoTextWrap}>
                <Text style={[styles.novaColecaoTexto, { color: cores.textoPrincipal }]}>
                  Criar nova colecção
                </Text>
                <Text style={[styles.novaColecaoDescricao, { color: cores.textoSecundario }]}>
                  Agrupa anúncios por preferência
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
            </TouchableOpacity>

            <Text style={[styles.notaColecoes, { color: cores.textoTerciario }]}>
              As colecções apresentadas são exemplos visuais. A criação e gestão de colecções será ligada à funcionalidade da aplicação numa fase futura.
            </Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// COMPONENTE: Estado vazio
// ============================================================
type EstadoVazioProps = {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descricao: string;
  cta: string;
  onPress: () => void;
  cores: any;
};

function EstadoVazio({ icone, titulo, descricao, cta, onPress, cores }: EstadoVazioProps) {
  return (
    <View style={styles.estadoVazio}>
      <View style={styles.estadoVazioIconeCirculo}>
        <LinearGradient
          colors={['rgba(0, 130, 222, 0.08)', 'rgba(254, 138, 0, 0.08)']}
          style={styles.emptyIconGradient}
        >
          <Ionicons name={icone} size={43} color={cores.principal} />
          <View style={styles.emptyIconAccent}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </View>
      <Text style={[styles.estadoVazioTitulo, { color: cores.textoPrincipal }]}>{titulo}</Text>
      <Text style={[styles.estadoVazioDescricao, { color: cores.textoSecundario }]}>
        {descricao}
      </Text>
      <TouchableOpacity style={styles.estadoVazioBotao} onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={[LARANJA_MARCA, LARANJA_ESCURO]}
          style={styles.estadoVazioBotaoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.estadoVazioBotaoTexto}>{cta}</Text>
          <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { backgroundColor: AZUL_HERO_INICIO },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 23,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(0, 130, 222, 0.18)',
    right: -60,
    top: 20,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandText: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  brandGo: { color: '#FFFFFF' },
  brandHome: { color: LARANJA_MARCA },
  brandPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  brandPillText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroTextBlock: { marginTop: 25 },
  heroEyebrow: {
    color: LARANJA_MARCA,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    marginBottom: 6,
  },
  headerTitulo: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroDescricao: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 21,
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statIconWrap: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: { marginLeft: 10 },
  statNumber: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 21 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginTop: 2 },
  statDivider: {
    width: 1,
    height: 29,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 13,
  },
  statHint: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 16 },

  tabsShell: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 2,
  },
  abas: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 15,
    gap: 5,
  },
  aba: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 7,
  },
  abaActiva: {
    ...Sombras.sm,
  },
  abaTexto: { fontSize: 13, fontWeight: '700' },
  abaBadge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abaBadgeTexto: { fontSize: 10, fontWeight: '800' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 21, paddingBottom: 10 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  sectionIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: { paddingHorizontal: 16, gap: 13 },

  // ===== Estado vazio =====
  estadoVazio: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 25,
  },
  estadoVazioIconeCirculo: {
    width: 112,
    height: 112,
    borderRadius: 34,
    overflow: 'hidden',
    marginBottom: 23,
    transform: [{ rotate: '-3deg' }],
  },
  emptyIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
  },
  emptyIconAccent: {
    position: 'absolute',
    right: 13,
    bottom: 13,
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: LARANJA_MARCA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoVazioTitulo: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 9,
    letterSpacing: -0.4,
  },
  estadoVazioDescricao: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 310,
  },
  estadoVazioBotao: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Sombras.colorida(LARANJA_MARCA),
  },
  estadoVazioBotaoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 21,
    paddingVertical: 14,
    gap: 10,
  },
  estadoVazioBotaoTexto: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  // ===== Colecções =====
  colecoesContainer: { paddingHorizontal: 17, gap: 12 },
  colecaoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 18,
    gap: 13,
    borderWidth: 1,
    ...Sombras.sm,
  },
  colecaoIcone: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colecaoInfo: { flex: 1 },
  colecaoNome: { fontSize: 14, fontWeight: '800' },
  colecaoContagem: { fontSize: 11, marginTop: 5 },
  novaColecaoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 11,
    marginTop: 2,
  },
  novaColecaoIcone: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: 'rgba(254, 138, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  novaColecaoTextWrap: { flex: 1 },
  novaColecaoTexto: { fontSize: 13, fontWeight: '800' },
  novaColecaoDescricao: { fontSize: 10, marginTop: 3 },
  notaColecoes: { fontSize: 10, lineHeight: 15, marginTop: 5, paddingHorizontal: 3 },
});