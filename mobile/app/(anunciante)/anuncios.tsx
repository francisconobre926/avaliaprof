/**
 * app/(anunciante)/anuncios.tsx
 *
 * Lista de anúncios do dono com separadores por estado.
 * Topo: TopBar partilhada (acção "novo anúncio") + título simples.
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Spacing } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import {
  EstadoAnuncio,
  estaFechado,
  labelEstadoAnuncio,
  corEstadoAnuncio,
  Finalidade,
} from '../../src/types';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_MARCA = '#0A6BC0';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';
const LARANJA_PALE = 'rgba(232, 118, 10, 0.1)';
const VERDE = '#2F7A4F';

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
      <TopBar
        acoes={<TopBarBotao icone="add" rotulo="Novo anúncio" onPress={irParaPublicar} />}
      />

      {/* Título + separadores (fixos por cima da lista) */}
      <View style={styles.cabecalho}>
        <Text style={[styles.titulo, { color: cores.textoPrincipal }]}>Meus anúncios</Text>
        <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
          {`${totalAnuncios} anúncios no total`}
        </Text>
      </View>

      <View>
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
                  { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
                  activo && { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal },
                ]}
                onPress={() => setSeparadorActivo(sep.id)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activo }}
              >
                <Text style={[
                  styles.separadorLabel,
                  { color: cores.textoSecundario },
                  activo && { color: cores.fundo },
                ]}>
                  {sep.label}
                </Text>
                {contagem > 0 && (
                  <View style={[
                    styles.separadorBadge,
                    { backgroundColor: cores.fundoSuave },
                    activo && { backgroundColor: cores.fundo },
                  ]}>
                    <Text style={[
                      styles.separadorBadgeTexto,
                      { color: cores.textoSecundario },
                      activo && { color: cores.textoPrincipal },
                    ]}>
                      {contagem}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista de anúncios */}
      {anunciosFiltrados.length === 0 ? (
        <View style={styles.vazioContainer}>
          <Icone name="package-variant" size={60} color={cores.textoTerciario} />
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
            <TouchableOpacity style={styles.vazioBtn} onPress={irParaPublicar} activeOpacity={0.85}>
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
          <Icone name="map-marker" size={13} color={cores.textoSecundario} />
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
            <Icone name="account-check" size={13} color={cores.textoSecundario} />
            <Text style={[styles.cardStatValor, { color: cores.textoPrincipal }]}>
              {anuncio.contactos}
            </Text>
          </View>
          {anuncio.diasRestantes !== undefined && !fechado && (
            <View style={styles.cardStatItem}>
              <Icone name="calendar-clock" size={13} color={cores.textoSecundario} />
              <Text style={[styles.cardStatValor, { color: cores.textoPrincipal }]}>
                {`${anuncio.diasRestantes}d`}
              </Text>
            </View>
          )}
        </View>

        {fechado && (
          <View style={[styles.cardFechoRodape, { borderTopColor: cores.bordaSubtil }]}>
            <View style={styles.cardFechoInfo}>
              <Icone name="handshake" size={14} color={AZUL_MARCA} />
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
              <Icone name="refresh" size={14} color={LARANJA_ESCURO} />
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
  cabecalho: { paddingHorizontal: Spacing.lg, marginTop: 16, marginBottom: 12 },
  titulo: { ...Typography.h1 },
  subtitulo: { fontSize: 13, fontFamily: Fonte.corpo, marginTop: 2 },

  separadoresContainer: { paddingHorizontal: Spacing.lg, paddingBottom: 4, gap: 8 },
  separador: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1, gap: 7,
  },
  separadorLabel: { ...Typography.bodyBold, fontSize: 13, fontFamily: Fonte.corpoSemi },
  separadorBadge: {
    minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  separadorBadgeTexto: { fontSize: 10, fontFamily: Fonte.corpoSemi },

  lista: { padding: 16, gap: 14, paddingBottom: 100 },

  card: {
    flexDirection: 'row',
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1,
  },
  cardImagemWrap: { width: 110, position: 'relative', backgroundColor: '#E7E5DF' },
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
  cardEstadoTexto: { color: '#FFFFFF', fontSize: 8, fontFamily: Fonte.corpoSemi, letterSpacing: 0.4 },
  cardConteudo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitulo: { ...Typography.bodyBold, fontFamily: Fonte.corpoSemi, fontSize: 13, lineHeight: 17, marginBottom: 4 },
  cardMetadados: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  cardZona: { ...Typography.caption, fontSize: 11 },
  cardPrecoLinha: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginBottom: 7 },
  cardPreco: { ...Typography.h4, fontFamily: Fonte.corpoBold, fontSize: 15 },
  cardPrecoSufixo: { ...Typography.caption, fontSize: 11, fontFamily: Fonte.corpoSemi },
  cardStats: { flexDirection: 'row', gap: 12, paddingTop: 7, borderTopWidth: 1 },
  cardStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatValor: { ...Typography.caption, fontSize: 11, fontFamily: Fonte.corpoSemi },

  cardFechoRodape: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, gap: 7 },
  cardFechoInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  cardFechoTexto: { ...Typography.caption, fontSize: 11, fontFamily: Fonte.corpoSemi, flex: 1 },
  cardFechoCreditBadge: {
    backgroundColor: VERDE,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  cardFechoCreditTexto: { color: '#FFFFFF', fontSize: 10, fontFamily: Fonte.corpoSemi },
  cardFechoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 7,
    backgroundColor: LARANJA_PALE,
    borderRadius: 9, borderWidth: 1, borderColor: 'rgba(232, 118, 10, 0.3)',
  },
  cardFechoBtnTexto: { color: LARANJA_ESCURO, fontSize: 11, fontFamily: Fonte.corpoSemi },

  vazioContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 10 },
  vazioTitulo: { ...Typography.h4, fontFamily: Fonte.corpoSemi, textAlign: 'center', fontSize: 15, marginTop: 10 },
  vazioTexto: { ...Typography.body, textAlign: 'center', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  vazioBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 13,
    borderRadius: 13, gap: 7,
    backgroundColor: AZUL_MARCA,
  },
  vazioBtnTexto: { color: '#FFFFFF', fontSize: 14, fontFamily: Fonte.corpoSemi },
});