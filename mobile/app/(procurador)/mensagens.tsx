import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';

// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_HERO_INICIO = '#003A66';
const AZUL_HERO_MEIO = '#0061A6';
const AZUL_HERO_FIM = '#0082DE';
const LARANJA_MARCA = '#FE8A00';
const LARANJA_ESCURO = '#CB6E00';

const conversas = [
  {
    id: '1',
    nome: 'Maria Chissano',
    anuncio: 'Quarto individual perto da UZ',
    ultimaMensagem: 'Sim, ainda está disponível. Quando queres visitar?',
    hora: '14:30',
    naoLidas: 2,
    online: true,
    verificado: true,
  },
  {
    id: '2',
    nome: 'Imobiliária Costa Sol',
    anuncio: 'Apartamento T2 Ponta-Gêa',
    ultimaMensagem: 'Muito obrigada pelo interesse! Podemos marcar visita esta semana.',
    hora: '11:45',
    naoLidas: 0,
    online: false,
    verificado: true,
  },
  {
    id: '3',
    nome: 'João Nhamirre',
    anuncio: 'Casa T3 com quintal',
    ultimaMensagem: 'A casa tem 3 quartos e 2 casas de banho.',
    hora: 'Ontem',
    naoLidas: 1,
    online: false,
    verificado: false,
  },
  {
    id: '4',
    nome: 'Ana Muchanga',
    anuncio: 'Quarto partilhado Manga',
    ultimaMensagem: 'Perfeito, aguardo a tua visita amanhã às 10h ✓✓',
    hora: 'Segunda',
    naoLidas: 0,
    online: false,
    verificado: false,
  },
];

