/**
 * Vista de mapa — protótipo "Explorar" (página 2).
 * Pins com o preço, botão flutuante "Lista" e cartão do espaço selecionado.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TopBar from '../src/components/TopBar';
import { useCores } from '../src/store/themeStore';
import { Fonte } from '../src/theme/fonts';
import { Sombras } from '../src/theme/colors';
import { Anuncio } from '../src/types';
import { carregarCatalogo } from '../src/data/catalogo';
import { apenasDisponiveis } from '../src/data/anuncios-mock';
import { formatarMT } from '../src/utils/reservas';
import { useUserStore } from '../src/store/userStore';
import { useAuthGateStore } from '../src/store/authGateStore';

const MAPUTO = { latitude: -25.9692, longitude: 32.5732, latitudeDelta: 0.08, longitudeDelta: 0.08 };

/** 12000 → "12k", 18500 → "18,5k"; mensal acrescenta "/mês". */
function precoCurto(a: Anuncio): string {
  const k = a.preco / 1000;
  const txt = a.preco >= 1000 ? `${Number.isInteger(k) ? k : k.toFixed(1).replace('.', ',')}k` : String(a.preco);
  return String(a.periodicidade) === 'mensal' ? `${txt}/mês` : txt;
}

export default function MapaScreen() {
  const cores = useCores();
  const router = useRouter();
  const mapa = useRef<MapView>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const usuario = useUserStore(s => s.usuario);
  const modoConvidado = useUserStore(s => s.modoConvidado);
  const abrirAuthGate = useAuthGateStore(s => s.abrir);

  useEffect(() => {
    carregarCatalogo().then(l => setAnuncios(apenasDisponiveis(l)));
  }, []);

  const comCoordenadas = useMemo(
    () => anuncios.filter(a => typeof a.latitude === 'number' && typeof a.longitude === 'number'),
    [anuncios],
  );
  const atual = comCoordenadas.find(a => a.id === selecionado) ?? null;

  useEffect(() => {
    if (comCoordenadas.length === 0) return;
    const t = setTimeout(() => {
      mapa.current?.fitToCoordinates(
        comCoordenadas.map(a => ({ latitude: a.latitude as number, longitude: a.longitude as number })),
        { edgePadding: { top: 220, bottom: 240, left: 60, right: 60 }, animated: false },
      );
    }, 300);
    return () => clearTimeout(t);
  }, [comCoordenadas]);

  const abrir = (id: string) => {
    const autenticado = usuario !== null && !modoConvidado;
    if (!autenticado) {
      abrirAuthGate('ver_detalhes', () => router.push(`/anuncio/${id}` as any));
      return;
    }
    router.push(`/anuncio/${id}` as any);
  };

  return (
    <View style={[s.flex, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Mapa" onVoltar={() => router.back()} />
      <View style={s.flex}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={MAPUTO}
        toolbarEnabled={false}
        showsCompass={false}
        onPress={() => setSelecionado(null)}
      >
        {comCoordenadas.map(a => {
          const ativo = a.id === selecionado;
          return (
            <Marker
              key={a.id}
              coordinate={{ latitude: a.latitude as number, longitude: a.longitude as number }}
              onPress={() => setSelecionado(a.id)}
              tracksViewChanges={false}
              zIndex={ativo ? 2 : 1}
            >
              <View style={[s.pin, Sombras.md, { backgroundColor: ativo ? cores.textoPrincipal : cores.fundoElevado }]}>
                <Text style={[s.pinTexto, { color: ativo ? cores.fundo : cores.textoPrincipal }]}>{precoCurto(a)}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View pointerEvents="box-none" style={s.topo}>
        <View style={[s.pesquisa, Sombras.md, { backgroundColor: cores.fundoElevado }]}>
          <Ionicons name="search" size={20} color={cores.textoPrincipal} />
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={() => router.push('/(procurador)/pesquisar' as any)}>
            <Text style={[s.pesquisaTitulo, { color: cores.textoPrincipal }]}>Mapa · Espaços</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>
              {comCoordenadas.length} no mapa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(procurador)/pesquisar' as any)}
            style={[s.filtro, { backgroundColor: cores.textoPrincipal }]}
            accessibilityLabel="Filtros"
          >
            <Ionicons name="options" size={18} color={cores.fundo} />
          </TouchableOpacity>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} pointerEvents="box-none" style={s.base}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.9}
          style={[s.lista, Sombras.lg, { backgroundColor: cores.textoPrincipal }]}
          accessibilityLabel="Ver lista"
        >
          <Ionicons name="list" size={18} color={cores.fundo} />
          <Text style={[s.listaTexto, { color: cores.fundo }]}>Lista</Text>
        </TouchableOpacity>

        {atual && (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => abrir(atual.id)}
            style={[s.cartao, Sombras.lg, { backgroundColor: cores.fundoElevado }]}
          >
            {atual.fotos?.[0] || atual.imagem
              ? <Image source={{ uri: atual.fotos?.[0] || atual.imagem }} style={s.cartaoFoto} />
              : <View style={[s.cartaoFoto, { backgroundColor: cores.principalClara, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="home-outline" size={30} color={cores.textoTerciario} />
                </View>}
            <View style={{ flex: 1 }}>
              <View style={s.cartaoLinha}>
                <Text style={[s.cartaoTitulo, { color: cores.textoPrincipal }]} numberOfLines={2}>{atual.titulo}</Text>
                {!!atual.anuncianteRating && (
                  <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi, fontSize: 13 }}><Ionicons name="star" size={12} color={cores.textoPrincipal} /> {atual.anuncianteRating.toFixed(1)}</Text>
                )}
              </View>
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }} numberOfLines={1}>
                {[atual.bairro, atual.cidade].filter(Boolean).join(', ') || atual.zona}
              </Text>
              <View style={s.disp}>
                <View style={[s.bolinha, { backgroundColor: cores.sucesso }]} />
                <Text style={{ color: cores.sucesso, fontFamily: Fonte.corpoSemi, fontSize: 13 }}>Disponível</Text>
              </View>
              <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.tituloBold, fontSize: 18 }}>
                {formatarMT(atual.preco)}
                <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>
                  {String(atual.periodicidade) === 'mensal' ? ' /mês' : String(atual.periodicidade) === 'diaria' ? ' /dia' : ''}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </SafeAreaView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  topo: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 8 },
  pesquisa: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 999, paddingLeft: 16, paddingRight: 8, height: 60 },
  pesquisaTitulo: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  filtro: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  base: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, alignItems: 'center', gap: 14 },
  lista: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 26, height: 52, borderRadius: 999 },
  listaTexto: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  pin: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  pinTexto: { fontFamily: Fonte.corpoBold, fontSize: 15 },
  cartao: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: 24, alignSelf: 'stretch', marginBottom: 8 },
  cartaoFoto: { width: 96, height: 96, borderRadius: 16 },
  cartaoLinha: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  cartaoTitulo: { flex: 1, fontFamily: Fonte.corpoBold, fontSize: 16 },
  disp: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  bolinha: { width: 8, height: 8, borderRadius: 4 },
});
