/**
 * Cartão de espaço — usado em Explorar e Salvos.
 *
 * Estrutura (de cima para baixo):
 *   • Galeria deslizável (4:3) com selos, coração e contador de fotos
 *   • Título + avaliação
 *   • Localização
 *   • Características (quartos · WC · hóspedes · área) com ícones
 *   • Rodapé: preço à esquerda; disponibilidade confirmada (quando há datas)
 *     ou "Ver detalhes" à direita
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, FlatList, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../store/themeStore';
import { Fonte } from '../theme/fonts';
import { Colors, Sombras } from '../theme/colors';
import { Anuncio, labelCategoria } from '../types';
import { formatarMT } from '../utils/reservas';

interface Props {
  anuncio: Anuncio;
  onPress?: () => void;
  onFavoritar?: () => void;
  favoritado?: boolean;
  /** Ex.: "14–16 Nov" — só quando o utilizador escolheu datas e o espaço está livre. */
  periodo?: string;
  /** Total do período escolhido (ex.: "24.000 MT · 2 noites"). */
  totalPeriodo?: string;
}

const SUFIXO: Record<string, string> = { mensal: '/mês', diaria: '/dia', horaria: '/hora', unico: '' };
const MAX_FOTOS = 6;

type Especificacao = { icone: keyof typeof Ionicons.glyphMap; texto: string };

function especificacoes(anuncio: Anuncio): Especificacao[] {
  const c: any = anuncio.caracteristicas || {};
  const lista: Especificacao[] = [];
  if (Number(c.quartos) > 0) lista.push({ icone: 'bed-outline', texto: `${c.quartos}` });
  if (Number(c.casasBanho) > 0) lista.push({ icone: 'water-outline', texto: `${c.casasBanho}` });
  const pessoas = Number(c.hospedes || c.capacidade || 0);
  if (pessoas > 0) lista.push({ icone: 'people-outline', texto: `${pessoas}` });
  if (Number(c.area) > 0) lista.push({ icone: 'resize-outline', texto: `${c.area} m²` });
  return lista;
}

