import { useState, useRef, useMemo, useEffect } from 'react';

import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  TouchableOpacity,

  Image,

  Dimensions,


  Modal,

  Pressable,

  Share,

  Alert,

  Animated,

} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { Typography, Spacing, Radius } from '../../src/theme/typography';
import { useUserStore } from '../../src/store/userStore';
import { obterAnuncioLocal, guardarAnuncioLocal, eliminarAnuncioLocal, type AnuncioLocal } from '../../src/store/anunciosLocal';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import { Colors } from '../../src/theme/colors';
const { width: screenWidth } = Dimensions.get('window');

type EstadoAnuncio = 'activo' | 'pausado' | 'expirado' | 'pendente';

// ============================================================

// MOCK DE DADOS (ainda não há backend)

// Gera dados determinísticos baseados no ID (sempre os mesmos para o mesmo ID)

// ============================================================

function gerarMockAnuncio(id: string) {

  // Hash simples do id para dados consistentes

  let hash = 0;

  for (let i = 0; i < id.length; i++) {

    hash = ((hash << 5) - hash) + id.charCodeAt(i);

    hash |= 0;

  }

  const seed = Math.abs(hash);

  const r = (min: number, max: number, offset = 0) =>

    min + ((seed + offset) % (max - min));

  // Estados possíveis — rotaciona com base no hash

  const estados: EstadoAnuncio[] = ['activo', 'activo', 'activo', 'pausado', 'expirado'];

  const estado = estados[seed % estados.length];

  const diasPublicado = r(1, 29, 7);

  const diasRestantes = estado === 'expirado' ? 0 : 30 - diasPublicado;

  const visualizacoesTotal = r(120, 580, 3);

  const desbloqueios = r(5, 22, 11);

  const favoritos = r(12, 55, 17);

  const partilhas = r(2, 15, 23);

  // Visitas dos últimos 7 dias

  const visitasUltimos7Dias = Array.from({ length: 7 }, (_, i) =>

    r(10, 85, i * 7 + 5)

  );

  return {

    id,

    titulo: 'Casa T2 em Macúti com vista para o mar',

    categoria: 'Casa',

    zona: 'Macúti, Beira',

    preco: 15000,

    finalidade: 'arrendar',

    estado,

    fotos: [

      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',

      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=85',

      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',

      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=900&q=85',

    ],

    diasPublicado,

    diasRestantes,

    dataPublicacao: '10 Out 2026',

    dataExpiracao: '9 Nov 2026',

    valorPago: 125,

    stats: {

      visualizacoesTotal,

      visualizacoes7Dias: visitasUltimos7Dias.reduce((a, b) => a + b, 0),

      desbloqueios,

      favoritos,

      partilhas,

      visitasUltimos7Dias,

    },

    receita: desbloqueios * 25, // 25 MT por desbloqueio

  };

}

// ============================================================

// HELPERS DE ESTADO

// ============================================================

function configEstado(estado: EstadoAnuncio) {

  const configs: Record<EstadoAnuncio, {

    label: string;

    cor: string;

    corFundo: string;

    icone: string;

  }> = {

    activo: {

      label: 'Activo',

      cor: Colors.verdeTexto,

      corFundo: Colors.verdeSuave,

      icone: 'check-circle',

    },

    pausado: {

      label: 'Pausado',

      cor: Colors.azul,

      corFundo: Colors.azulSuave,

      icone: 'pause-circle',

    },

    expirado: {

      label: 'Expirado',

      cor: Colors.erro,

      corFundo: Colors.erroFundo,

      icone: 'close-circle',

    },

    pendente: {

      label: 'Pendente',

      cor: Colors.azul,

      corFundo: Colors.azulSuave,

      icone: 'clock-outline',

    },

  };

  return configs[estado];

}

