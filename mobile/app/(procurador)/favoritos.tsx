import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sombras } from '../../src/theme/colors';
import { Spacing, Typography } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import { ANUNCIOS_MOCK, apenasDisponiveis } from '../../src/data/anuncios-mock';
import CardAnuncio from '../../src/components/CardAnuncio';
import TopBar from '../../src/components/TopBar';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
// ============================================================
// CORES OFICIAIS GOHOME (do logo)
// ============================================================
const AZUL_HERO_INICIO = '#0A6BC0';   // Azul GoHome (ícone das colecções)
const AZUL_HERO_FIM = '#095FAA';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';

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
      <TopBar />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Título simples no fundo papel — sem hero */}
        <View style={styles.cabecalho}>
          <Text style={[styles.titulo, { color: cores.textoPrincipal }]} accessibilityRole="header">
            Favoritos
          </Text>
          <Text style={[styles.tituloContagem, { color: cores.textoSecundario }]}>
            {favoritos.length} {favoritos.length === 1 ? 'anúncio guardado' : 'anúncios guardados'}
          </Text>
        </View>

        <View style={styles.abas}>
          {([
            { chave: 'anuncios', rotulo: 'Anúncios', contagem: favoritos.length },
            { chave: 'colecoes', rotulo: 'Colecções' },
          ] as const).map(item => {
            const activa = aba === item.chave;
            return (
              <TouchableOpacity
                key={item.chave}
                accessibilityRole="tab"
                accessibilityState={{ selected: activa }}
                style={[
                  styles.aba,
                  activa
                    ? { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal }
                    : { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                ]}
                onPress={() => setAba(item.chave)}
                activeOpacity={0.85}
              >
                <Text style={[styles.abaTexto, { color: activa ? cores.fundo : cores.textoPrincipal }]}>
                  {item.rotulo}
                </Text>
                {'contagem' in item && (
                  <Text style={[styles.abaContagem, { color: activa ? cores.fundo : cores.textoSecundario }]}>
                    {item.contagem}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

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
                <Icone name="folder-heart-outline" size={20} color={cores.principal} />
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
                <Icone name="school-outline" size={27} color="#FFFFFF" />
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
                <Icone name="waves" size={27} color="#FFFFFF" />
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
                { backgroundColor: 'rgba(232, 118, 10, 0.04)', borderColor: LARANJA_MARCA },
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
          colors={['rgba(10, 107, 192, 0.08)', 'rgba(232, 118, 10, 0.08)']}
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
  cabecalho: { paddingHorizontal: Spacing.lg, marginTop: 16 },
  titulo: { ...Typography.h1 },
  tituloContagem: { fontFamily: Fonte.corpo, fontSize: 13, marginTop: 2 },

  abas: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, paddingTop: 14, paddingBottom: 20 },
  aba: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  abaTexto: { fontSize: 13, fontFamily: Fonte.corpoSemi },
  abaContagem: { fontSize: 12, fontFamily: Fonte.corpoMedio, fontVariant: ['tabular-nums'] },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 10 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontFamily: Fonte.corpoSemi, letterSpacing: -0.3 },
  sectionSubtitle: { fontFamily: Fonte.corpo, fontSize: 11, lineHeight: 16, marginTop: 3 },
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
    fontFamily: Fonte.tituloSemi,
    textAlign: 'center',
    marginBottom: 9,
    letterSpacing: -0.4,
  },
  estadoVazioDescricao: {
    fontFamily: Fonte.corpo, fontSize: 13,
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
  estadoVazioBotaoTexto: { color: '#FFFFFF', fontSize: 13, fontFamily: Fonte.corpoSemi },

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
  colecaoNome: { fontSize: 14, fontFamily: Fonte.corpoSemi },
  colecaoContagem: { fontFamily: Fonte.corpo, fontSize: 11, marginTop: 5 },
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
    backgroundColor: 'rgba(232, 118, 10, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  novaColecaoTextWrap: { flex: 1 },
  novaColecaoTexto: { fontSize: 13, fontFamily: Fonte.corpoSemi },
  novaColecaoDescricao: { fontFamily: Fonte.corpo, fontSize: 10, marginTop: 3 },
  notaColecoes: { fontFamily: Fonte.corpo, fontSize: 10, lineHeight: 15, marginTop: 5, paddingHorizontal: 3 },
});