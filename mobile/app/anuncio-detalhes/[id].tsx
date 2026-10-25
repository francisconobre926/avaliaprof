import { useState, useRef, useMemo, useEffect } from 'react';

import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  TouchableOpacity,

  Image,

  Dimensions,

  StatusBar,

  Modal,

  Pressable,

  Share,

  Alert,

  Animated,

} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';

import { Typography, Spacing, Radius } from '../../src/theme/typography';
import { useUserStore } from '../../src/store/userStore';
import { obterAnuncioLocal, guardarAnuncioLocal, eliminarAnuncioLocal, type AnuncioLocal } from '../../src/store/anunciosLocal';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
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

      cor: '#2F7A4F',

      corFundo: '#EAF3EC',

      icone: 'check-circle',

    },

    pausado: {

      label: 'Pausado',

      cor: '#E8760A',

      corFundo: '#FBF0E3',

      icone: 'pause-circle',

    },

    expirado: {

      label: 'Expirado',

      cor: '#C2412D',

      corFundo: '#FBECE9',

      icone: 'close-circle',

    },

    pendente: {

      label: 'Pendente',

      cor: '#0A6BC0',

      corFundo: '#EAF2FA',

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

      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

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

          {/* Overlay com gradiente escuro no topo */}

          <LinearGradient

            colors={['rgba(0,0,0,0.5)', 'transparent']}

            style={styles.fotoGradientTopo}

          />

          {/* Botões flutuantes */}

          <SafeAreaView edges={['top']} style={styles.fotoHeaderOverlay}>

            <TouchableOpacity

              style={styles.fotoBotaoCircular}

              onPress={() => router.back()}

            >

              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />

            </TouchableOpacity>

            <View style={styles.fotoBotoesDireita}>

              <TouchableOpacity

                style={styles.fotoBotaoCircular}

                onPress={handlePartilhar}

              >

                <Ionicons name="share-social" size={20} color="#FFFFFF" />

              </TouchableOpacity>

              <TouchableOpacity

                style={styles.fotoBotaoCircular}

                onPress={() => setModalMaisVisivel(true)}

              >

                <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />

              </TouchableOpacity>

            </View>

          </SafeAreaView>

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

            <Ionicons name="images" size={13} color="#FFFFFF" />

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

              <Ionicons name="location" size={14} color="#5B616B" />

              <Text style={styles.metaTexto}>{anuncio.zona}</Text>

            </View>

            <View style={styles.metaDivisor} />

            <View style={styles.metaItem}>

              <Icone name="shape" size={14} color="#5B616B" />

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
              <Icone name="information-outline" size={20} color="#16202E" />
              <Text style={styles.seccaoTitulo}>Informações do anúncio</Text>
            </View>
            {!!anuncioLocal.descricao && (
              <Text style={{ color: '#34445A', fontFamily: Fonte.corpo, fontSize: 14, lineHeight: 21, marginBottom: 14 }}>
                {anuncioLocal.descricao}
              </Text>
            )}
            {Object.entries(anuncioLocal.caracteristicas || {})
              .filter(([_, valor]) => valor !== null && valor !== undefined && String(valor).trim() !== '')
              .map(([chave, valor]) => (
                <View key={chave} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E7E5DF' }}>
                  <Text style={{ color: '#5B616B', flex: 1 }}>{chave.replace(/([A-Z])/g, ' $1')}</Text>
                  <Text style={{ color: '#16202E', fontFamily: Fonte.corpoSemi, flex: 1, textAlign: 'right' }}>{String(valor)}</Text>
                </View>
              ))}
            <Text style={{ color: '#5B616B', fontFamily: Fonte.corpo, fontSize: 11, marginTop: 12 }}>
              As estatísticas reais serão apresentadas quando existir integração com o backend.
            </Text>
          </View>
        )}

        {anuncioLocal && estadoActual === 'pendente' && (
          <View style={styles.seccao}>
            <View style={[styles.estadoVazioCard, { borderColor: '#BBDEFB' }]}>
              <View style={[styles.estadoVazioIcone, { backgroundColor: '#EAF2FA' }]}>
                <Icone name="clock-outline" size={36} color="#0A6BC0" />
              </View>
              <Text style={[styles.estadoVazioTitulo, { color: '#0A6BC0' }]}>Pagamento pendente</Text>
              <Text style={styles.estadoVazioTexto}>Este anúncio ainda não foi confirmado como pago e não deve aparecer no catálogo público.</Text>
            </View>
          </View>
        )}

        {/* ============ DESCRIÇÃO E CARACTERÍSTICAS REAIS ============ */}
        {anuncioLocal && (
          <>
            <View style={styles.seccao}>
              <View style={styles.seccaoHeader}>
                <Icone name="text-box-outline" size={20} color="#16202E" />
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
                  <Icone name="format-list-bulleted" size={20} color="#16202E" />
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

            <Icone name="chart-line" size={20} color="#16202E" />

            <Text style={styles.seccaoTitulo}>Desempenho</Text>

            <Text style={styles.seccaoSubtitulo}>Últimos 7 dias</Text>

          </View>

          {/* 4 Stats em grid */}

          <View style={styles.statsGrid}>

            <StatCard

              icone="eye"

              valor={anuncio.stats.visualizacoesTotal}

              label="Visitas"

              corIcone="#16202E"

              corFundo="#EAF1FA"

            />

            <StatCard

              icone="lock-open-variant"

              valor={anuncio.stats.desbloqueios}

              label="Desbloqueios"

              corIcone="#F06C00"

              corFundo="#FBF0E3"

            />

            <StatCard

              icone="heart"

              valor={anuncio.stats.favoritos}

              label="Favoritos"

              corIcone="#C2412D"

              corFundo="#FBECE9"

            />

            <StatCard

              icone="share-variant"

              valor={anuncio.stats.partilhas}

              label="Partilhas"

              corIcone="#2F7A4F"

              corFundo="#EAF3EC"

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

                            backgroundColor: ehMaximo ? '#E8760A' : '#C8D5E5',

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

            <Icone name="cash-multiple" size={20} color="#2F7A4F" />

            <Text style={styles.seccaoTitulo}>Receita gerada</Text>

          </View>

          <View style={styles.receitaCard}>

            <LinearGradient

              colors={['#2F7A4F', '#22593A']}

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

            <Icone name="calendar-clock" size={20} color="#16202E" />

            <Text style={styles.seccaoTitulo}>Validade do anúncio</Text>

          </View>

          <View style={styles.validadeCard}>

            <View style={styles.validadeDatasLinha}>

              <View style={styles.validadeDataBox}>

                <Text style={styles.validadeDataLabel}>Publicado</Text>

                <Text style={styles.validadeDataValor}>{anuncio.dataPublicacao}</Text>

              </View>

              <Ionicons name="arrow-forward" size={16} color="#5B616B" />

              <View style={styles.validadeDataBox}>

                <Text style={styles.validadeDataLabel}>

                  {estadoActual === 'expirado' ? 'Expirou em' : 'Expira em'}

                </Text>

                <Text style={[

                  styles.validadeDataValor,

                  estadoActual === 'expirado' && { color: '#C2412D' },

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

                      ? ['#C2412D', '#B71C1C']

                      : progressoValidade >= 60

                      ? ['#E8760A', '#E65100']

                      : ['#2F7A4F', '#22593A']

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

                    <Ionicons name="warning" size={12} color="#C2412D" />

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

                <Icone name="refresh" size={16} color="#FFFFFF" />

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

              <Icone name="rocket-launch" size={20} color="#E8760A" />

              <Text style={styles.seccaoTitulo}>Aumenta os teus contactos</Text>

            </View>

            <TouchableOpacity style={styles.upsellCard} activeOpacity={0.85}>

              <View style={[styles.upsellIcone, { backgroundColor: '#FBF0E3' }]}>

                <Icone name="video" size={24} color="#E8760A" />

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

              <View style={[styles.upsellIcone, { backgroundColor: '#FBECE9' }]}>

                <Icone name="star" size={24} color="#C2412D" />

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

              <View style={[styles.upsellIcone, { backgroundColor: '#EAF2FA' }]}>

                <Icone name="bullhorn" size={24} color="#0A6BC0" />

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

                <Icone name="archive" size={40} color="#C2412D" />

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

                  colors={['#FF9A00', '#FF5A00']}

                  style={StyleSheet.absoluteFill}

                  start={{ x: 0, y: 0 }}

                  end={{ x: 1, y: 0 }}

                />

                <Icone name="refresh" size={18} color="#FFFFFF" />

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

            <View style={[styles.estadoVazioCard, { borderColor: '#FFE0B2' }]}>

              <View style={[styles.estadoVazioIcone, { backgroundColor: '#FBF0E3' }]}>

                <Icone name="pause-circle" size={40} color="#E8760A" />

              </View>

              <Text style={[styles.estadoVazioTitulo, { color: '#E8760A' }]}>

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

                  colors={['#2F7A4F', '#22593A']}

                  style={StyleSheet.absoluteFill}

                  start={{ x: 0, y: 0 }}

                  end={{ x: 1, y: 0 }}

                />

                <Icone name="play-circle" size={18} color="#FFFFFF" />

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

              <Icone name="pencil" size={18} color="#16202E" />

              <Text style={styles.footerBotaoSecundarioTexto}>Editar</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.footerBotaoPrincipal}

              onPress={handleProlongar}

              activeOpacity={0.9}

            >

              <LinearGradient

                colors={['#FF9A00', '#FF5A00']}

                style={StyleSheet.absoluteFill}

                start={{ x: 0, y: 0 }}

                end={{ x: 1, y: 0 }}

              />

              <Icone name="refresh" size={18} color="#FFFFFF" />

              <Text style={styles.footerBotaoPrincipalTexto}>Prolongar</Text>

            </TouchableOpacity>

            <TouchableOpacity

              style={styles.footerBotaoIcone}

              onPress={() => setModalMaisVisivel(true)}

              activeOpacity={0.85}

            >

              <Ionicons name="ellipsis-vertical" size={20} color="#16202E" />

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

              <View style={[styles.modalOpcaoIcone, { backgroundColor: '#EAF2FA' }]}>

                <Icone name="share-variant" size={22} color="#0A6BC0" />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.modalOpcaoTitulo}>Partilhar anúncio</Text>

                <Text style={styles.modalOpcaoDescricao}>WhatsApp, Facebook, SMS...</Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color="#9A9EA5" />

            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={handleEstatisticasDetalhadas}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: '#F3E5F5' }]}>

                <Icone name="chart-box" size={22} color="#7B1FA2" />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.modalOpcaoTitulo}>Estatísticas detalhadas</Text>

                <Text style={styles.modalOpcaoDescricao}>Horários, origem, concorrência</Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color="#9A9EA5" />

            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOpcao} onPress={handlePausar}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: '#FBF0E3' }]}>

                <Icone

                  name={estadoActual === 'pausado' ? 'play-circle' : 'pause-circle'}

                  size={22}

                  color="#E8760A"

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

              <Ionicons name="chevron-forward" size={18} color="#9A9EA5" />

            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalOpcao, styles.modalOpcaoPerigo]} onPress={handleEliminar}>

              <View style={[styles.modalOpcaoIcone, { backgroundColor: '#FBECE9' }]}>

                <Icone name="trash-can" size={22} color="#C2412D" />

              </View>

              <View style={{ flex: 1 }}>

                <Text style={[styles.modalOpcaoTitulo, { color: '#C2412D' }]}>

                  Eliminar anúncio

                </Text>

                <Text style={styles.modalOpcaoDescricao}>Acção irreversível</Text>

              </View>

              <Ionicons name="chevron-forward" size={18} color="#F2C9C1" />

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

            <View style={[styles.modalCentroIcone, { backgroundColor: '#FBF0E3' }]}>

              <Icone

                name={estadoActual === 'pausado' ? 'play-circle' : 'pause-circle'}

                size={36}

                color="#E8760A"

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

            <View style={[styles.modalCentroIcone, { backgroundColor: '#FBECE9' }]}>

              <Icone name="alert" size={36} color="#C2412D" />

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

                style={[styles.modalCentroBtnConfirmar, { backgroundColor: '#C2412D' }]}

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

  container: { flex: 1, backgroundColor: '#F2F6FB' },

  detalheDescricao: { color: '#425873', fontFamily: Fonte.corpo, fontSize: 14, lineHeight: 22 },
  detalheCaracteristicas: { gap: 0 },
  detalheCaracteristicaLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E7E5DF' },
  detalheCaracteristicaChave: { flex: 1, color: '#5B616B', fontFamily: Fonte.corpo, fontSize: 13, textTransform: 'capitalize' },
  detalheCaracteristicaValor: { flex: 1, color: '#16202E', fontSize: 13, fontFamily: Fonte.corpoSemi, textAlign: 'right' },

  // ============ Fotos ============

  fotosWrapper: {

    width: screenWidth,

    height: 280,

    backgroundColor: '#16202E',

    position: 'relative',

  },

  foto: {

    width: screenWidth,

    height: 280,

  },

  fotoGradientTopo: {

    position: 'absolute',

    top: 0,

    left: 0,

    right: 0,

    height: 100,

  },

  fotoHeaderOverlay: {

    position: 'absolute',

    top: 0,

    left: 0,

    right: 0,

    paddingHorizontal: 16,

    paddingTop: 8,

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

  },

  fotoBotoesDireita: {

    flexDirection: 'row',

    gap: 10,

  },

  fotoBotaoCircular: {

    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor: 'rgba(0,0,0,0.4)',

    justifyContent: 'center',

    alignItems: 'center',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.2)',

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

    backgroundColor: '#FFFFFF',

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

    color: '#FFFFFF',

    fontSize: 11,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Cabeçalho info ============

  cabecalho: {

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 20,

    paddingTop: 20,

    paddingBottom: 20,

    borderBottomWidth: 1,

    borderBottomColor: '#E7E5DF',

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

    fontSize: 11,

    fontFamily: Fonte.corpoSemi,

    color: '#5B616B',

  },

  titulo: {

    ...Typography.h2,

    color: '#16202E',

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

    color: '#5B616B',

    fontSize: 13,

  },

  metaDivisor: {

    width: 1,

    height: 12,

    backgroundColor: '#E7E5DF',

  },

  precoLinha: {

    flexDirection: 'row',

    alignItems: 'baseline',

    gap: 6,

  },

  precoValor: {

    ...Typography.h2,

    color: '#F06C00',

    fontFamily: Fonte.tituloBold,

  },

  precoSufixo: {

    ...Typography.body,

    color: '#5B616B',

  },

  // ============ Secções ============

  seccao: {

    backgroundColor: '#FFFFFF',

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

    color: '#16202E',

    fontFamily: Fonte.corpoSemi,

    flex: 1,

  },

  seccaoSubtitulo: {

    ...Typography.caption,

    color: '#5B616B',

    fontSize: 11,

  },

  // ============ Stats grid ============

  statsGrid: {

    flexDirection: 'row',

    gap: 10,

    marginBottom: 20,

  },

  statCard: {

    flex: 1,

    backgroundColor: '#F7F6F2',

    borderRadius: 14,

    padding: 12,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E7E5DF',

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

    color: '#16202E',

    fontFamily: Fonte.corpoBold,

    marginBottom: 2,

  },

  statLabel: {

    ...Typography.caption,

    color: '#5B616B',

    fontSize: 10,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Gráfico ============

  graficoCard: {

    backgroundColor: '#F7F6F2',

    borderRadius: 16,

    padding: 16,

    borderWidth: 1,

    borderColor: '#E7E5DF',

  },

  graficoHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 16,

  },

  graficoTitulo: {

    ...Typography.bodyBold,

    color: '#16202E',

    fontFamily: Fonte.corpoSemi,

  },

  graficoTotal: {

    ...Typography.caption,

    color: '#F06C00',

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

    fontSize: 10,

    fontFamily: Fonte.corpoSemi,

    color: '#E8760A',

    marginBottom: 2,

  },

  graficoBarra: {

    width: '100%',

    borderTopLeftRadius: 6,

    borderTopRightRadius: 6,

    minHeight: 6,

  },

  graficoBarraDia: {

    fontSize: 11,

    fontFamily: Fonte.corpoSemi,

    color: '#5B616B',

  },

  // ============ Receita ============

  receitaCard: {

    borderRadius: 18,

    overflow: 'hidden',

    marginBottom: 10,

    shadowColor: '#2F7A4F',

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

    color: '#FFFFFF',

    fontSize: 44,

    fontFamily: Fonte.tituloBold,

    lineHeight: 48,

  },

  receitaMoeda: {

    color: '#FFFFFF',

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

    color: '#FFFFFF',

    fontSize: 18,

    fontFamily: Fonte.corpoBold,

  },

  receitaCalculoLabel: {

    color: 'rgba(255,255,255,0.85)',

    fontSize: 10,

    fontFamily: Fonte.corpoSemi,

  },

  receitaCalculoSinal: {

    color: '#FFFFFF',

    fontSize: 20,

    fontFamily: Fonte.tituloSemi,

  },

  receitaNota: {

    ...Typography.caption,

    color: '#5B616B',

    fontSize: 10,

    fontStyle: 'italic',

    textAlign: 'center',

  },

  // ============ Validade ============

  validadeCard: {

    backgroundColor: '#F7F6F2',

    borderRadius: 16,

    padding: 16,

    borderWidth: 1,

    borderColor: '#E7E5DF',

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

    color: '#5B616B',

    fontSize: 11,

    marginBottom: 3,

  },

  validadeDataValor: {

    ...Typography.bodyBold,

    color: '#16202E',

    fontFamily: Fonte.corpoSemi,

  },

  validadeBarraContainer: {

    marginBottom: 4,

  },

  validadeBarraTrack: {

    height: 8,

    backgroundColor: '#E7E5DF',

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

    color: '#5B616B',

    fontSize: 11,

    fontFamily: Fonte.corpoSemi,

  },

  validadeAviso: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    backgroundColor: '#FBECE9',

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 10,

  },

  validadeAvisoTexto: {

    color: '#C2412D',

    fontSize: 10,

    fontFamily: Fonte.corpoSemi,

  },

  validadeProlongarBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,

    backgroundColor: '#E8760A',

    paddingVertical: 11,

    borderRadius: 12,

    marginTop: 16,

  },

  validadeProlongarTexto: {

    color: '#FFFFFF',

    fontSize: 13,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Upsell ============

  upsellCard: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    backgroundColor: '#F7F6F2',

    padding: 14,

    borderRadius: 14,

    marginBottom: 10,

    borderWidth: 1,

    borderColor: '#E7E5DF',

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

    color: '#16202E',

    fontFamily: Fonte.corpoSemi,

    marginBottom: 2,

  },

  upsellDescricao: {

    ...Typography.caption,

    color: '#5B616B',

    fontSize: 11,

    lineHeight: 15,

  },

  upsellBadge: {

    backgroundColor: '#FBF0E3',

    paddingHorizontal: 10,

    paddingVertical: 5,

    borderRadius: 10,

  },

  upsellBadgeTexto: {

    color: '#F06C00',

    fontSize: 11,

    fontFamily: Fonte.corpoSemi,

  },

  // ============ Estado vazio ============

  estadoVazioCard: {

    backgroundColor: '#FFFFFF',

    padding: 20,

    borderRadius: 18,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#F2C9C1',

  },

  estadoVazioIcone: {

    width: 72,

    height: 72,

    borderRadius: 20,

    backgroundColor: '#FBECE9',

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 14,

  },

  estadoVazioTitulo: {

    ...Typography.h3,

    color: '#C2412D',

    fontFamily: Fonte.corpoSemi,

    marginBottom: 6,

    textAlign: 'center',

  },

  estadoVazioTexto: {

    ...Typography.body,

    color: '#5B616B',

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

    color: '#FFFFFF',

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

    borderTopColor: '#E7E5DF',

    shadowColor: '#16202E',

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

    backgroundColor: '#F4F3EF',

    borderWidth: 1,

    borderColor: '#E7E5DF',

    gap: 6,

  },

  footerBotaoSecundarioTexto: {

    color: '#16202E',

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

    color: '#FFFFFF',

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

  footerBotaoIcone: {

    width: 46,

    height: 46,

    borderRadius: 14,

    backgroundColor: '#F4F3EF',

    borderWidth: 1,

    borderColor: '#E7E5DF',

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

    backgroundColor: '#FFFFFF',

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    paddingBottom: 24,

    paddingHorizontal: 16,

  },

  modalHandle: {

    width: 40,

    height: 4,

    borderRadius: 2,

    backgroundColor: '#E7E5DF',

    alignSelf: 'center',

    marginTop: 10,

    marginBottom: 12,

  },

  modalTitulo: {

    ...Typography.h3,

    color: '#16202E',

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

    borderBottomColor: '#F4F3EF',

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

    color: '#16202E',

    fontFamily: Fonte.corpoSemi,

    marginBottom: 2,

  },

  modalOpcaoDescricao: {

    ...Typography.caption,

    color: '#5B616B',

    fontSize: 11,

  },

  modalFechar: {

    marginTop: 12,

    paddingVertical: 14,

    borderRadius: 14,

    backgroundColor: '#F4F3EF',

    alignItems: 'center',

  },

  modalFecharTexto: {

    color: '#16202E',

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

    backgroundColor: '#FFFFFF',

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

    color: '#16202E',

    fontFamily: Fonte.corpoSemi,

    textAlign: 'center',

    marginBottom: 10,

  },

  modalCentroTexto: {

    ...Typography.body,

    color: '#5B616B',

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

    backgroundColor: '#F4F3EF',

    alignItems: 'center',

  },

  modalCentroBtnCancelarTexto: {

    color: '#16202E',

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

  modalCentroBtnConfirmar: {

    flex: 1,

    paddingVertical: 14,

    borderRadius: 14,

    backgroundColor: '#E8760A',

    alignItems: 'center',

  },

  modalCentroBtnConfirmarTexto: {

    color: '#FFFFFF',

    fontSize: 14,

    fontFamily: Fonte.corpoSemi,

  },

});