export default function AnuncioDetalhesScreen() {

  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();
  const usuario = useUserStore((state) => state.usuario);
  // A store actual não expõe `isLogado`; a sessão é representada pelo utilizador carregado.
  const isLogado = Boolean(usuario);
  const carregado = useUserStore((state) => state.carregado);
  const carregarUsuario = useUserStore((state) => state.carregarUsuario);

  useEffect(() => {
    if (!carregado) {
      void carregarUsuario();
      return;
    }

    if (!isLogado || !usuario) {
      const returnTo = `/anuncio/${id || ''}`;
      router.replace({
        pathname: '/auth' as any,
        params: { returnTo },
      });
    }
  }, [carregado, isLogado, usuario, carregarUsuario, router, id]);

  const [anuncioLocal, setAnuncioLocal] = useState<AnuncioLocal | null>(null);
  const [carregandoAnuncio, setCarregandoAnuncio] = useState(true);

  useEffect(() => {
    let activo = true;
    setCarregandoAnuncio(true);
    obterAnuncioLocal(String(id || ''))
      .then((registo) => { if (activo) setAnuncioLocal(registo); })
      .catch(() => { if (activo) setAnuncioLocal(null); })
      .finally(() => { if (activo) setCarregandoAnuncio(false); });
    return () => { activo = false; };
  }, [id]);

  const anuncio = useMemo(() => {
    if (!anuncioLocal) return gerarMockAnuncio(String(id || 'default'));
    const publicado = anuncioLocal.estadoPagamento === 'confirmado';
    const dataBase = anuncioLocal.publicadoEm ? new Date(anuncioLocal.publicadoEm) : null;
    const diasPublicado = publicado && dataBase
      ? Math.max(0, Math.min(30, Math.floor((Date.now() - dataBase.getTime()) / 86400000))) : 0;
    const dataPublicacao = publicado && dataBase
      ? dataBase.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ainda não publicado';
    const dataExpiracao = publicado && dataBase
      ? new Date(dataBase.getTime() + 30 * 86400000).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    return {
      id: anuncioLocal.id,
      titulo: anuncioLocal.titulo || 'Anúncio sem título',
      categoria: anuncioLocal.categoria || 'Imóvel',
      zona: [anuncioLocal.bairro, anuncioLocal.cidade].filter(Boolean).join(', ') || 'Localização não indicada',
      preco: Number(anuncioLocal.preco) || 0,
      finalidade: anuncioLocal.finalidade || 'arrendar',
      estado: anuncioLocal.estadoAnuncio || (publicado ? 'activo' : 'pendente'),
      fotos: anuncioLocal.fotos?.length ? anuncioLocal.fotos : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85'],
      diasPublicado,
      diasRestantes: publicado ? Math.max(0, 30 - diasPublicado) : 0,
      dataPublicacao,
      dataExpiracao,
      valorPago: Number(anuncioLocal.valorPago) || 0,
      stats: { visualizacoesTotal: 0, visualizacoes7Dias: 0, desbloqueios: 0, favoritos: 0, partilhas: 0, visitasUltimos7Dias: [0, 0, 0, 0, 0, 0, 0] },
      receita: 0,
    };
  }, [id, anuncioLocal]);

  const estadoConfig = configEstado(anuncio.estado);

  const [fotoActiva, setFotoActiva] = useState(0);

  const [modalMaisVisivel, setModalMaisVisivel] = useState(false);

  const [modalPausarVisivel, setModalPausarVisivel] = useState(false);

  const [modalEliminarVisivel, setModalEliminarVisivel] = useState(false);

  const [estadoActual, setEstadoActual] = useState<EstadoAnuncio>(anuncio.estado);

  useEffect(() => {
    setEstadoActual(anuncio.estado);
    setFotoActiva(0);
  }, [anuncio.id, anuncio.estado]);

  const scrollFotosRef = useRef<ScrollView>(null);

  // ============ HANDLERS ============

  const handleFotoScroll = (event: any) => {

    const offsetX = event.nativeEvent.contentOffset.x;

    const index = Math.round(offsetX / screenWidth);

    setFotoActiva(index);

  };

  const handleEditar = () => {

    // Vai para publicar com dados pré-preenchidos (feature futura)

    Alert.alert(

      'Editar anúncio',

      'A edição de anúncios será implementada em breve. Vais poder modificar título, descrição, fotos e preço.',

      [{ text: 'Entendi', style: 'default' }]

    );

  };

  const handleProlongar = () => {

    // Vai para pagamento para prolongar +30 dias

    router.push({

      pathname: '/pagamento-publicacao' as any,

      params: {

        anuncioId: anuncio.id,

        titulo: anuncio.titulo,

        categoria: anuncio.categoria,

        zona: anuncio.zona,

        valorPago: String(anuncio.valorPago),

        valorNormal: String(anuncio.valorPago * 2),

        finalidade: anuncio.finalidade,

        tipoAccao: 'prolongar',

      },

    });

  };

  const handlePartilhar = async () => {

    try {

      await Share.share({

        message: `${anuncio.titulo}\n\nVê este anúncio no GoHome: https://gohome.co.mz/anuncio/${anuncio.id}`,

        title: 'GoHome',

      });

    } catch {

      // utilizador cancelou

    }

    setModalMaisVisivel(false);

  };

  const handlePausar = () => {

    setModalMaisVisivel(false);

    setModalPausarVisivel(true);

  };

  const confirmarPausar = async () => {
    const novoEstado: EstadoAnuncio = estadoActual === 'pausado' ? 'activo' : 'pausado';
    setEstadoActual(novoEstado);
    setModalPausarVisivel(false);

    if (anuncioLocal) {
      try {
        const actualizado: AnuncioLocal = { ...anuncioLocal, estadoAnuncio: novoEstado };
        await guardarAnuncioLocal(actualizado);
        setAnuncioLocal(actualizado);
      } catch {
        Alert.alert('Não foi possível actualizar', 'O estado do anúncio não foi guardado. Tenta novamente.');
      }
    }
  };

  const handleEliminar = () => {

    setModalMaisVisivel(false);

    setModalEliminarVisivel(true);

  };

  const confirmarEliminar = async () => {
    setModalEliminarVisivel(false);
    try {
      if (anuncioLocal) {
        await eliminarAnuncioLocal(anuncioLocal.id);
      }
      Alert.alert(
        'Anúncio eliminado',
        'O anúncio foi removido do armazenamento deste dispositivo.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Erro ao eliminar', 'Não foi possível remover o anúncio. Tenta novamente.');
    }
  };

  const handleEstatisticasDetalhadas = () => {

    setModalMaisVisivel(false);

    Alert.alert(

      'Estatísticas detalhadas',

      'Em breve: histórico completo de visitas, horário mais procurado, origem dos procuradores, análise de concorrência e sugestões IA.',

      [{ text: 'Entendi', style: 'default' }]

    );

  };

  // ============ RENDER ============

  const estadoFinalConfig = configEstado(estadoActual);

  const maxVisitas = Math.max(...anuncio.stats.visitasUltimos7Dias);

  const diasSemana = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  // Progresso de validade (0-100)

  const progressoValidade = estadoActual === 'expirado'

    ? 100

    : Math.round((anuncio.diasPublicado / 30) * 100);

  // Bloqueia o conteúdo até confirmar a sessão.
  if (!carregado || !isLogado || !usuario || carregandoAnuncio) {
    return null;
  }

  return (

    <View style={styles.container}>

      <TopBar
        titulo="Detalhes do anúncio"
        onVoltar={() => router.back()}
        acoes={
          <>
            <TopBarBotao icone="share-social" rotulo="Partilhar" onPress={handlePartilhar} />
            <TopBarBotao icone="ellipsis-horizontal" rotulo="Mais opções" onPress={() => setModalMaisVisivel(true)} />
          </>
        }
      />

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={{ paddingBottom: 110 }}

      >

        {/* ============ CARROSSEL DE FOTOS ============ */}

        <View style={styles.fotosWrapper}>

          <ScrollView

            ref={scrollFotosRef}

            horizontal

            pagingEnabled

            showsHorizontalScrollIndicator={false}

            onScroll={handleFotoScroll}

            scrollEventThrottle={16}

          >

            {anuncio.fotos.map((foto, index) => (

              <Image

                key={index}

                source={{ uri: foto }}

                style={styles.foto}

                resizeMode="cover"

              />

            ))}

          </ScrollView>

          {/* Indicador de fotos */}

          <View style={styles.fotoIndicadorContainer}>

            {anuncio.fotos.map((_, index) => (

              <View

                key={index}

                style={[

                  styles.fotoIndicador,

                  fotoActiva === index && styles.fotoIndicadorActivo,

                ]}

              />

            ))}

          </View>

          {/* Contador de fotos no canto */}

          <View style={styles.fotoContador}>

            <Ionicons name="images" size={13} color={Colors.branco} />

            <Text style={styles.fotoContadorTexto}>

              {`${fotoActiva + 1} / ${anuncio.fotos.length}`}

            </Text>

          </View>

        </View>

        {/* ============ CABEÇALHO INFO ============ */}

        <View style={styles.cabecalho}>

          <View style={[styles.estadoBadge, { backgroundColor: estadoFinalConfig.corFundo }]}>

            <Icone

              name={estadoFinalConfig.icone as any}

              size={14}

              color={estadoFinalConfig.cor}

            />

            <Text style={[styles.estadoBadgeTexto, { color: estadoFinalConfig.cor }]}>

              {estadoFinalConfig.label}

            </Text>

            {estadoActual === 'activo' && (

              <Text style={styles.estadoBadgeExtra}>

                {` · Expira em ${anuncio.diasRestantes} dias`}

              </Text>

            )}

          </View>

          <Text style={styles.titulo}>{anuncio.titulo}</Text>

          <View style={styles.metaLinha}>

            <View style={styles.metaItem}>

              <Ionicons name="location" size={14} color={Colors.textoSecundario} />

              <Text style={styles.metaTexto}>{anuncio.zona}</Text>

            </View>

            <View style={styles.metaDivisor} />

            <View style={styles.metaItem}>

              <Icone name="shape" size={14} color={Colors.textoSecundario} />

              <Text style={styles.metaTexto}>{anuncio.categoria}</Text>

            </View>

          </View>

          <View style={styles.precoLinha}>

            <Text style={styles.precoValor}>

              {`${anuncio.preco.toLocaleString('pt-PT')} MT`}

            </Text>

            <Text style={styles.precoSufixo}>/ mês</Text>

          </View>

        </View>

        {anuncioLocal && (
          <View style={styles.seccao}>
            <View style={styles.seccaoHeader}>
              <Icone name="information-outline" size={20} color={Colors.carvao} />
              <Text style={styles.seccaoTitulo}>Informações do anúncio</Text>
            </View>
            {!!anuncioLocal.descricao && (
              <Text style={{ color: Colors.carvao, fontFamily: Fonte.corpo, fontSize: 14, lineHeight: 21, marginBottom: 14 }}>
                {anuncioLocal.descricao}
              </Text>
            )}
            {Object.entries(anuncioLocal.caracteristicas || {})
              .filter(([_, valor]) => valor !== null && valor !== undefined && String(valor).trim() !== '')
              .map(([chave, valor]) => (
                <View key={chave} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borda }}>
                  <Text style={{ color: Colors.textoSecundario, flex: 1, fontFamily: Fonte.corpo }}>{chave.replace(/([A-Z])/g, ' $1')}</Text>
                  <Text style={{ color: Colors.carvao, fontFamily: Fonte.corpoSemi, flex: 1, textAlign: 'right' }}>{String(valor)}</Text>
                </View>
              ))}
            <Text style={{ color: Colors.textoSecundario, fontFamily: Fonte.corpo, fontSize: 12, marginTop: 12 }}>
              As estatísticas reais serão apresentadas quando existir integração com o backend.
            </Text>
          </View>
        )}

        {anuncioLocal && estadoActual === 'pendente' && (
          <View style={styles.seccao}>
            <View style={[styles.estadoVazioCard, { borderColor: Colors.azulSuave }]}>
              <View style={[styles.estadoVazioIcone, { backgroundColor: Colors.azulSuave }]}>
                <Icone name="clock-outline" size={36} color={Colors.azul} />
              </View>
              <Text style={[styles.estadoVazioTitulo, { color: Colors.azulTexto }]}>Pagamento pendente</Text>
              <Text style={styles.estadoVazioTexto}>Este anúncio ainda não foi confirmado como pago e não deve aparecer no catálogo público.</Text>
            </View>
          </View>
        )}

        {/* ============ DESCRIÇÃO E CARACTERÍSTICAS REAIS ============ */}
        {anuncioLocal && (
          <>
            <View style={styles.seccao}>
              <View style={styles.seccaoHeader}>
                <Icone name="text-box-outline" size={20} color={Colors.carvao} />
                <Text style={styles.seccaoTitulo}>Descrição do imóvel</Text>
              </View>
              <Text style={styles.detalheDescricao}>
                {anuncioLocal.descricao?.trim() || 'O anunciante ainda não adicionou uma descrição.'}
              </Text>
            </View>

            {Object.entries(anuncioLocal.caracteristicas || {}).filter(([chave, valor]) =>
              valor !== null && valor !== undefined && valor !== '' &&
              !['categoriaPersonalizada', 'detalhesCategoriaPersonalizada'].includes(chave)
            ).length > 0 && (
              <View style={styles.seccao}>
                <View style={styles.seccaoHeader}>
                  <Icone name="format-list-bulleted" size={20} color={Colors.carvao} />
                  <Text style={styles.seccaoTitulo}>Características</Text>
                </View>
                <View style={styles.detalheCaracteristicas}>
                  {Object.entries(anuncioLocal.caracteristicas || {}).filter(([chave, valor]) =>
                    valor !== null && valor !== undefined && valor !== '' &&
                    !['categoriaPersonalizada', 'detalhesCategoriaPersonalizada'].includes(chave)
                  ).map(([chave, valor]) => (
                    <View key={chave} style={styles.detalheCaracteristicaLinha}>
                      <Text style={styles.detalheCaracteristicaChave}>
                        {chave.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^./, letra => letra.toUpperCase())}
                      </Text>
                      <Text style={styles.detalheCaracteristicaValor}>
                        {Array.isArray(valor) ? valor.join(', ') : typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : String(valor)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {!anuncioLocal && (<>

                {/* ============ DESEMPENHO ============ */}

        <View style={styles.seccao}>

          <View style={styles.seccaoHeader}>

            <Icone name="chart-line" size={20} color={Colors.carvao} />

            <Text style={styles.seccaoTitulo}>Desempenho</Text>

            <Text style={styles.seccaoSubtitulo}>Últimos 7 dias</Text>

          </View>

          {/* 4 Stats em grid */}

          <View style={styles.statsGrid}>

            <StatCard

              icone="eye"

              valor={anuncio.stats.visualizacoesTotal}

              label="Visitas"

              corIcone={Colors.carvao}

              corFundo={Colors.azulSuave}

            />

            <StatCard

              icone="lock-open-variant"

              valor={anuncio.stats.desbloqueios}

              label="Desbloqueios"

              corIcone={Colors.azul}

              corFundo={Colors.azulSuave}

            />

            <StatCard

              icone="heart"

              valor={anuncio.stats.favoritos}

              label="Favoritos"

              corIcone={Colors.erro}

              corFundo={Colors.erroFundo}

            />

            <StatCard

              icone="share-variant"

              valor={anuncio.stats.partilhas}

              label="Partilhas"

              corIcone={Colors.verdeTexto}

              corFundo={Colors.verdeSuave}

            />

          </View>

          {/* Gráfico de visitas */}

          <View style={styles.graficoCard}>

            <View style={styles.graficoHeader}>

              <Text style={styles.graficoTitulo}>Visitas por dia</Text>

              <Text style={styles.graficoTotal}>

                {`${anuncio.stats.visualizacoes7Dias} total`}

              </Text>

            </View>

            <View style={styles.graficoBarras}>

              {anuncio.stats.visitasUltimos7Dias.map((valor, index) => {

                const altura = (valor / maxVisitas) * 100;

                const ehMaximo = valor === maxVisitas;

                return (

                  <View key={index} style={styles.graficoBarraColuna}>

                    <View style={styles.graficoBarraContainer}>

                      {ehMaximo && (

                        <Text style={styles.graficoBarraValor}>{valor}</Text>

                      )}

                      <View

                        style={[

                          styles.graficoBarra,

                          {

                            height: `${Math.max(altura, 8)}%`,

                            backgroundColor: ehMaximo ? Colors.azul : Colors.borda,

                          },

                        ]}

                      />

                    </View>

                    <Text style={styles.graficoBarraDia}>

                      {diasSemana[index]}

                    </Text>

                  </View>

                );

              })}

            </View>

          </View>

        </View>

        {/* ============ RECEITA GERADA ============ */}

        <View style={styles.seccao}>

          <View style={styles.seccaoHeader}>

            <Icone name="cash-multiple" size={20} color={Colors.verdeTexto} />

            <Text style={styles.seccaoTitulo}>Receita gerada</Text>

          </View>

          <View style={styles.receitaCard}>

            <LinearGradient

              colors={[Colors.verdeTexto, Colors.verdeTexto]}

              style={StyleSheet.absoluteFill}

              start={{ x: 0, y: 0 }}

              end={{ x: 1, y: 1 }}

            />

            <View style={styles.receitaConteudo}>

              <Text style={styles.receitaLabel}>Procuradores que te contactaram</Text>

              <View style={styles.receitaValorLinha}>

                <Text style={styles.receitaValor}>{anuncio.receita}</Text>

                <Text style={styles.receitaMoeda}>MT</Text>

              </View>

              <View style={styles.receitaCalculo}>

                <View style={styles.receitaCalculoItem}>

                  <Text style={styles.receitaCalculoValor}>{anuncio.stats.desbloqueios}</Text>

                  <Text style={styles.receitaCalculoLabel}>desbloqueios</Text>

                </View>

                <Text style={styles.receitaCalculoSinal}>×</Text>

                <View style={styles.receitaCalculoItem}>

                  <Text style={styles.receitaCalculoValor}>25</Text>

                  <Text style={styles.receitaCalculoLabel}>MT cada</Text>

                </View>

              </View>

            </View>

          </View>

          <Text style={styles.receitaNota}>

            * Valores estimados. A receita real depende dos pagamentos processados.

          </Text>

        </View>

        </>)}

        {!anuncioLocal && (<>
        {/* ============ VALIDADE ============ */}

        <View style={styles.seccao}>

          <View style={styles.seccaoHeader}>

            <Icone name="calendar-clock" size={20} color={Colors.carvao} />

            <Text style={styles.seccaoTitulo}>Validade do anúncio</Text>

          </View>

          <View style={styles.validadeCard}>

            <View style={styles.validadeDatasLinha}>

              <View style={styles.validadeDataBox}>

                <Text style={styles.validadeDataLabel}>Publicado</Text>

                <Text style={styles.validadeDataValor}>{anuncio.dataPublicacao}</Text>

              </View>

              <Ionicons name="arrow-forward" size={16} color={Colors.textoSecundario} />

              <View style={styles.validadeDataBox}>

                <Text style={styles.validadeDataLabel}>

                  {estadoActual === 'expirado' ? 'Expirou em' : 'Expira em'}

                </Text>

                <Text style={[

                  styles.validadeDataValor,

                  estadoActual === 'expirado' && { color: Colors.erro },

                ]}>

                  {anuncio.dataExpiracao}

                </Text>

              </View>

            </View>

            {/* Barra de progresso */}

            <View style={styles.validadeBarraContainer}>

              <View style={styles.validadeBarraTrack}>

                <LinearGradient

                  colors={

                    progressoValidade >= 80

                      ? [Colors.erro, Colors.erro]

                      : progressoValidade >= 60

                      ? [Colors.azul, Colors.azul]

                      : [Colors.verdeTexto, Colors.verdeTexto]

                  }

                  style={[

                    styles.validadeBarraFill,

                    { width: `${progressoValidade}%` },

                  ]}

                  start={{ x: 0, y: 0 }}

                  end={{ x: 1, y: 0 }}

                />

              </View>

              <View style={styles.validadeBarraLegenda}>

                <Text style={styles.validadeBarraDia}>

                  {`Dia ${anuncio.diasPublicado} de 30`}

                </Text>

                {estadoActual === 'activo' && anuncio.diasRestantes <= 7 && (

                  <View style={styles.validadeAviso}>

                    <Ionicons name="warning" size={12} color={Colors.erro} />

                    <Text style={styles.validadeAvisoTexto}>Perto de expirar</Text>

                  </View>

                )}

              </View>

            </View>

            {/* CTA Prolongar se perto de expirar ou expirado */}

            {(estadoActual === 'expirado' || (estadoActual === 'activo' && anuncio.diasRestantes <= 7)) && (

              <TouchableOpacity

                style={styles.validadeProlongarBtn}

                onPress={handleProlongar}

                activeOpacity={0.85}

              >

                <Icone name="refresh" size={16} color={Colors.branco} />

                <Text style={styles.validadeProlongarTexto}>

                  {estadoActual === 'expirado' ? 'Reactivar por +30 dias' : 'Prolongar por +30 dias'}

                </Text>

              </TouchableOpacity>

            )}

          </View>

        </View>

        {/* ============ SUGESTÕES DE UPSELL ============ */}

        {estadoActual === 'activo' && (

          <View style={styles.seccao}>

            <View style={styles.seccaoHeader}>

              <Icone name="rocket-launch" size={20} color={Colors.azul} />

              <Text style={styles.seccaoTitulo}>Aumenta os teus contactos</Text>

            </View>

            <TouchableOpacity style={styles.upsellCard} activeOpacity={0.85}>

              <View style={[styles.upsellIcone, { backgroundColor: Colors.azulSuave }]}>

                <Icone name="video" size={24} color={Colors.azul} />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.upsellTitulo}>Adiciona um vídeo</Text>

                <Text style={styles.upsellDescricao}>

                  Anúncios com vídeo recebem até 3x mais contactos

                </Text>

              </View>

              <View style={styles.upsellBadge}>

                <Text style={styles.upsellBadgeTexto}>+50 MT</Text>

              </View>

            </TouchableOpacity>

            <TouchableOpacity style={styles.upsellCard} activeOpacity={0.85}>

              <View style={[styles.upsellIcone, { backgroundColor: Colors.erroFundo }]}>

                <Icone name="star" size={24} color={Colors.erro} />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.upsellTitulo}>Destaca o anúncio</Text>

                <Text style={styles.upsellDescricao}>

                  Aparece no topo da categoria durante 7 dias (+5x contactos)

                </Text>

              </View>

              <View style={styles.upsellBadge}>

                <Text style={styles.upsellBadgeTexto}>+150 MT</Text>

              </View>

            </TouchableOpacity>

            <TouchableOpacity style={styles.upsellCard} activeOpacity={0.85}>

              <View style={[styles.upsellIcone, { backgroundColor: Colors.azulSuave }]}>

                <Icone name="bullhorn" size={24} color={Colors.azul} />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.upsellTitulo}>Promove nas redes</Text>

                <Text style={styles.upsellDescricao}>

                  Partilha automática no Facebook e Instagram da GoHome

                </Text>

              </View>

              <View style={styles.upsellBadge}>

                <Text style={styles.upsellBadgeTexto}>+75 MT</Text>

              </View>

            </TouchableOpacity>

          </View>

        )}

        {/* ============ ESTADO VAZIO (se expirado) ============ */}

        {estadoActual === 'expirado' && (

          <View style={styles.seccao}>

            <View style={styles.estadoVazioCard}>

              <View style={styles.estadoVazioIcone}>

                <Icone name="archive" size={40} color={Colors.erro} />

              </View>

              <Text style={styles.estadoVazioTitulo}>Este anúncio expirou</Text>

              <Text style={styles.estadoVazioTexto}>

                Reactiva por mais 30 dias para voltar a aparecer nas pesquisas e receber contactos.

              </Text>

              <TouchableOpacity

                style={styles.estadoVazioBtn}

                onPress={handleProlongar}

                activeOpacity={0.85}

              >

                <LinearGradient

                  colors={[Colors.azul, Colors.azul]}

                  style={StyleSheet.absoluteFill}

                  start={{ x: 0, y: 0 }}

                  end={{ x: 1, y: 0 }}

                />

                <Icone name="refresh" size={18} color={Colors.branco} />

                <Text style={styles.estadoVazioBtnTexto}>

                  {`Reactivar (${anuncio.valorPago} MT)`}

                </Text>

              </TouchableOpacity>

            </View>

          </View>

        )}

        {/* ============ ESTADO PAUSADO ============ */}

        {estadoActual === 'pausado' && (

          <View style={styles.seccao}>

            <View style={[styles.estadoVazioCard, { borderColor: Colors.azul }]}>

              <View style={[styles.estadoVazioIcone, { backgroundColor: Colors.azulSuave }]}>

                <Icone name="pause-circle" size={40} color={Colors.azul} />

              </View>

              <Text style={[styles.estadoVazioTitulo, { color: Colors.azulTexto }]}>

                Anúncio pausado

              </Text>

              <Text style={styles.estadoVazioTexto}>

                Não aparece nas pesquisas enquanto estiver pausado. Podes retomar quando quiseres.

              </Text>

              <TouchableOpacity

                style={styles.estadoVazioBtn}

                onPress={handlePausar}

                activeOpacity={0.85}

              >

                <LinearGradient

                  colors={[Colors.verdeTexto, Colors.verdeTexto]}

                  style={StyleSheet.absoluteFill}

                  start={{ x: 0, y: 0 }}

                  end={{ x: 1, y: 0 }}

                />

                <Icone name="play-circle" size={18} color={Colors.branco} />

                <Text style={styles.estadoVazioBtnTexto}>Retomar anúncio</Text>

              </TouchableOpacity>

            </View>

          </View>

        )}

        </>)}
      </ScrollView>

      {/* ============ FOOTER FIXO COM ACÇÕES ============ */}

      <View style={styles.footer}>

        <SafeAreaView edges={['bottom']}>

          <View style={styles.footerBotoes}>

            <TouchableOpacity

              style={styles.footerBotaoSecundario}

              onPress={handleEditar}

              activeOpacity={0.85}

            >

              <Icone name="pencil" size={18} color={Colors.carvao} />

              <Text style={styles.footerBotaoSecundarioTexto}>Editar</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.footerBotaoPrincipal}

              onPress={handleProlongar}

              activeOpacity={0.9}

            >

              <LinearGradient

                colors={[Colors.azul, Colors.azul]}

                style={StyleSheet.absoluteFill}

                start={{ x: 0, y: 0 }}

                end={{ x: 1, y: 0 }}

              />

              <Icone name="refresh" size={18} color={Colors.branco} />

              <Text style={styles.footerBotaoPrincipalTexto}>Prolongar</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.footerBotaoIcone}

              onPress={() => setModalMaisVisivel(true)}

              activeOpacity={0.85}

            >

              <Ionicons name="ellipsis-vertical" size={20} color={Colors.carvao} />

            </TouchableOpacity>

          </View>

        </SafeAreaView>

      </View>

      {/* ============ MODAL MAIS OPÇÕES ============ */}

      <Modal

        visible={modalMaisVisivel}

        transparent

        animationType="slide"

        onRequestClose={() => setModalMaisVisivel(false)}

      >

        <View style={styles.modalOverlay}>

          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalMaisVisivel(false)} />

          <View style={styles.modalContent}>

            <View style={styles.modalHandle} />

            <Text style={styles.modalTitulo}>Opções do anúncio</Text>

            <TouchableOpacity style={styles.modalOpcao} onPress={handlePartilhar}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>

                <Icone name="share-variant" size={22} color={Colors.azul} />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.modalOpcaoTitulo}>Partilhar anúncio</Text>

                <Text style={styles.modalOpcaoDescricao}>WhatsApp, Facebook, SMS...</Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.textoTerciario} />

            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={handleEstatisticasDetalhadas}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>

                <Icone name="chart-box" size={22} color={Colors.azul} />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.modalOpcaoTitulo}>Estatísticas detalhadas</Text>

                <Text style={styles.modalOpcaoDescricao}>Horários, origem, concorrência</Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.textoTerciario} />

            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={handlePausar}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.azulSuave }]}>

                <Icone

                  name={estadoActual === 'pausado' ? 'play-circle' : 'pause-circle'}

                  size={22}

                  color={Colors.azul}

                />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.modalOpcaoTitulo}>

                  {estadoActual === 'pausado' ? 'Retomar anúncio' : 'Pausar anúncio'}

                </Text>

                <Text style={styles.modalOpcaoDescricao}>

                  {estadoActual === 'pausado'

                    ? 'Volta a aparecer nas pesquisas'

                    : 'Esconde temporariamente das pesquisas'}

                </Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.textoTerciario} />

            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOpcao, styles.modalOpcaoPerigo]} onPress={handleEliminar}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: Colors.erroFundo }]}>

                <Icone name="trash-can" size={22} color={Colors.erro} />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={[styles.modalOpcaoTitulo, { color: Colors.erro }]}>

                  Eliminar anúncio

                </Text>

                <Text style={styles.modalOpcaoDescricao}>Acção irreversível</Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.erroBorda} />

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.modalFechar}

              onPress={() => setModalMaisVisivel(false)}

            >

              <Text style={styles.modalFecharTexto}>Fechar</Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

      {/* ============ MODAL CONFIRMAR PAUSAR ============ */}

      <Modal

        visible={modalPausarVisivel}

        transparent

        animationType="fade"

        onRequestClose={() => setModalPausarVisivel(false)}

      >

        <View style={styles.modalCentroOverlay}>

          <View style={styles.modalCentroBox}>

            <View style={[styles.modalCentroIcone, { backgroundColor: Colors.azulSuave }]}>

              <Icone

                name={estadoActual === 'pausado' ? 'play-circle' : 'pause-circle'}

                size={36}

                color={Colors.azul}

              />

            </View>

            <Text style={styles.modalCentroTitulo}>

              {estadoActual === 'pausado' ? 'Retomar anúncio?' : 'Pausar anúncio?'}

            </Text>

            <Text style={styles.modalCentroTexto}>

              {estadoActual === 'pausado'

                ? 'O anúncio volta a aparecer nas pesquisas imediatamente.'

                : 'O anúncio deixa de aparecer nas pesquisas até retomares. Não perdes dias de validade.'}

            </Text>

            <View style={styles.modalCentroBotoes}>

              <TouchableOpacity

                style={styles.modalCentroBtnCancelar}

                onPress={() => setModalPausarVisivel(false)}

              >

                <Text style={styles.modalCentroBtnCancelarTexto}>Cancelar</Text>

              </TouchableOpacity>

              <TouchableOpacity

                style={styles.modalCentroBtnConfirmar}

                onPress={confirmarPausar}

              >

                <Text style={styles.modalCentroBtnConfirmarTexto}>

                  {estadoActual === 'pausado' ? 'Retomar' : 'Pausar'}

                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

      {/* ============ MODAL CONFIRMAR ELIMINAR ============ */}

      <Modal

        visible={modalEliminarVisivel}

        transparent

        animationType="fade"

        onRequestClose={() => setModalEliminarVisivel(false)}

      >

        <View style={styles.modalCentroOverlay}>

          <View style={styles.modalCentroBox}>

            <View style={[styles.modalCentroIcone, { backgroundColor: Colors.erroFundo }]}>

              <Icone name="alert" size={36} color={Colors.erro} />

            </View>

            <Text style={styles.modalCentroTitulo}>Eliminar este anúncio?</Text>

            <Text style={styles.modalCentroTexto}>

              Esta acção é irreversível. Perdes o anúncio e todas as estatísticas associadas. O valor pago não é reembolsado.

            </Text>

            <View style={styles.modalCentroBotoes}>

              <TouchableOpacity

                style={styles.modalCentroBtnCancelar}

                onPress={() => setModalEliminarVisivel(false)}

              >

                <Text style={styles.modalCentroBtnCancelarTexto}>Cancelar</Text>

              </TouchableOpacity>

              <TouchableOpacity

                style={[styles.modalCentroBtnConfirmar, { backgroundColor: Colors.erro }]}

                onPress={confirmarEliminar}

              >

                <Text style={styles.modalCentroBtnConfirmarTexto}>Eliminar</Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

    </View>

  );

}

