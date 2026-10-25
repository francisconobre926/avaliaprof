import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import TopBar from '../../src/components/TopBar';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_HERO_INICIO = '#0A6BC0';   // Azul GoHome — o mesmo da "Promoção lançamento"
const AZUL_HERO_FIM = '#095FAA';
const LARANJA_MARCA = '#E8760A';

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
          activo && { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal },
        ]}
        onPress={() => setFiltro(id)}
        activeOpacity={0.8}
      >
        {icone}
        <Text style={[
          styles.filtroChipTexto,
          { color: activo ? cores.fundo : cores.textoSecundario },
        ]}>
          {texto}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar temNotificacoes={totalNaoLidas > 0} />

      {/* Pesquisa e filtros fixos, no fundo papel */}
      <View>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtros}>
          <View style={styles.filtrosContainer}>
            {chip('todas', 'Todas')}
            {chip('naoLidas', `Não lidas (${conversas.filter(c => c.naoLidas > 0).length})`,
              <View style={[styles.filtroChipDot, { backgroundColor: LARANJA_MARCA }]} />)}
            {chip('verificados', 'Verificados',
              <Ionicons name="checkmark-circle" size={15} color={filtro === 'verificados' ? cores.fundo : '#2F7A4F'} />)}
            {chip('favoritos', 'Favoritos',
              <Ionicons name="star" size={14} color={filtro === 'favoritos' ? cores.fundo : LARANJA_MARCA} />)}
          </View>
        </ScrollView>
      </View>

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
                colors={conversa.id === '2' ? ['#B95A05', '#A85204'] : [AZUL_HERO_INICIO, AZUL_HERO_FIM]}
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
                  conversa.naoLidas > 0 && { color: LARANJA_MARCA, fontFamily: Fonte.corpoSemi },
                ]}>
                  {conversa.hora}
                </Text>
              </View>
              <Text style={[styles.conversaAnuncio, { color: cores.textoSecundario }]} numberOfLines={1}>
                <Icone name="home-outline" size={13} color={LARANJA_MARCA} /> {conversa.anuncio}
              </Text>
              <View style={styles.conversaBottom}>
                <Text
                  style={[
                    styles.conversaMensagem,
                    { color: cores.textoSecundario },
                    conversa.naoLidas > 0 && { color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi },
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
  pesquisaWrapper: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginTop: 14,
    borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 10, borderWidth: 1,
  },
  pesquisaInput: { flex: 1, fontFamily: Fonte.corpo, fontSize: 14, paddingVertical: 0 },
  filtros: { maxHeight: 61, marginTop: 12, marginBottom: 3 },
  filtrosContainer: { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 8, paddingBottom: 10, alignItems: 'center' },
  filtroChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, gap: 6,
  },
  filtroChipTexto: { fontSize: 12, fontFamily: Fonte.corpoSemi },
  filtroChipDot: { width: 7, height: 7, borderRadius: 4 },
  listaConteudo: { paddingTop: 5 },
  listaCabecalho: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: 13, paddingBottom: 10,
  },
  listaTitulo: { fontSize: 19, fontFamily: Fonte.tituloSemi, letterSpacing: -0.3 },
  listaContagem: { fontSize: 11, fontFamily: Fonte.corpoSemi },
  conversa: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: Spacing.lg, gap: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarLetra: { fontSize: 21, color: '#FFFFFF', fontFamily: Fonte.tituloSemi },
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
  conversaNome: { fontSize: 14, fontFamily: Fonte.corpoSemi, flex: 1 },
  conversaHora: { fontFamily: Fonte.corpo, fontSize: 10 },
  conversaAnuncio: { fontSize: 11, marginBottom: 5, fontFamily: Fonte.corpoSemi },
  conversaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  conversaMensagem: { fontFamily: Fonte.corpo, fontSize: 12, flex: 1 },
  naoLidasBadge: {
    minWidth: 21, height: 21, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  naoLidasTexto: { fontSize: 10, color: '#FFFFFF', fontFamily: Fonte.corpoSemi },
  estadoVazio: { alignItems: 'center', paddingHorizontal: 30, paddingTop: 50 },
  estadoIcone: {
    width: 76, height: 76, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  estadoTitulo: { fontSize: 16, fontFamily: Fonte.corpoSemi, textAlign: 'center' },
  estadoDescricao: {
    fontFamily: Fonte.corpo, fontSize: 13, lineHeight: 20, textAlign: 'center',
    marginTop: 7, maxWidth: 280,
  },
  limparBotao: {
    marginTop: 18, borderRadius: 13,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  limparBotaoTexto: { color: '#FFFFFF', fontSize: 12, fontFamily: Fonte.corpoSemi },
});