export default function CartaoEspaco({ anuncio, onPress, onFavoritar, favoritado, periodo, totalPeriodo }: Props) {
  const cores = useCores();
  const [largura, setLargura] = useState(340);
  const [ativa, setAtiva] = useState(0);

  const fotos = (anuncio.fotos?.filter(Boolean) ?? []).slice(0, MAX_FOTOS);
  if (fotos.length === 0 && anuncio.imagem) fotos.push(anuncio.imagem);

  const local = [anuncio.bairro, anuncio.cidade].filter(Boolean).join(', ') || anuncio.zona;
  const specs = especificacoes(anuncio);
  const rating = anuncio.anuncianteRating;
  const sufixo = SUFIXO[String(anuncio.periodicidade || 'unico')] ?? '';
  const verificado = !!(anuncio.anuncianteVerificado || anuncio.donoVerificado);

  const aoMedir = useCallback((e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width), []);
  const aoDeslizar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setAtiva(Math.round(e.nativeEvent.contentOffset.x / Math.max(1, largura)));
    },
    [largura],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${anuncio.titulo}, ${local}, ${formatarMT(anuncio.preco)} ${sufixo}`}
      style={({ pressed }) => [
        s.cartao,
        Sombras.sm,
        { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil, opacity: pressed ? 0.94 : 1 },
      ]}
    >
      {/* ============ GALERIA ============ */}
      <View style={[s.media, { backgroundColor: cores.fundoSuave }]} onLayout={aoMedir}>
        {fotos.length > 0 ? (
          <FlatList
            data={fotos}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={aoDeslizar}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={{ width: largura, height: '100%' }} contentFit="cover" transition={180} />
            )}
          />
        ) : (
          <View style={s.semFoto}>
            <Ionicons name="home-outline" size={44} color={cores.textoTerciario} />
            <Text style={[s.semFotoTexto, { color: cores.textoSecundario }]}>Sem fotografias</Text>
          </View>
        )}

        {fotos.length > 0 && (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(32,33,36,0.35)', 'rgba(32,33,36,0)']}
            style={s.escurecerTopo}
          />
        )}

        <View style={s.selos} pointerEvents="none">
          {anuncio.destacado && (
            <View style={[s.selo, { backgroundColor: cores.fundoElevado }]}>
              <Ionicons name="star" size={12} color={cores.textoPrincipal} />
              <Text style={[s.seloTexto, { color: cores.textoPrincipal }]}>Destaque</Text>
            </View>
          )}
          {verificado && (
            <View style={[s.selo, { backgroundColor: Colors.verdeTexto }]}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.branco} />
              <Text style={[s.seloTexto, { color: Colors.branco }]}>Verificado</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={onFavoritar}
          hitSlop={8}
          style={[s.coracao, { backgroundColor: cores.fundoElevado }]}
          accessibilityRole="button"
          accessibilityLabel={favoritado ? 'Remover dos salvos' : 'Guardar nos salvos'}
        >
          <Ionicons name={favoritado ? 'heart' : 'heart-outline'} size={20} color={favoritado ? cores.erro : cores.textoPrincipal} />
        </TouchableOpacity>

        {fotos.length > 1 && (
          <View style={s.contador} pointerEvents="none">
            <Ionicons name="images-outline" size={12} color={Colors.branco} />
            <Text style={s.contadorTexto}>{Math.min(ativa + 1, fotos.length)}/{fotos.length}</Text>
          </View>
        )}
      </View>

      {/* ============ INFORMAÇÃO ============ */}
      <View style={s.corpo}>
        <View style={s.linhaTitulo}>
          <Text style={[s.titulo, { color: cores.textoPrincipal }]} numberOfLines={1}>{anuncio.titulo}</Text>
          {!!rating && (
            <View style={s.rating}>
              <Ionicons name="star" size={13} color={cores.textoPrincipal} />
              <Text style={[s.ratingTexto, { color: cores.textoPrincipal }]}>{rating.toFixed(1)}</Text>
              {!!anuncio.anuncianteAvaliacoes && (
                <Text style={[s.ratingContagem, { color: cores.textoSecundario }]}>({anuncio.anuncianteAvaliacoes})</Text>
              )}
            </View>
          )}
        </View>

        <View style={s.linhaLocal}>
          <Ionicons name="location-outline" size={14} color={cores.textoSecundario} />
          <Text style={[s.local, { color: cores.textoSecundario }]} numberOfLines={1}>{local}</Text>
        </View>

        <View style={s.specs}>
          {specs.length > 0 ? specs.map(e => (
            <View key={e.icone} style={s.spec}>
              <Ionicons name={e.icone} size={16} color={cores.textoSecundario} />
              <Text style={[s.specTexto, { color: cores.textoPrincipal }]}>{e.texto}</Text>
            </View>
          )) : (
            <View style={[s.categoria, { backgroundColor: cores.fundoSuave }]}>
              <Text style={[s.categoriaTexto, { color: cores.textoSecundario }]}>{labelCategoria(String(anuncio.categoria))}</Text>
            </View>
          )}
        </View>

        <View style={[s.rodape, { borderTopColor: cores.bordaSubtil }]}>
          <Text style={[s.preco, { color: cores.textoPrincipal }]}>
            {formatarMT(anuncio.preco)}
            {!!sufixo && <Text style={[s.sufixo, { color: cores.textoSecundario }]}> {sufixo}</Text>}
          </Text>

          {periodo ? (
            <View style={s.disponivelCaixa}>
              <View style={[s.disponivel, { backgroundColor: Colors.verdeSuave }]}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.verdeTexto} />
                <Text style={[s.disponivelTexto, { color: Colors.verdeTexto }]}>Disponível {periodo}</Text>
              </View>
              {!!totalPeriodo && <Text style={[s.total, { color: cores.textoSecundario }]}>{totalPeriodo}</Text>}
            </View>
          ) : (
            <View style={s.ver}>
              <Text style={[s.verTexto, { color: cores.principalTexto }]}>Ver detalhes</Text>
              <Ionicons name="chevron-forward" size={15} color={cores.principalTexto} />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  cartao: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
  media: { aspectRatio: 4 / 3 },
  semFoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  semFotoTexto: { fontFamily: Fonte.corpoMedio, fontSize: 13 },
  escurecerTopo: { position: 'absolute', top: 0, left: 0, right: 0, height: 72 },
  selos: { position: 'absolute', top: 12, left: 12, right: 64, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selo: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: 999 },
  seloTexto: { fontFamily: Fonte.corpoBold, fontSize: 12 },
  coracao: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  contador: {
    position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, height: 24, borderRadius: 999, backgroundColor: 'rgba(32,33,36,0.66)',
  },
  contadorTexto: { color: Colors.branco, fontFamily: Fonte.corpoSemi, fontSize: 12 },

  corpo: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  titulo: { flex: 1, fontFamily: Fonte.corpoBold, fontSize: 16, lineHeight: 22 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingTexto: { fontFamily: Fonte.corpoBold, fontSize: 13 },
  ratingContagem: { fontFamily: Fonte.corpo, fontSize: 12 },
  linhaLocal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  local: { flex: 1, fontFamily: Fonte.corpo, fontSize: 13, lineHeight: 18 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 12 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specTexto: { fontFamily: Fonte.corpoSemi, fontSize: 13 },
  categoria: { paddingHorizontal: 10, height: 26, borderRadius: 999, justifyContent: 'center' },
  categoriaTexto: { fontFamily: Fonte.corpoSemi, fontSize: 12 },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  preco: { fontFamily: Fonte.tituloBold, fontSize: 18, letterSpacing: -0.2, fontVariant: ['tabular-nums'] },
  sufixo: { fontFamily: Fonte.corpo, fontSize: 13, letterSpacing: 0 },
  ver: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verTexto: { fontFamily: Fonte.corpoBold, fontSize: 13 },
  disponivelCaixa: { alignItems: 'flex-end', gap: 2 },
  disponivel: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 24, borderRadius: 999 },
  disponivelTexto: { fontFamily: Fonte.corpoBold, fontSize: 12 },
  total: { fontFamily: Fonte.corpo, fontSize: 12 },
});