// ============================================================

// COMPONENTE: STAT CARD

// ============================================================

function StatCard({ icone, valor, label, corIcone, corFundo }: {

  icone: string;

  valor: number;

  label: string;

  corIcone: string;

  corFundo: string;

}) {

  return (

    <View style={styles.statCard}>

      <View style={[styles.statIcone, { backgroundColor: corFundo }]}>

        <Icone name={icone as any} size={20} color={corIcone} />

      </View>

      <Text style={styles.statValor}>{valor}</Text>

      <Text style={styles.statLabel}>{label}</Text>

    </View>

  );

}

// ============================================================

// STYLES

// ============================================================

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: Colors.azulSuave },

  detalheDescricao: { color: Colors.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14, lineHeight: 22 },
  detalheCaracteristicas: { gap: 0 },
  detalheCaracteristicaLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borda },
  detalheCaracteristicaChave: { flex: 1, color: Colors.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13, textTransform: 'capitalize' },
  detalheCaracteristicaValor: { flex: 1, color: Colors.carvao, fontSize: 13, fontFamily: Fonte.corpoSemi, textAlign: 'right' },

  // ============ Fotos ============

  fotosWrapper: {

    width: screenWidth,

    height: 280,

    backgroundColor: Colors.carvao,

    position: 'relative',

  },

  foto: {

    width: screenWidth,

    height: 280,

  },

  fotoIndicadorContainer: {

    position: 'absolute',

    bottom: 16,

    left: 0,

    right: 0,

    flexDirection: 'row',

    justifyContent: 'center',

    gap: 6,

  },

  fotoIndicador: {

    width: 6,

    height: 6,

    borderRadius: 3,

    backgroundColor: 'rgba(255,255,255,0.5)',

  },

  fotoIndicadorActivo: {

    width: 24,

    backgroundColor: Colors.branco,

  },

  fotoContador: {

    position: 'absolute',

    bottom: 16,

    right: 16,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(0,0,0,0.6)',

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 12,

    gap: 5,

  },

  fotoContadorTexto: {

    color: Colors.branco,

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Cabeçalho info ============

  cabecalho: {

    backgroundColor: Colors.branco,

    paddingHorizontal: 20,

    paddingTop: 20,

    paddingBottom: 20,

    borderBottomWidth: 1,

    borderBottomColor: Colors.borda,

  },

  estadoBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 20,

    alignSelf: 'flex-start',

    gap: 4,

    marginBottom: 12,

  },

  estadoBadgeTexto: {

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  estadoBadgeExtra: {

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

    color: Colors.textoSecundario,

  },

  titulo: {

    ...Typography.h2,

    color: Colors.carvao,

    fontFamily: Fonte.tituloSemi,

    marginBottom: 8,

    lineHeight: 28,

  },

  metaLinha: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

    marginBottom: 14,

  },

  metaItem: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

  },

  metaTexto: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 13,

  },

  metaDivisor: {

    width: 1,

    height: 12,

    backgroundColor: Colors.borda,

  },

  precoLinha: {

    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 6,

  },

  precoValor: {

    ...Typography.h2,

    color: Colors.azulTexto,

    fontFamily: Fonte.tituloBold,

  },

  precoSufixo: {

    ...Typography.body,

    color: Colors.textoSecundario,

  },

  // ============ Secções ============

  seccao: {

    backgroundColor: Colors.branco,

    marginTop: 10,

    paddingHorizontal: 20,

    paddingVertical: 20,

  },

  seccaoHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    marginBottom: 16,

  },

  seccaoTitulo: {

    ...Typography.h4,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

    flex: 1,

  },

  seccaoSubtitulo: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

  },

  // ============ Stats grid ============

  statsGrid: {

    flexDirection: 'row',

    gap: 10,

    marginBottom: 20,

  },

  statCard: {

    flex: 1,

    backgroundColor: Colors.fundoSuave,

    borderRadius: 14,

    padding: 12,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: Colors.borda,

  },

  statIcone: {

    width: 36,

    height: 36,

    borderRadius: 10,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 8,

  },

  statValor: {

    ...Typography.h3,

    color: Colors.carvao,

    fontFamily: Fonte.corpoBold,

    marginBottom: 2,

  },

  statLabel: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Gráfico ============

  graficoCard: {

    backgroundColor: Colors.fundoSuave,

    borderRadius: 16,

    padding: 16,

    borderWidth: 1,

    borderColor: Colors.borda,

  },

  graficoHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 16,

  },

  graficoTitulo: {

    ...Typography.bodyBold,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

  },

  graficoTotal: {

    ...Typography.caption,

    color: Colors.azulTexto,

    fontFamily: Fonte.corpoSemi,

    fontSize: 13,

  },

  graficoBarras: {

    flexDirection: 'row',

    alignItems: 'flex-end',

    justifyContent: 'space-around',

    height: 120,

    gap: 8,

  },

  graficoBarraColuna: {

    flex: 1,

    alignItems: 'center',

    gap: 6,

  },

  graficoBarraContainer: {

    width: '100%',

    height: 100,

    justifyContent: 'flex-end',

    alignItems: 'center',

  },

  graficoBarraValor: {

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

    color: Colors.azulTexto,

    marginBottom: 2,

  },

  graficoBarra: {

    width: '100%',

    borderTopLeftRadius: 6,

    borderTopRightRadius: 6,

    minHeight: 6,

  },

  graficoBarraDia: {

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

    color: Colors.textoSecundario,

  },

  // ============ Receita ============

  receitaCard: {

    borderRadius: 18,

    overflow: 'hidden',

    marginBottom: 10,

    shadowColor: Colors.verdeTexto,

    shadowOpacity: 0.25,

    shadowRadius: 12,

    elevation: 5,

  },

  receitaConteudo: {

    padding: 20,

    alignItems: 'center',

  },

  receitaLabel: {

    color: 'rgba(255,255,255,0.85)',

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

    marginBottom: 8,

  },

  receitaValorLinha: {

    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 6,

    marginBottom: 14,

  },

  receitaValor: {

    color: Colors.branco,

    fontSize: 44,

    fontFamily: Fonte.tituloBold,

    lineHeight: 48,

  },

  receitaMoeda: {

    color: Colors.branco,

    fontSize: 20,

    fontFamily: Fonte.tituloSemi,

  },

  receitaCalculo: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 14,

    backgroundColor: 'rgba(255,255,255,0.15)',

    paddingHorizontal: 16,

    paddingVertical: 10,

    borderRadius: 12,

  },

  receitaCalculoItem: {

    alignItems: 'center',

  },

  receitaCalculoValor: {

    color: Colors.branco,

    fontSize: 18,

    fontFamily: Fonte.corpoBold,

  },

  receitaCalculoLabel: {

    color: 'rgba(255,255,255,0.85)',

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  receitaCalculoSinal: {

    color: Colors.branco,

    fontSize: 20,

    fontFamily: Fonte.tituloSemi,

  },

  receitaNota: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

    fontStyle: 'italic',

    textAlign: 'center',

  },

  // ============ Validade ============

  validadeCard: {

    backgroundColor: Colors.fundoSuave,

    borderRadius: 16,

    padding: 16,

    borderWidth: 1,

    borderColor: Colors.borda,

  },

  validadeDatasLinha: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 10,

    marginBottom: 16,

  },

  validadeDataBox: {

    flex: 1,

  },

  validadeDataLabel: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

    marginBottom: 3,

  },

  validadeDataValor: {

    ...Typography.bodyBold,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

  },

  validadeBarraContainer: {

    marginBottom: 4,

  },

  validadeBarraTrack: {

    height: 8,

    backgroundColor: Colors.borda,

    borderRadius: 4,

    overflow: 'hidden',

    marginBottom: 8,

  },

  validadeBarraFill: {

    height: '100%',

    borderRadius: 4,

  },

  validadeBarraLegenda: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

  },

  validadeBarraDia: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  validadeAviso: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    backgroundColor: Colors.erroFundo,

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 10,

  },

  validadeAvisoTexto: {

    color: Colors.erro,

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  validadeProlongarBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

    backgroundColor: Colors.azul,

    paddingVertical: 11,

    borderRadius: 12,

    marginTop: 16,

  },

  validadeProlongarTexto: {

    color: Colors.branco,

    fontSize: 13,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Upsell ============

  upsellCard: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    backgroundColor: Colors.fundoSuave,

    padding: 14,

    borderRadius: 14,

    marginBottom: 10,

    borderWidth: 1,

    borderColor: Colors.borda,

  },

  upsellIcone: {

    width: 48,

    height: 48,

    borderRadius: 14,

    justifyContent: 'center',

    alignItems: 'center',

  },

  upsellTitulo: {

    ...Typography.bodyBold,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

    marginBottom: 2,

  },

  upsellDescricao: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

    lineHeight: 15,

  },

  upsellBadge: {

    backgroundColor: Colors.azulSuave,

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 10,

  },

  upsellBadgeTexto: {

    color: Colors.azulTexto,

    fontSize: 12,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Estado vazio ============

  estadoVazioCard: {

    backgroundColor: Colors.branco,

    padding: 20,

    borderRadius: 18,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: Colors.erroBorda,

  },

  estadoVazioIcone: {

    width: 72,

    height: 72,

    borderRadius: 20,

    backgroundColor: Colors.erroFundo,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 14,

  },

  estadoVazioTitulo: {

    ...Typography.h3,

    color: Colors.erro,

    fontFamily: Fonte.corpoSemi,

    marginBottom: 6,

    textAlign: 'center',

  },

  estadoVazioTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textAlign: 'center',

    marginBottom: 16,

    fontSize: 13,

    lineHeight: 19,

  },

  estadoVazioBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 13,

    paddingHorizontal: 24,

    borderRadius: 14,

    overflow: 'hidden',

    gap: 8,

  },

  estadoVazioBtnTexto: {

    color: Colors.branco,

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Footer fixo ============

  footer: {

    position: 'absolute',

    bottom: 0,

    left: 0,

    right: 0,

    backgroundColor: 'rgba(255,255,255,0.98)',

    borderTopWidth: 1,

    borderTopColor: Colors.borda,

    shadowColor: Colors.carvao,

    shadowOpacity: 0.08,

    shadowRadius: 12,

    elevation: 10,

  },

  footerBotoes: {

    flexDirection: 'row',

    gap: 8,

    paddingHorizontal: 16,

    paddingTop: 10,

    paddingBottom: 6,

  },

  footerBotaoSecundario: {

    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 13,

    borderRadius: 14,

    backgroundColor: Colors.fundoSuave,

    borderWidth: 1,

    borderColor: Colors.borda,

    gap: 6,

  },

  footerBotaoSecundarioTexto: {

    color: Colors.carvao,

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

  footerBotaoPrincipal: {

    flex: 1.3,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 13,

    borderRadius: 14,

    overflow: 'hidden',

    gap: 6,

  },

  footerBotaoPrincipalTexto: {

    color: Colors.branco,

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

  footerBotaoIcone: {

    width: 46,

    height: 46,

    borderRadius: 14,

    backgroundColor: Colors.fundoSuave,

    borderWidth: 1,

    borderColor: Colors.borda,

    justifyContent: 'center',

    alignItems: 'center',

  },

  // ============ Modal (bottom sheet) ============

  modalOverlay: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.6)',

    justifyContent: 'flex-end',

  },

  modalContent: {

    backgroundColor: Colors.branco,

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    paddingBottom: 24,

    paddingHorizontal: 16,

  },

  modalHandle: {

    width: 40,

    height: 4,

    borderRadius: 2,

    backgroundColor: Colors.borda,

    alignSelf: 'center',

    marginTop: 10,

    marginBottom: 12,

  },

  modalTitulo: {

    ...Typography.h3,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

    textAlign: 'center',

    marginBottom: 16,

  },

  modalOpcao: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 14,

    paddingHorizontal: 10,

    gap: 14,

    borderBottomWidth: 1,

    borderBottomColor: Colors.fundoSuave,

  },

  modalOpcaoPerigo: {

    borderBottomWidth: 0,

  },

  modalOpcaoIcone: {

    width: 44,

    height: 44,

    borderRadius: 12,

    justifyContent: 'center',

    alignItems: 'center',

  },

  modalOpcaoTitulo: {

    ...Typography.bodyBold,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

    marginBottom: 2,

  },

  modalOpcaoDescricao: {

    ...Typography.caption,

    color: Colors.textoSecundario,

    fontSize: 12,

  },

  modalFechar: {

    marginTop: 12,

    paddingVertical: 14,

    borderRadius: 14,

    backgroundColor: Colors.fundoSuave,

    alignItems: 'center',

  },

  modalFecharTexto: {

    color: Colors.carvao,

    fontSize: 15,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Modal central ============

  modalCentroOverlay: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.65)',

    justifyContent: 'center',

    alignItems: 'center',

    padding: 20,

  },

  modalCentroBox: {

    backgroundColor: Colors.branco,

    borderRadius: 20,

    padding: 24,

    width: '100%',

    maxWidth: 380,

    alignItems: 'center',

  },

  modalCentroIcone: {

    width: 72,

    height: 72,

    borderRadius: 20,

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 14,

  },

  modalCentroTitulo: {

    ...Typography.h3,

    color: Colors.carvao,

    fontFamily: Fonte.corpoSemi,

    textAlign: 'center',

    marginBottom: 10,

  },

  modalCentroTexto: {

    ...Typography.body,

    color: Colors.textoSecundario,

    textAlign: 'center',

    marginBottom: 20,

    lineHeight: 20,

    fontSize: 14,

  },

  modalCentroBotoes: {

    flexDirection: 'row',

    gap: 10,

    width: '100%',

  },

  modalCentroBtnCancelar: {

    flex: 1,

    paddingVertical: 14,

    borderRadius: 14,

    backgroundColor: Colors.fundoSuave,

    alignItems: 'center',

  },

  modalCentroBtnCancelarTexto: {

    color: Colors.carvao,

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

  modalCentroBtnConfirmar: {

    flex: 1,

    paddingVertical: 14,

    borderRadius: 14,

    backgroundColor: Colors.azul,

    alignItems: 'center',

  },

  modalCentroBtnConfirmarTexto: {

    color: Colors.branco,

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

});