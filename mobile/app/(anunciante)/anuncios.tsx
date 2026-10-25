/**
 * app/(anunciante)/anuncios.tsx
 *
 * Lista de anúncios do dono com separadores por estado.
 * Paleta GoHome aplicada (azul #0082DE + laranja #FE8A00).
 *
 * Separadores: Activos | Pausados | Fechados | Expirados
 * Cada separador mostra badge com contador.
 */

import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import {
  EstadoAnuncio,
  estaFechado,
  labelEstadoAnuncio,
  corEstadoAnuncio,
  Finalidade,
} from '../../src/types';

// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_MARCA = '#0082DE';
const AZUL_ESCURO = '#0061A6';
const AZUL_HERO_INICIO = '#003A66';
const LARANJA_MARCA = '#FE8A00';
const LARANJA_ESCURO = '#CB6E00';
const LARANJA_PALE = 'rgba(254, 138, 0, 0.1)';
const VERDE = '#2E7D32';

// ============================================================
// MOCK — anúncios de exemplo
// ============================================================
interface AnuncioLista {
  id: string;
  titulo: string;
  imagem: string;
  zona: string;
  preco: number;
  finalidade: Finalidade;
  estado: EstadoAnuncio;
  visualizacoes: number;
  contactos: number;
  diasRestantes?: number;
  dataFecho?: string;
  compensacaoRecebida?: number;
}

const ANUNCIOS_MOCK: AnuncioLista[] = [
  {
    id: 'a1',
    titulo: 'Casa T2 em Macúti com vista para o mar',
    imagem: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',
    zona: 'Macúti, Beira',
    preco: 15000,
    finalidade: 'arrendar',
    estado: 'activo',
    visualizacoes: 234,
    contactos: 12,
    diasRestantes: 18,
  },
  {
    id: 'a2',
    titulo: 'Apartamento T3 na Ponta Gea',
    imagem: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=85',
    zona: 'Ponta Gea, Beira',
    preco: 2500000,
    finalidade: 'vender',
    estado: 'activo',
    visualizacoes: 456,
    contactos: 23,
    diasRestantes: 25,
  },
  {
    id: 'a3',
    titulo: 'Quarto mobilado perto da UniZambeze',
    imagem: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=85',
    zona: 'Matacuane, Beira',
    preco: 6500,
    finalidade: 'arrendar',
    estado: 'pausado',
    visualizacoes: 89,
    contactos: 4,
    diasRestantes: 12,
  },
  {
    id: 'a4',
    titulo: 'Loja comercial no centro',
    imagem: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85',
    zona: 'Centro, Beira',
    preco: 25000,
    finalidade: 'arrendar',
    estado: 'arrendado',
    visualizacoes: 189,
    contactos: 15,
    dataFecho: '2026-10-10',
    compensacaoRecebida: 25,
  },
  {
    id: 'a5',
    titulo: 'Espaço para eventos — Marginal',
    imagem: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=85',
    zona: 'Marginal, Beira',
    preco: 8000,
    finalidade: 'reservar',
    estado: 'expirado',
    visualizacoes: 345,
    contactos: 18,
  },
  {
    id: 'a6',
    titulo: 'Terreno 500m² em Chingussura',
    imagem: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85',
    zona: 'Chingussura, Beira',
    preco: 850000,
    finalidade: 'vender',
    estado: 'vendido',
    visualizacoes: 278,
    contactos: 9,
    dataFecho: '2026-09-28',
    compensacaoRecebida: 0,
  },
];

// ============================================================
// SEPARADORES
// ============================================================
type Separador = 'activos' | 'pausados' | 'fechados' | 'expirados';