export default function MensagensScreen() {
  const router = useRouter();
  const cores = useCores();
  const [pesquisa, setPesquisa] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'naoLidas' | 'verificados' | 'favoritos'>('todas');

  const conversasFiltradas = conversas.filter((conversa) => {
    const termo = pesquisa.trim().toLowerCase();
    const correspondePesquisa =
      !termo ||
      conversa.nome.toLowerCase().includes(termo) ||
      conversa.anuncio.toLowerCase().includes(termo) ||
      conversa.ultimaMensagem.toLowerCase().includes(termo);
    const correspondeFiltro =
      filtro === 'todas' ||
      (filtro === 'naoLidas' && conversa.naoLidas > 0) ||
      (filtro === 'verificados' && conversa.verificado) ||
      (filtro === 'favoritos' && conversa.id === '1');
    return correspondePesquisa && correspondeFiltro;
  });

  const totalNaoLidas = conversas.reduce((total, conversa) => total + conversa.naoLidas, 0);

  const chip = (id: typeof filtro, texto: string, icone?: React.ReactNode) => {
    const activo = filtro === id;
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.filtroChip,
          { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
          activo && { backgroundColor: cores.principal, borderColor: cores.principal },
        ]}
        onPress={() => setFiltro(id)}
        activeOpacity={0.8}
      >
        {icone}
        <Text style={[
          styles.filtroChipTexto,
          { color: activo ? '#FFFFFF' : cores.textoSecundario },
        ]}>
          {texto}
        </Text>
      </TouchableOpacity>
    );
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

          <View style={styles.marcaLinha}>
            <Text style={styles.marcaTexto}>
              <Text style={{ color: '#FFFFFF' }}>Go</Text>
              <Text style={{ color: LARANJA_MARCA }}>Home</Text>
            </Text>
            <View style={styles.heroEtiqueta}>
              <Ionicons name="chatbubbles" size={13} color={LARANJA_MARCA} />
              <Text style={styles.heroEtiquetaTexto}>CHAT</Text>
            </View>
          </View>
          <View style={styles.header}>
            <View style={styles.headerTexto}>
              <Text style={styles.headerTitulo}>Mensagens</Text>
              <Text style={styles.headerSubtitulo}>
                Acompanha as conversas sobre os teus anúncios
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerBotao}
              onPress={() => setPesquisa('')}
              activeOpacity={0.8}
              accessibilityLabel="Limpar pesquisa"
            >
              <Ionicons name="search-outline" size={21} color={AZUL_HERO_MEIO} />
            </TouchableOpacity>
          </View>
          <View style={styles.resumo}>
            <View style={styles.resumoIcone}>
              <Ionicons name="mail-unread-outline" size={18} color={LARANJA_MARCA} />
            </View>
            <View style={styles.resumoTexto}>
              <Text style={styles.resumoNumero}>{conversas.length} conversas</Text>
              <Text style={styles.resumoLegenda}>{totalNaoLidas} mensagens por ler</Text>
            </View>
            <View style={styles.resumoPonto} />
            <Text style={styles.resumoEstado}>Actualizado</Text>
          </View>
          <View style={[styles.pesquisaWrapper, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
            <Ionicons name="search" size={19} color={cores.textoSecundario} />
            <TextInput
              style={[styles.pesquisaInput, { color: cores.textoPrincipal }]}
              placeholder="Pesquisar pessoas, anúncios..."
              placeholderTextColor={cores.textoTerciario}
              value={pesquisa}
              onChangeText={setPesquisa}
              returnKeyType="search"
            />
            {pesquisa.length > 0 && (
              <TouchableOpacity onPress={() => setPesquisa('')}>
                <Ionicons name="close-circle" size={19} color={cores.textoSecundario} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtros}>
          <View style={styles.filtrosContainer}>
            {chip('todas', 'Todas')}
            {chip('naoLidas', `Não lidas (${conversas.filter(c => c.naoLidas > 0).length})`,
              <View style={[styles.filtroChipDot, { backgroundColor: LARANJA_MARCA }]} />)}
            {chip('verificados', 'Verificados',
              <Ionicons name="checkmark-circle" size={15} color={filtro === 'verificados' ? '#FFFFFF' : '#16A34A'} />)}
            {chip('favoritos', 'Favoritos',
              <Ionicons name="star" size={14} color={filtro === 'favoritos' ? '#FFFFFF' : LARANJA_MARCA} />)}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listaConteudo}>
        <View style={styles.listaCabecalho}>
          <Text style={[styles.listaTitulo, { color: cores.textoPrincipal }]}>
            {filtro === 'naoLidas' ? 'Por ler' : filtro === 'verificados' ? 'Verificados' : filtro === 'favoritos' ? 'Favoritos' : 'Recentes'}
          </Text>
          <Text style={[styles.listaContagem, { color: cores.textoSecundario }]}>
            {conversasFiltradas.length} {conversasFiltradas.length === 1 ? 'conversa' : 'conversas'}
          </Text>
        </View>
        {conversasFiltradas.length > 0 ? conversasFiltradas.map((conversa) => (
          <TouchableOpacity
            key={conversa.id}
            style={[
              styles.conversa,
              { backgroundColor: cores.fundoElevado, borderBottomColor: cores.bordaSubtil },
              conversa.naoLidas > 0 && { backgroundColor: cores.fundoSuave },
            ]}
            activeOpacity={0.75}
            onPress={() => router.push(`/chat/${conversa.id}` as any)}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={conversa.id === '2' ? [LARANJA_MARCA, LARANJA_ESCURO] : [AZUL_HERO_INICIO, AZUL_HERO_FIM]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarLetra}>{conversa.nome.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
              {conversa.online && <View style={styles.onlineDot} />}
              {conversa.verificado && (
                <View style={[styles.verificadoBadge, { backgroundColor: LARANJA_MARCA }]}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>
            <View style={styles.conversaInfo}>
              <View style={styles.conversaTop}>
                <Text style={[styles.conversaNome, { color: cores.textoPrincipal }]} numberOfLines={1}>
                  {conversa.nome}
                </Text>
                <Text style={[
                  styles.conversaHora,
                  { color: cores.textoTerciario },
                  conversa.naoLidas > 0 && { color: LARANJA_MARCA, fontWeight: '800' },
                ]}>
                  {conversa.hora}
                </Text>
              </View>
              <Text style={[styles.conversaAnuncio, { color: cores.textoSecundario }]} numberOfLines={1}>
                <MaterialCommunityIcons name="home-outline" size={13} color={LARANJA_MARCA} /> {conversa.anuncio}
              </Text>
              <View style={styles.conversaBottom}>
                <Text
                  style={[
                    styles.conversaMensagem,
                    { color: cores.textoSecundario },
                    conversa.naoLidas > 0 && { color: cores.textoPrincipal, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {conversa.ultimaMensagem}
                </Text>
                {conversa.naoLidas > 0 && (
                  <View style={[styles.naoLidasBadge, { backgroundColor: LARANJA_MARCA }]}>
                    <Text style={styles.naoLidasTexto}>{conversa.naoLidas}</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={cores.textoTerciario} />
          </TouchableOpacity>
        )) : (
          <View style={styles.estadoVazio}>
            <View style={[styles.estadoIcone, { backgroundColor: cores.principalClara }]}>
              <Ionicons name={pesquisa ? 'search-outline' : 'chatbubble-ellipses-outline'} size={34} color={cores.principal} />
            </View>
            <Text style={[styles.estadoTitulo, { color: cores.textoPrincipal }]}>
              Nenhuma conversa encontrada
            </Text>
            <Text style={[styles.estadoDescricao, { color: cores.textoSecundario }]}>
              {pesquisa ? 'Experimenta outro nome, anúncio ou termo de pesquisa.' : 'Não existem conversas nesta categoria.'}
            </Text>
            <TouchableOpacity
              style={[styles.limparBotao, { backgroundColor: cores.principal }]}
              onPress={() => { setPesquisa(''); setFiltro('todas'); }}
            >
              <Text style={styles.limparBotaoTexto}>Ver todas as conversas</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { backgroundColor: AZUL_HERO_INICIO },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 15,
    position: 'relative',
    overflow: 'hidden',
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
  marcaLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marcaTexto: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
  heroEtiqueta: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroEtiquetaTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  headerTexto: { flex: 1 },
  headerTitulo: { fontSize: 29, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.7 },
  headerSubtitulo: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  headerBotao: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', ...Sombras.sm,
  },
  resumo: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderRadius: 15, padding: 11, gap: 9,
  },
  resumoIcone: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
  resumoTexto: { flex: 1 },
  resumoNumero: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  resumoLegenda: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  resumoPonto: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  resumoEstado: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' },
  pesquisaWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 15, paddingHorizontal: 14, height: 50, gap: 10, borderWidth: 1,
  },
  pesquisaInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  filtros: { maxHeight: 61, marginTop: 13, marginBottom: 3 },
  filtrosContainer: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 10, alignItems: 'center' },
  filtroChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22,
    borderWidth: 1, gap: 6,
  },
  filtroChipTexto: { fontSize: 12, fontWeight: '700' },
  filtroChipDot: { width: 7, height: 7, borderRadius: 4 },
  listaConteudo: { paddingTop: 5 },
  listaCabecalho: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: 13, paddingBottom: 10,
  },
  listaTitulo: { fontSize: 16, fontWeight: '800' },
  listaContagem: { fontSize: 11, fontWeight: '600' },
  conversa: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: Spacing.lg, gap: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 53, height: 53, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarLetra: { fontSize: 21, color: '#FFFFFF', fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF',
  },
  verificadoBadge: {
    position: 'absolute', top: -3, right: -3,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  conversaInfo: { flex: 1, minWidth: 0 },
  conversaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 },
  conversaNome: { fontSize: 14, fontWeight: '800', flex: 1 },
  conversaHora: { fontSize: 10 },
  conversaAnuncio: { fontSize: 11, marginBottom: 5, fontWeight: '600' },
  conversaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  conversaMensagem: { fontSize: 12, flex: 1 },
  naoLidasBadge: {
    minWidth: 21, height: 21, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  naoLidasTexto: { fontSize: 10, color: '#FFFFFF', fontWeight: '800' },
  estadoVazio: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 50 },
  estadoIcone: {
    width: 76, height: 76, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  estadoTitulo: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  estadoDescricao: {
    fontSize: 13, lineHeight: 20, textAlign: 'center',
    marginTop: 7, maxWidth: 280,
  },
  limparBotao: {
    marginTop: 18, borderRadius: 13,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  limparBotaoTexto: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});