const SEPARADORES: { id: Separador; label: string; estados: EstadoAnuncio[] }[] = [
  { id: 'activos', label: 'Activos', estados: ['activo'] },
  { id: 'pausados', label: 'Pausados', estados: ['pausado'] },
  { id: 'fechados', label: 'Fechados', estados: ['arrendado', 'vendido', 'reservado'] },
  { id: 'expirados', label: 'Expirados', estados: ['expirado'] },
];

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AnunciosScreen() {
  const router = useRouter();
  const cores = useCores();
  const [separadorActivo, setSeparadorActivo] = useState<Separador>('activos');

  const contagemPorSeparador = useMemo(() => {
    const contagem: Record<Separador, number> = {
      activos: 0, pausados: 0, fechados: 0, expirados: 0,
    };
    SEPARADORES.forEach(sep => {
      contagem[sep.id] = ANUNCIOS_MOCK.filter(a => sep.estados.includes(a.estado)).length;
    });
    return contagem;
  }, []);

  const anunciosFiltrados = useMemo(() => {
    const estadosDoSeparador = SEPARADORES.find(s => s.id === separadorActivo)?.estados || [];
    return ANUNCIOS_MOCK.filter(a => estadosDoSeparador.includes(a.estado));
  }, [separadorActivo]);

  const totalAnuncios = ANUNCIOS_MOCK.length;

  const irParaDetalhes = (id: string) => {
    router.push(`/anuncio/${id}` as any);
  };

  const irParaPublicar = () => {
    router.push('/(anunciante)/publicar' as any);
  };

  const republicar = (id: string) => {
    router.push({
      pathname: '/(anunciante)/publicar' as any,
      params: { modo: 'republicar', id },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <SafeAreaView edges={['top']} style={[styles.safeHeader, { backgroundColor: cores.fundoElevado }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitulo, { color: cores.textoPrincipal }]}>
              Meus anúncios
            </Text>
            <Text style={[styles.headerSubtitulo, { color: cores.textoSecundario }]}>
              {`${totalAnuncios} anúncios no total`}
            </Text>
          </View>
          <TouchableOpacity style={styles.btnNovo} onPress={irParaPublicar} activeOpacity={0.9}>
            <LinearGradient
              colors={[LARANJA_MARCA, LARANJA_ESCURO]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Separadores */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.separadoresContainer}
        >
          {SEPARADORES.map(sep => {
            const activo = separadorActivo === sep.id;
            const contagem = contagemPorSeparador[sep.id];
            return (
              <TouchableOpacity
                key={sep.id}
                style={[
                  styles.separador,
                  { backgroundColor: cores.fundoSuave },
                  activo && { backgroundColor: AZUL_HERO_INICIO },
                ]}
                onPress={() => setSeparadorActivo(sep.id)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.separadorLabel,
                  { color: cores.textoSecundario },
                  activo && { color: '#FFFFFF' },
                ]}>
                  {sep.label}
                </Text>
                {contagem > 0 && (
                  <View style={[
                    styles.separadorBadge,
                    { backgroundColor: cores.bordaMedia },
                    activo && { backgroundColor: LARANJA_MARCA },
                  ]}>
                    <Text style={[
                      styles.separadorBadgeTexto,
                      { color: cores.textoSecundario },
                      activo && { color: '#FFFFFF' },
                    ]}>
                      {contagem}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Lista de anúncios */}
      {anunciosFiltrados.length === 0 ? (
        <View style={styles.vazioContainer}>
          <MaterialCommunityIcons name="package-variant" size={60} color={cores.textoTerciario} />
          <Text style={[styles.vazioTitulo, { color: cores.textoPrincipal }]}>
            Nenhum anúncio {SEPARADORES.find(s => s.id === separadorActivo)?.label.toLowerCase()}
          </Text>
          <Text style={[styles.vazioTexto, { color: cores.textoSecundario }]}>
            {separadorActivo === 'activos'
              ? 'Começa já a publicar o teu primeiro anúncio.'
              : separadorActivo === 'fechados'
              ? 'Os teus anúncios fechados aparecerão aqui.'
              : 'Nada por aqui para já.'}
          </Text>
          {separadorActivo === 'activos' && (
            <TouchableOpacity style={styles.vazioBtn} onPress={irParaPublicar}>
              <LinearGradient
                colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.vazioBtnTexto}>Publicar anúncio</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={anunciosFiltrados}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AnuncioCard
              anuncio={item}
              onPress={() => irParaDetalhes(item.id)}
              onRepublicar={() => republicar(item.id)}
              cores={cores}
            />
          )}
        />
      )}
    </View>
  );
}

// ============================================================
// CARD DE ANÚNCIO
// ============================================================
function AnuncioCard({
  anuncio,
  onPress,
  onRepublicar,
  cores,
}: {
  anuncio: AnuncioLista;
  onPress: () => void;
  onRepublicar: () => void;
  cores: any;
}) {
  const fechado = estaFechado(anuncio.estado);
  const corDoEstado = corEstadoAnuncio(anuncio.estado);
  const labelDoEstado = labelEstadoAnuncio(anuncio.estado);

  const precoFormatado = anuncio.preco.toLocaleString('pt-PT');
  const sufixoPreco = anuncio.finalidade === 'arrendar'
    ? '/mês'
    : anuncio.finalidade === 'reservar'
    ? '/reserva'
    : '';

  const dataFechoFormatada = anuncio.dataFecho
    ? new Date(anuncio.dataFecho).toLocaleDateString('pt-PT')
    : '';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
        fechado && { backgroundColor: cores.fundoSuave },
      ]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.cardImagemWrap}>
        <Image source={{ uri: anuncio.imagem }} style={styles.cardImagem} />
        {fechado && <View style={styles.cardImagemOverlay} />}
        <View style={[styles.cardEstadoBadge, { backgroundColor: corDoEstado }]}>
          <View style={styles.cardEstadoDot} />
          <Text style={styles.cardEstadoTexto}>{labelDoEstado.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardConteudo}>
        <Text style={[styles.cardTitulo, { color: cores.textoPrincipal }]} numberOfLines={2}>
          {anuncio.titulo}
        </Text>
        <View style={styles.cardMetadados}>
          <MaterialCommunityIcons name="map-marker" size={13} color={cores.textoSecundario} />
          <Text style={[styles.cardZona, { color: cores.textoSecundario }]}>{anuncio.zona}</Text>
        </View>

        <View style={styles.cardPrecoLinha}>
          <Text style={[styles.cardPreco, { color: LARANJA_MARCA }]}>{`${precoFormatado} MT`}</Text>
          {sufixoPreco && (
            <Text style={[styles.cardPrecoSufixo, { color: cores.textoSecundario }]}>
              {sufixoPreco}
            </Text>
          )}
        </View>

        <View style={[styles.cardStats, { borderTopColor: cores.bordaSubtil }]}>
          <View style={styles.cardStatItem}>
            <Ionicons name="eye" size={13} color={cores.textoSecundario} />
            <Text style={[styles.cardStatValor, { color: cores.textoPrincipal }]}>
              {anuncio.visualizacoes}
            </Text>
          </View>
          <View style={styles.cardStatItem}>
            <MaterialCommunityIcons name="account-check" size={13} color={cores.textoSecundario} />
            <Text style={[styles.cardStatValor, { color: cores.textoPrincipal }]}>
              {anuncio.contactos}
            </Text>
          </View>
          {anuncio.diasRestantes !== undefined && !fechado && (
            <View style={styles.cardStatItem}>
              <MaterialCommunityIcons name="calendar-clock" size={13} color={cores.textoSecundario} />
              <Text style={[styles.cardStatValor, { color: cores.textoPrincipal }]}>
                {`${anuncio.diasRestantes}d`}
              </Text>
            </View>
          )}
        </View>

        {fechado && (
          <View style={[styles.cardFechoRodape, { borderTopColor: cores.bordaSubtil }]}>
            <View style={styles.cardFechoInfo}>
              <MaterialCommunityIcons name="handshake" size={14} color={AZUL_MARCA} />
              <Text style={[styles.cardFechoTexto, { color: AZUL_MARCA }]}>
                {`Fechado em ${dataFechoFormatada}`}
              </Text>
              {anuncio.compensacaoRecebida && anuncio.compensacaoRecebida > 0 && (
                <View style={styles.cardFechoCreditBadge}>
                  <Text style={styles.cardFechoCreditTexto}>
                    {`+${anuncio.compensacaoRecebida} MT`}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.cardFechoBtn}
              onPress={onRepublicar}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="refresh" size={14} color={LARANJA_ESCURO} />
              <Text style={styles.cardFechoBtnTexto}>Publicar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeHeader: {},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, gap: 12,
  },
  headerTitulo: { ...Typography.h2, fontWeight: '800', fontSize: 22 },
  headerSubtitulo: { ...Typography.caption, fontSize: 12, marginTop: 2 },
  btnNovo: {
    width: 44, height: 44, borderRadius: 14,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
  },

  separadoresContainer: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
  separador: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, gap: 7,
  },
  separadorLabel: { ...Typography.bodyBold, fontSize: 13, fontWeight: '800' },
  separadorBadge: {
    minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  separadorBadgeTexto: { fontSize: 10, fontWeight: '800' },

  lista: { padding: 16, gap: 14, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1,
  },
  cardImagemWrap: { width: 110, position: 'relative', backgroundColor: '#E8EEF5' },
  cardImagem: { width: '100%', height: '100%' },
  cardImagemOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  cardEstadoBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 10, gap: 4,
  },
  cardEstadoDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFFFFF' },
  cardEstadoTexto: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  cardConteudo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitulo: { ...Typography.bodyBold, fontWeight: '800', fontSize: 13, lineHeight: 17, marginBottom: 4 },
  cardMetadados: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  cardZona: { ...Typography.caption, fontSize: 11 },
  cardPrecoLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginBottom: 7 },
  cardPreco: { ...Typography.h4, fontWeight: '900', fontSize: 15 },
  cardPrecoSufixo: { ...Typography.caption, fontSize: 11, fontWeight: '600' },
  cardStats: { flexDirection: 'row', gap: 12, paddingTop: 7, borderTopWidth: 1 },
  cardStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatValor: { ...Typography.caption, fontSize: 11, fontWeight: '800' },

  cardFechoRodape: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, gap: 7 },
  cardFechoInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cardFechoTexto: { ...Typography.caption, fontSize: 11, fontWeight: '700', flex: 1 },
  cardFechoCreditBadge: {
    backgroundColor: VERDE,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  cardFechoCreditTexto: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  cardFechoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 7,
    backgroundColor: LARANJA_PALE,
    borderRadius: 9, borderWidth: 1, borderColor: 'rgba(254, 138, 0, 0.3)',
  },
  cardFechoBtnTexto: { color: LARANJA_ESCURO, fontSize: 11, fontWeight: '800' },

  vazioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 10 },
  vazioTitulo: { ...Typography.h4, fontWeight: '800', textAlign: 'center', fontSize: 15, marginTop: 10 },
  vazioTexto: { ...Typography.body, textAlign: 'center', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  vazioBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 13, overflow: 'hidden', gap: 7,
  },
  vazioBtnTexto: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});