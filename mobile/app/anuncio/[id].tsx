import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import { formatarPrecoCompleto, tempoDesde } from '../../src/data/anuncios-mock';
import { Anuncio } from '../../src/types';
import { anunciosService } from '../../service/anunciosService';
import { useAuthGate } from '../../src/hooks/useAuthGate';
import MapView, { Circle, Marker } from 'react-native-maps';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { useFavoritosStore } from '../../src/store/favoritosStore';
import { useFiltrosStore } from '../../src/store/filtrosStore';
import { datasOcupadasMock, formatarDataCurta, formatarMT, intervaloLivre, noitesEntre, paraISO } from '../../src/utils/reservas';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
const { width } = Dimensions.get('window');

// ============================================================
// CORES GOHOME OFICIAIS (do logo)
// ============================================================
const COR_ACENTO = Colors.azul;
const AZUL_MARCA = Colors.azul;
const AZUL_ESCURO = Colors.azulTexto;

// ============================================================
// HELPERS
// ============================================================
function labelCategoria(categoria: string): string {
  const labels: Record<string, string> = {
    casa: 'Casa', apartamento: 'Apartamento', quarto: 'Quarto', moradia: 'Moradia',
    loja: 'Loja', escritorio: 'Escritório', salao: 'Salão', espaco_comercial: 'Espaço comercial',
    terreno: 'Terreno', lote: 'Lote',
    espaco_eventos: 'Espaço de eventos', espaco_casamento: 'Espaço para casamentos',
    espaco_reuniao: 'Sala de reuniões', espaco_formacao: 'Espaço de formação', estudio: 'Estúdio',
    hotel: 'Hotel', pensao: 'Pensão', hospedagem: 'Hospedagem', quarto_hotel: 'Quarto de hotel',
    carro: 'Carro', mota: 'Mota', carrinha: 'Carrinha', camiao: 'Camião',
    equipamento: 'Equipamento', maquina: 'Máquina', outro: 'Outro',
  };
  return labels[categoria] || categoria;
}

const COMODIDADES_DETALHE: { chave: string; nome: string }[] = [
  { chave: 'wifi', nome: 'Wi‑Fi rápido' }, { chave: 'arCondicionado', nome: 'Ar condicionado' },
  { chave: 'estacionamento', nome: 'Estacionamento' }, { chave: 'mobilado', nome: 'Mobilado' },
  { chave: 'gerador', nome: 'Gerador' }, { chave: 'seguranca', nome: 'Segurança 24 h' },
  { chave: 'piscina', nome: 'Piscina' }, { chave: 'jardim', nome: 'Jardim' },
  { chave: 'agua', nome: 'Água incluída' }, { chave: 'energia', nome: 'Energia incluída' },
  { chave: 'elevador', nome: 'Elevador' }, { chave: 'catering', nome: 'Catering' },
  { chave: 'equipamentoSom', nome: 'Equipamento de som' }, { chave: 'equipamentoProjeccao', nome: 'Projeção' },
];

/** Primeiro bloco de dias ocupados a partir de hoje, ex.: "20–22 Nov". */
function proximaOcupacao(ocupadas: string[]): string | null {
  const hoje = paraISO(new Date());
  const dias = [...ocupadas].filter(d => d >= hoje).sort();
  if (dias.length === 0) return null;
  let fim = dias[0];
  for (let i = 1; i < dias.length; i++) {
    const ant = new Date(fim + 'T00:00:00'); ant.setDate(ant.getDate() + 1);
    if (paraISO(ant) === dias[i]) fim = dias[i]; else break;
  }
  const a = formatarDataCurta(dias[0]); const b = formatarDataCurta(fim);
  if (a === b) return a;
  return a.split(' ')[1] === b.split(' ')[1] ? `${a.split(' ')[0]}–${b}` : `${a} – ${b}`;
}

function labelFinalidade(finalidade: string): string {
  const labels: Record<string, string> = {
    arrendar: 'Para arrendar',
    vender: 'À venda',
    reservar: 'Para reservar',
  };
  return labels[finalidade] || finalidade;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function DetalheAnuncio() {
  const { id, desbloqueado, titulo: tituloParam, categoria: categoriaParam, zona: zonaParam, valorPago: valorPagoParam, origem } = useLocalSearchParams<{
    id: string; desbloqueado?: string; titulo?: string; categoria?: string; zona?: string; valorPago?: string; origem?: string;
  }>();
  const router = useRouter();
  const cores = useCores();
  const { requerConta } = useAuthGate();

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [fotoIndex, setFotoIndex] = useState(0);
  const favoritosIds = useFavoritosStore(st => st.ids);
  const alternarFavorito = useFavoritosStore(st => st.alternar);
  const carregarFavoritos = useFavoritosStore(st => st.carregar);
  useEffect(() => { carregarFavoritos(); }, [carregarFavoritos]);
  const [descricaoAberta, setDescricaoAberta] = useState(false);
  const [comodidadesAbertas, setComodidadesAbertas] = useState(false);
  const filtros = useFiltrosStore(st => st.filtros);
  // TEMPORÁRIO: sem restrição de conta/pagamento. Para reactivar o desbloqueio pago,
  // voltar a `desbloqueado === 'true'`.
  const estaDesbloqueado = true || desbloqueado === 'true';

  useEffect(() => {
    let activo = true;
    const carregar = async () => {
      const idActual = Array.isArray(id) ? id[0] : String(id || '');
      if (!idActual) { if (activo) setAnuncio(null); return; }

      const { dados } = await anunciosService.obter(idActual);
      if (!activo) return;
      if (dados) { setAnuncio(dados); return; }

      // Fallback para links de demonstração que tragam dados nos parâmetros.
      const titulo = Array.isArray(tituloParam) ? tituloParam[0] : tituloParam;
      if ((origem === 'publicacao' || titulo) && titulo) {
        const zona = String(Array.isArray(zonaParam) ? zonaParam[0] : zonaParam || 'Beira');
        const partesZona = zona.split(',');
        const valorPago = Array.isArray(valorPagoParam) ? valorPagoParam[0] : valorPagoParam;
        const categoria = Array.isArray(categoriaParam) ? categoriaParam[0] : categoriaParam;
        const anuncioNovo = {
          id: idActual,
          titulo: String(titulo),
          categoria: String(categoria || 'casa'),
          finalidade: 'arrendar',
          bairro: partesZona[0]?.trim() || 'Beira',
          cidade: partesZona.slice(1).join(',').trim() || 'Beira',
          moradaCompleta: zona,
          descricao: 'Os detalhes completos deste anúncio estarão disponíveis quando forem ligados ao sistema de publicação.',
          fotos: [],
          publicadoEm: new Date().toISOString(),
          caracteristicas: { tipo: 'imovel' },
          anuncianteNome: 'Anunciante GoHome',
          anuncianteVerificado: false,
          anuncianteRating: 0,
          anuncianteAvaliacoes: 0,
          anuncianteTelefone1: '',
          anuncianteTelefone2: '',
          preco: Number(valorPago || 0),
        } as unknown as Anuncio;
        setAnuncio(anuncioNovo);
        return;
      }
      setAnuncio(null);
    };
    void carregar();
    return () => { activo = false; };
  }, [id, tituloParam, categoriaParam, zonaParam, valorPagoParam, origem]);

  if (!anuncio) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: cores.fundo }]}>
        <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi }}>Anúncio não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoSemi }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const favoritado = favoritosIds.includes(anuncio.id);

  const partilharAnuncio = async () => {
    try {
      await Share.share({
        message: `${anuncio.titulo}\n\n${formatarPrecoCompleto(anuncio)}\n${anuncio.bairro}, ${anuncio.cidade}\n\nVê no GoHome: https://gohome.co.mz/anuncio/${anuncio.id}`,
        title: anuncio.titulo,
      });
    } catch (e) {
      console.warn('Erro ao partilhar:', e);
    }
  };

  // ========================================================
  // DESBLOQUEIO — vai para /pagamento com todos os params
  // ========================================================
  const irParaDesbloqueio = () => {
    router.push({
      pathname: '/pagamento',
      params: {
        anuncioId: anuncio.id,
        tipo: 'desbloqueio',
        titulo: anuncio.titulo,
        categoria: labelCategoria(String(anuncio.categoria)),
        bairro: anuncio.bairro || '',
        cidade: anuncio.cidade || 'Beira',
        valorPago: '25',
        valorNormal: '50',
      },
    });
  };

  // ========================================================
  // REPORTAR — vai para /anuncio/reportar com params
  // ========================================================
  const reportarAnuncio = () => {
    router.push({
      pathname: '/anuncio/reportar',
      params: {
        id: anuncio.id,
        titulo: anuncio.titulo,
      },
    });
  };

  const abrirGoogleMaps = async () => {
    const endereco = [anuncio.moradaCompleta, anuncio.bairro, anuncio.cidade, 'Moçambique']
      .map(valor => String(valor || '').trim())
      .filter((valor, indice, lista) => valor && lista.indexOf(valor) === indice)
      .join(', ');
    const temCoordenadas = Number.isFinite(Number(anuncio.latitude)) &&
      Number.isFinite(Number(anuncio.longitude)) &&
      anuncio.latitude !== null && anuncio.latitude !== undefined &&
      anuncio.longitude !== null && anuncio.longitude !== undefined;
    const destino = temCoordenadas
      ? `${Number(anuncio.latitude)},${Number(anuncio.longitude)}`
      : (endereco || `${anuncio.cidade || 'Beira'}, Moçambique`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}&travelmode=driving&dir_action=navigate`;
    try { await Linking.openURL(url); }
    catch { Alert.alert('Google Maps', 'Não foi possível abrir o mapa neste dispositivo. Verifica se tens ligação à Internet.'); }
  };

  const normalizarTelefone = (telefone?: string | null) => {
    const limpo = String(telefone || '').replace(/[^0-9+]/g, '');
    if (!limpo) return '';
    if (limpo.startsWith('+')) return limpo;
    if (limpo.startsWith('258')) return `+${limpo}`;
    return `+258${limpo.replace(/^0+/, '')}`;
  };

  const ligarAnunciante = async () => {
    const telefone = normalizarTelefone(anuncio.anuncianteTelefone1 || anuncio.anuncianteTelefone2);
    if (!telefone) {
      Alert.alert('Contacto indisponível', 'O anunciante ainda não disponibilizou um número de telefone.');
      return;
    }
    try { await Linking.openURL(`tel:${telefone}`); }
    catch { Alert.alert('Telefone', 'Não foi possível iniciar a chamada neste dispositivo.'); }
  };

  const abrirWhatsApp = async () => {
    const telefone = normalizarTelefone(anuncio.anuncianteTelefone2 || anuncio.anuncianteTelefone1).replace('+', '');
    if (!telefone) {
      Alert.alert('WhatsApp indisponível', 'O anunciante ainda não disponibilizou um número para WhatsApp.');
      return;
    }
    const texto = encodeURIComponent(`Olá! Encontrei o anúncio "${anuncio.titulo}" no GoHome e gostaria de obter mais informações.`);
    const url = `https://wa.me/${telefone}?text=${texto}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert('WhatsApp', 'Não foi possível abrir o WhatsApp neste dispositivo.'); }
  };

  const reservarDatas = () => {
    requerConta('generico', () => router.push({ pathname: '/reservar/[id]' as any, params: { id: anuncio.id } }));
  };

  const abrirChat = () => {
    router.push({ pathname: '/chat/[id]' as any, params: { id: anuncio.id, anuncioId: anuncio.id, titulo: anuncio.titulo, anunciante: anuncio.anuncianteNome || 'Anunciante' } });
  };

  // ============ DADOS DERIVADOS (protótipo, página 3) ============
  const c: any = anuncio.caracteristicas || {};
  const fotos = (anuncio.fotos || []).filter(Boolean);
  const eEspaco = c.tipo === 'espaco' || ['salao', 'salao_festas', 'espaco_eventos', 'espaco_casamento'].includes(String(anuncio.categoria));
  const reservavel = anuncio.finalidade !== 'vender';
  const mensal = String(anuncio.periodicidade) === 'mensal';
  const sufixoPreco = mensal ? '/mês' : String(anuncio.periodicidade) === 'horaria' ? '/hora' : anuncio.finalidade === 'vender' ? '' : '/dia';
  const unidade = eEspaco ? 'dia' : 'noite';
  const nNoites = filtros.entrada && filtros.saida ? noitesEntre(filtros.entrada, filtros.saida) : 0;
  const ocupadas = datasOcupadasMock(anuncio.id);
  const livre = nNoites > 0 && intervaloLivre(filtros.entrada!, filtros.saida!, ocupadas);
  const proxOcupada = proximaOcupacao(ocupadas);
  const totalPeriodo = nNoites > 0 ? anuncio.preco * nNoites : 0;
  const hospedesMax = Number(c.hospedes || c.capacidade || 0);
  const estatisticas = [
    { valor: c.quartos, rotulo: 'quartos' },
    { valor: c.casasBanho, rotulo: 'WC' },
    { valor: hospedesMax, rotulo: eEspaco ? 'pessoas' : 'hóspedes' },
    { valor: c.area, rotulo: 'm²' },
  ].filter(i => Number(i.valor) > 0);
  const comodidades = COMODIDADES_DETALHE.filter(i => !!c[i.chave]);
  const descricaoLonga = (anuncio.descricao || '').length > 160;
  const descricaoVisivel = descricaoLonga && !descricaoAberta ? `${anuncio.descricao.slice(0, 160).trim()}… ` : anuncio.descricao;
  const comodidadesVisiveis = comodidadesAbertas ? comodidades : comodidades.slice(0, 6);
  const temCoordenadas = typeof anuncio.latitude === 'number' && typeof anuncio.longitude === 'number';
  const nomeAnunciante = anuncio.anuncianteNome || 'Anunciante';
  const iniciaisAnunciante = nomeAnunciante.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const temTelefone = !!(anuncio.anuncianteTelefone1 || anuncio.anuncianteTelefone2);

  const irReservar = () => {
    requerConta('generico', () => router.push({
      pathname: '/reservar/[id]' as any,
      params: {
        id: anuncio.id,
        ...(nNoites > 0 && livre ? { entrada: filtros.entrada!, saida: filtros.saida! } : {}),
        ...(filtros.pessoas > 1 ? { hospedes: String(filtros.pessoas) } : {}),
      },
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundoElevado }]}>
            <TopBar
        titulo="Detalhes"
        onVoltar={() => router.back()}
        acoes={
          <>
            <TopBarBotao icone="share-outline" rotulo="Partilhar" onPress={partilharAnuncio} />
            <TopBarBotao
              icone={favoritado ? 'heart' : 'heart-outline'}
              rotulo={favoritado ? 'Remover dos salvos' : 'Guardar nos salvos'}
              onPress={() => alternarFavorito(anuncio.id)}
            />
          </>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ============ FOTOS ============ */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => setFotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            scrollEventThrottle={16}
          >
            {fotos.length > 0 ? fotos.map((foto, index) => (
              <Image key={index} source={{ uri: foto }} style={styles.fotoCarousel} />
            )) : (
              <View style={[styles.fotoCarousel, { alignItems: 'center', justifyContent: 'center', backgroundColor: cores.principalClara }]}>
                <Ionicons name="home-outline" size={64} color={cores.textoTerciario} />
                <Text style={{ marginTop: 10, color: cores.textoSecundario, fontFamily: Fonte.corpoSemi }}>Sem fotografias disponíveis</Text>
              </View>
            )}
          </ScrollView>


          {fotos.length > 1 && (
            <>
              <View style={styles.indicadores}>
                {fotos.slice(0, 4).map((_, index) => (
                  <View key={index} style={[styles.indicador, index === Math.min(fotoIndex, 3) && styles.indicadorAtivo]} />
                ))}
              </View>
              <View style={styles.contagemFotos}>
                <Text style={styles.contagemFotosTexto}>{fotoIndex + 1} / {fotos.length}</Text>
              </View>
            </>
          )}
        </View>

        {/* ============ FOLHA DE INFORMAÇÃO ============ */}
        <View style={[styles.folha, { backgroundColor: cores.fundoElevado }]}>
          <View style={styles.badges}>
            {anuncio.anuncianteVerificado && (
              <View style={[styles.badgeCategoria, { backgroundColor: cores.sucesso + '1F' }]}>
                <Text style={[styles.badgeCategoriaTexto, { color: cores.sucesso }]}><Ionicons name="checkmark" size={12} color={cores.sucesso} /> Anúncio verificado</Text>
              </View>
            )}
            <View style={[styles.badgeCategoria, { backgroundColor: cores.principalClara }]}>
              <Text style={[styles.badgeCategoriaTexto, { color: cores.principalTexto }]}>{labelCategoria(String(anuncio.categoria))}</Text>
            </View>
            {reservavel && (
              <View style={[styles.badgeCategoria, { backgroundColor: cores.principalClara }]}>
                <Text style={[styles.badgeCategoriaTexto, { color: cores.principalTexto }]}>{labelFinalidade(anuncio.finalidade)}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.titulo, { color: cores.textoPrincipal }]}>{anuncio.titulo}</Text>
          <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
            {[anuncio.bairro, anuncio.cidade].filter(Boolean).join(', ') || anuncio.zona}
            {!!anuncio.anuncianteAvaliacoes && (
              <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi }}>
                {'  ·  '}<Ionicons name="star" size={13} color={cores.textoPrincipal} />{` ${(anuncio.anuncianteRating ?? 0).toFixed(1)} `}
                <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo }}>({anuncio.anuncianteAvaliacoes} avaliações)</Text>
              </Text>
            )}
          </Text>

          {/* Preço e disponibilidade */}
          <View style={[styles.precoBox, { backgroundColor: cores.principalClara, borderColor: cores.principal }]}>
            <View style={styles.precoLinha}>
              <Text style={[styles.preco, { color: cores.textoPrincipal }]}>
                {formatarMT(anuncio.preco)}
                <Text style={[styles.precoSufixo, { color: cores.textoSecundario }]}> {sufixoPreco}</Text>
              </Text>
              {!mensal && reservavel && anuncio.finalidade !== 'vender' && String(anuncio.periodicidade) !== 'horaria' && (
                <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>
                  ou <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoBold }}>{formatarMT(anuncio.preco * 23)}</Text>/mês
                </Text>
              )}
            </View>
            {reservavel && (
              <>
                <View style={styles.disponibilidade}>
                  <View style={[styles.bolinha, { backgroundColor: nNoites > 0 && !livre ? cores.erro : cores.sucesso }]} />
                  <Text style={[styles.dispTexto, { color: nNoites > 0 && !livre ? cores.erro : cores.sucesso }]}>
                    {nNoites > 0
                      ? (livre
                        ? `Disponível de ${formatarDataCurta(filtros.entrada!)} a ${formatarDataCurta(filtros.saida!)} · total ${formatarMT(totalPeriodo)}`
                        : 'Indisponível nas datas escolhidas')
                      : 'Disponível · escolha as datas'}
                  </Text>
                </View>
                <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13, lineHeight: 18 }}>
                  {proxOcupada ? `Próximas datas ocupadas: ${proxOcupada} · ` : ''}Sem custos escondidos
                </Text>
              </>
            )}
          </View>

          {estatisticas.length > 0 && (
            <View style={styles.estatisticas}>
              {estatisticas.map(e => (
                <View key={e.rotulo} style={[styles.estatistica, { backgroundColor: cores.fundoSuave }]}>
                  <Text style={[styles.estatisticaValor, { color: cores.textoPrincipal }]}>{e.valor}</Text>
                  <Text style={[styles.estatisticaRotulo, { color: cores.textoSecundario }]}>{e.rotulo}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ============ ANFITRIÃO ============ */}
          <View style={[styles.anfitriao, { backgroundColor: cores.fundoSuave }]}>
            <View style={styles.anuncianteBox}>
              <View style={[styles.anuncianteAvatar, { backgroundColor: cores.principalClara }]}>
                <Text style={[styles.anuncianteAvatarLetra, { color: cores.principalTexto }]}>{iniciaisAnunciante}</Text>
                {anuncio.anuncianteVerificado && (
                  <View style={[styles.avatarVerificado, { backgroundColor: cores.sucesso, borderColor: cores.fundoSuave }]}>
                    <Ionicons name="checkmark" size={10} color={Colors.branco} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.anuncianteNome, { color: cores.textoPrincipal }]} numberOfLines={2}>Anfitrião: {nomeAnunciante}</Text>
                <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>
                  {anuncio.anuncianteVerificado ? 'Anunciante verificado' : 'Anunciante GoHome'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.botaoContactar, { backgroundColor: cores.textoPrincipal }]} onPress={abrirChat} accessibilityLabel="Contactar o anunciante">
                <Text style={[styles.botaoContactarTexto, { color: cores.fundo }]}>Contactar</Text>
              </TouchableOpacity>
            </View>
            {!!anuncio.anuncianteAvaliacoes && (
              <View style={[styles.estatistica, styles.estatisticaAnf, { backgroundColor: cores.fundoElevado }]}>
                <Text style={[styles.estatisticaValor, { color: cores.textoPrincipal }]}>{anuncio.anuncianteAvaliacoes}</Text>
                <Text style={[styles.estatisticaRotulo, { color: cores.textoSecundario }]}>avaliações</Text>
              </View>
            )}
            {anuncio.anuncianteVerificado && (
              <Text style={[styles.verificacao, { color: cores.textoPrincipal }]}><Ionicons name="checkmark" size={15} color={cores.sucesso} /> Identidade verificada</Text>
            )}
            {temTelefone && (
              <Text style={[styles.verificacao, { color: cores.textoPrincipal }]}><Ionicons name="checkmark" size={15} color={cores.sucesso} /> Telefone confirmado</Text>
            )}
          </View>

          {/* ============ SOBRE ============ */}
          <Text style={[styles.secaoTitulo, { color: cores.textoPrincipal }]}>Sobre o espaço</Text>
          <Text style={[styles.descricao, { color: cores.textoPrincipal }]}>
            {descricaoVisivel}
            {descricaoLonga && (
              <Text onPress={() => setDescricaoAberta(v => !v)} style={{ color: cores.principalTexto, fontFamily: Fonte.corpoBold }}>
                {descricaoAberta ? ' Ler menos' : 'Ler mais'}
              </Text>
            )}
          </Text>

          {/* ============ COMODIDADES ============ */}
          {comodidades.length > 0 && (
            <>
              <View style={styles.secaoLinha}>
                <Text style={[styles.secaoTitulo, { color: cores.textoPrincipal, marginTop: 0 }]}>Comodidades</Text>
                {comodidades.length > 6 && (
                  <TouchableOpacity onPress={() => setComodidadesAbertas(v => !v)}>
                    <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoBold, fontSize: 14 }}>{comodidadesAbertas ? 'Fechar' : 'Ver todas'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.comodidades}>
                {comodidadesVisiveis.map(i => (
                  <Text key={i.chave} style={[styles.comodidade, { color: cores.textoPrincipal }]}>
                    <Ionicons name="checkmark" size={14} color={cores.textoSecundario} /> {i.nome}
                  </Text>
                ))}
              </View>
            </>
          )}

          {/* ============ DETALHES POR CATEGORIA ============ */}
          <Text style={[styles.secaoTitulo, { color: cores.textoPrincipal }]}>Detalhes</Text>
          <CaracteristicasDetalhadas anuncio={anuncio} cores={cores} />

          {/* ============ LOCALIZAÇÃO ============ */}
          <View style={styles.secaoLinha}>
            <Text style={[styles.secaoTitulo, { color: cores.textoPrincipal, marginTop: 0 }]}>Localização</Text>
            <TouchableOpacity onPress={abrirGoogleMaps} accessibilityLabel="Abrir mapa">
              <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoBold, fontSize: 14 }}>Abrir mapa</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14, marginBottom: 12 }}>
            {estaDesbloqueado ? (anuncio.moradaCompleta || `${anuncio.bairro}, ${anuncio.cidade}`) : `Bairro ${anuncio.bairro}, ${anuncio.cidade}`}
          </Text>
          {temCoordenadas ? (
            <View style={styles.mapa}>
              <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={{ latitude: anuncio.latitude as number, longitude: anuncio.longitude as number, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                toolbarEnabled={false}
                onPress={abrirGoogleMaps}
              >
                <Circle
                  center={{ latitude: anuncio.latitude as number, longitude: anuncio.longitude as number }}
                  radius={350}
                  strokeColor={cores.principal}
                  fillColor="rgba(26, 115, 232,0.15)"
                />
                <Marker coordinate={{ latitude: anuncio.latitude as number, longitude: anuncio.longitude as number }} />
              </MapView>
              <View style={[styles.mapaAviso, { backgroundColor: cores.fundoElevado }]}>
                <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoMedio, fontSize: 13 }}>
                  {estaDesbloqueado ? 'Toque para abrir direções' : 'Localização aproximada · endereço exato após reservar'}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={abrirGoogleMaps} style={[styles.mapa, styles.mapaVazio, { backgroundColor: cores.fundoSuave }]}>
              <Ionicons name="navigate-outline" size={26} color={cores.textoSecundario} />
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpoMedio, marginTop: 6 }}>Ver rota no Google Maps</Text>
            </TouchableOpacity>
          )}

          {/* ============ CONTACTO ============ */}
          {estaDesbloqueado ? (
            <>
              <Text style={[styles.secaoTitulo, { color: cores.textoPrincipal }]}>Contacto</Text>
              <View style={styles.contactosLista}>
                <TouchableOpacity style={[styles.contactoItem, { backgroundColor: cores.fundoSuave }]} onPress={ligarAnunciante} activeOpacity={0.8}>
                  <Ionicons name="call" size={20} color={cores.principal} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactoLabel, { color: cores.textoSecundario }]}>Telefone 1</Text>
                    <Text style={[styles.contactoValor, { color: cores.textoPrincipal }]}>+258 {anuncio.anuncianteTelefone1 || '— — —'}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={24} color={cores.principal} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.contactoItem, { backgroundColor: cores.fundoSuave }]} onPress={abrirWhatsApp} activeOpacity={0.8}>
                  <Icone name="whatsapp" size={22} color={Colors.verdeTexto} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactoLabel, { color: cores.textoSecundario }]}>WhatsApp</Text>
                    <Text style={[styles.contactoValor, { color: cores.textoPrincipal }]}>+258 {anuncio.anuncianteTelefone2 || '— — —'}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={24} color={Colors.verdeTexto} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.botaoReportar, { borderColor: cores.bordaSubtil }]} onPress={reportarAnuncio} activeOpacity={0.7}>
                <Ionicons name="flag-outline" size={16} color={Colors.erro} />
                <Text style={[styles.botaoReportarTexto, { color: Colors.erro }]}>Reportar algo errado</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.bloqueadoBox}>
                <View style={[styles.bloqueadoIcone, { backgroundColor: cores.principalClara }]}>
                  <Ionicons name="lock-closed" size={28} color={cores.principal} />
                </View>
                <Text style={[styles.bloqueadoTitulo, { color: cores.textoPrincipal }]}>Contactos protegidos</Text>
                <Text style={[styles.bloqueadoTexto, { color: cores.textoSecundario }]}>
                  Desbloqueia para ver telefone, WhatsApp e localização exacta do anunciante
                </Text>
              </View>
              <TouchableOpacity style={[styles.botaoReportarSubtil, { borderColor: cores.bordaSubtil }]} onPress={reportarAnuncio} activeOpacity={0.7}>
                <Ionicons name="flag-outline" size={14} color={cores.textoSecundario} />
                <Text style={[styles.botaoReportarSubtilTexto, { color: cores.textoSecundario }]}>Reportar este anúncio</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* ============ RODAPÉ FIXO ============ */}
      {!estaDesbloqueado ? (
        <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}>
          <View style={styles.footerPreco}>
            <Text style={[styles.footerPrecoLabel, { color: cores.textoSecundario }]}>Desbloquear</Text>
            <View style={styles.footerPrecoValores}>
              <Text style={[styles.footerPrecoRiscado, { color: cores.textoTerciario }]}>50 MT</Text>
              <Text style={[styles.footerPreco25, { color: cores.principalTexto }]}>25 MT</Text>
            </View>
            <Text style={[styles.footerPromo, { color: COR_ACENTO }]}>Promoção -50%</Text>
          </View>
          <TouchableOpacity style={styles.footerBotao} onPress={irParaDesbloqueio} activeOpacity={0.85}>
            <LinearGradient colors={cores.gradiente} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Ionicons name="lock-open" size={18} color={Colors.branco} />
            <Text style={styles.footerBotaoTexto}>Desbloquear agora</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : reservavel ? (
        <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.footerTotal, { color: cores.textoPrincipal }]}>
              {nNoites > 0 && livre ? formatarMT(totalPeriodo) : formatarMT(anuncio.preco)}
              <Text style={{ fontFamily: Fonte.corpo, fontSize: 13, color: cores.textoSecundario }}>{nNoites > 0 && livre ? ' total' : ` ${sufixoPreco}`}</Text>
            </Text>
            <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoSemi, fontSize: 13, textDecorationLine: 'underline' }} onPress={irReservar}>
              {nNoites > 0 && livre
                ? `${formatarDataCurta(filtros.entrada!)}–${formatarDataCurta(filtros.saida!)} · ${nNoites} ${nNoites === 1 ? unidade : unidade + 's'}`
                : 'Escolher datas'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.footerReservar, { backgroundColor: cores.principal }]} onPress={irReservar} activeOpacity={0.85} accessibilityLabel="Reservar">
            <Text style={styles.footerBotaoTexto}>Reservar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}>
          <TouchableOpacity style={[styles.footerReservar, { backgroundColor: cores.principal, flex: 1 }]} onPress={abrirChat} activeOpacity={0.85}>
            <Text style={styles.footerBotaoTexto}>Contactar o anunciante</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

// ========================================================
// COMPONENTE: Características detalhadas por categoria
// ========================================================
function CaracteristicasDetalhadas({ anuncio, cores }: { anuncio: Anuncio; cores: any }) {
  // Fallback para {} se caracteristicas for undefined
  const c: any = anuncio.caracteristicas || {};

  const itens: Array<{ icone: any; label: string; valor: string }> = [];

  if (c.tipo === 'imovel') {
    if (c.quartos !== undefined && c.quartos > 0) itens.push({ icone: 'bed-outline', label: 'Quartos', valor: String(c.quartos) });
    if (c.casasBanho !== undefined && c.casasBanho > 0) itens.push({ icone: 'shower', label: 'Casas de banho', valor: String(c.casasBanho) });
    if (c.area !== undefined && c.area > 0) itens.push({ icone: 'ruler-square', label: 'Área', valor: `${c.area}m²` });
    if (c.mobilado) itens.push({ icone: 'sofa-outline', label: 'Mobilado', valor: 'Sim' });
    if (c.agua) itens.push({ icone: 'water', label: 'Água', valor: 'Sim' });
    if (c.energia) itens.push({ icone: 'lightning-bolt', label: 'Energia', valor: 'Sim' });
    if (c.wifi) itens.push({ icone: 'wifi', label: 'Wi-Fi', valor: 'Sim' });
    if (c.estacionamento) itens.push({ icone: 'car', label: 'Estacionamento', valor: 'Sim' });
    if (c.piscina) itens.push({ icone: 'pool', label: 'Piscina', valor: 'Sim' });
    if (c.jardim) itens.push({ icone: 'tree-outline', label: 'Jardim', valor: 'Sim' });
    if (c.elevador) itens.push({ icone: 'elevator', label: 'Elevador', valor: 'Sim' });
    if (c.seguranca) itens.push({ icone: 'shield-check', label: 'Segurança', valor: 'Sim' });
    if (c.arCondicionado) itens.push({ icone: 'air-conditioner', label: 'Ar condicionado', valor: 'Sim' });
  }

  if (c.tipo === 'veiculo') {
    itens.push({ icone: 'tag', label: 'Marca', valor: c.marca });
    itens.push({ icone: 'car-info', label: 'Modelo', valor: c.modelo });
    itens.push({ icone: 'calendar', label: 'Ano', valor: String(c.ano) });
    if (c.kilometragem !== undefined) itens.push({ icone: 'speedometer', label: 'KM', valor: `${c.kilometragem.toLocaleString('pt-PT')} km` });
    if (c.combustivel) itens.push({ icone: 'fuel', label: 'Combustível', valor: c.combustivel });
    if (c.transmissao) itens.push({ icone: 'car-cog', label: 'Transmissão', valor: c.transmissao });
    if (c.cor) itens.push({ icone: 'palette', label: 'Cor', valor: c.cor });
    if (c.condicao) itens.push({ icone: 'check-circle', label: 'Condição', valor: c.condicao });
    if (c.documentos) itens.push({ icone: 'file-document', label: 'Documentos', valor: 'Em dia' });
    if (c.arCondicionado) itens.push({ icone: 'air-conditioner', label: 'Ar condicionado', valor: 'Sim' });
  }

  if (c.tipo === 'espaco') {
    itens.push({ icone: 'account-group', label: 'Capacidade', valor: `${c.capacidade} pessoas` });
    if (c.area !== undefined) itens.push({ icone: 'ruler-square', label: 'Área', valor: `${c.area}m²` });
    if (c.wifi) itens.push({ icone: 'wifi', label: 'Wi-Fi', valor: 'Sim' });
    if (c.arCondicionado) itens.push({ icone: 'air-conditioner', label: 'Ar condicionado', valor: 'Sim' });
    if (c.estacionamento) itens.push({ icone: 'parking', label: 'Estacionamento', valor: 'Sim' });
    if (c.catering) itens.push({ icone: 'silverware-fork-knife', label: 'Catering', valor: 'Sim' });
    if (c.equipamentoSom) itens.push({ icone: 'speaker', label: 'Som', valor: 'Sim' });
    if (c.equipamentoProjeccao) itens.push({ icone: 'projector', label: 'Projecção', valor: 'Sim' });
  }

  if (c.tipo === 'alojamento') {
    if (c.tiposQuarto) itens.push({ icone: 'bed', label: 'Tipos de quarto', valor: c.tiposQuarto.join(', ') });
    if (c.wifi) itens.push({ icone: 'wifi', label: 'Wi-Fi', valor: 'Sim' });
    if (c.arCondicionado) itens.push({ icone: 'air-conditioner', label: 'Ar condicionado', valor: 'Sim' });
    if (c.estacionamento) itens.push({ icone: 'parking', label: 'Estacionamento', valor: 'Sim' });
    if (c.piscina) itens.push({ icone: 'pool', label: 'Piscina', valor: 'Sim' });
    if (c.restaurante) itens.push({ icone: 'silverware-fork-knife', label: 'Restaurante', valor: 'Sim' });
    if (c.pequenoAlmoco) itens.push({ icone: 'coffee', label: 'Pequeno-almoço', valor: 'Incluído' });
  }

  if (c.tipo === 'equipamento') {
    if (c.marca) itens.push({ icone: 'tag', label: 'Marca', valor: c.marca });
    if (c.modelo) itens.push({ icone: 'cog', label: 'Modelo', valor: c.modelo });
    if (c.ano) itens.push({ icone: 'calendar', label: 'Ano', valor: String(c.ano) });
    if (c.condicao) itens.push({ icone: 'check-circle', label: 'Condição', valor: c.condicao });
    if (c.horasUso !== undefined) itens.push({ icone: 'timer', label: 'Horas de uso', valor: `${c.horasUso}h` });
    if (c.garantia) itens.push({ icone: 'shield-check', label: 'Garantia', valor: 'Sim' });
  }

  return (
    <View style={styles.caracteristicasGrid}>
      {itens.map((item, i) => (
        <View key={i} style={[styles.caracteristicaItem, { backgroundColor: cores.fundoSuave }]}>
          <Icone name={item.icone} size={18} color={cores.principal} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.caracteristicaLabel, { color: cores.textoSecundario }]}>{item.label}</Text>
            <Text style={[styles.caracteristicaValor, { color: cores.textoPrincipal }]} numberOfLines={1}>{item.valor}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ========================================================
// STYLES
// ========================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  carouselContainer: { height: 320, position: 'relative' },
  fotoCarousel: { width, height: 320, backgroundColor: Colors.borda },
  indicadores: { position: 'absolute', bottom: 42, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  indicador: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.7)' },
  indicadorAtivo: { width: 22, backgroundColor: Colors.branco },
  contagemFotos: { position: 'absolute', bottom: 40, right: 16, backgroundColor: 'rgba(32, 33, 36,0.62)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
  contagemFotosTexto: { color: Colors.branco, fontSize: 12, fontFamily: Fonte.corpoSemi },

  folha: { marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 20 },
  subtitulo: { fontFamily: Fonte.corpo, fontSize: 15, marginBottom: 16 },
  precoBox: { borderWidth: 1.5, borderRadius: 20, padding: 16, gap: 8 },
  precoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  preco: { fontFamily: Fonte.tituloBold, fontSize: 24, letterSpacing: -0.4 },
  precoSufixo: { fontFamily: Fonte.corpo, fontSize: 15 },
  disponibilidade: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bolinha: { width: 9, height: 9, borderRadius: 5 },
  dispTexto: { flex: 1, fontFamily: Fonte.corpoSemi, fontSize: 14 },
  estatisticas: { flexDirection: 'row', gap: 10, marginTop: 16 },
  estatistica: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16 },
  estatisticaAnf: { flex: 0, marginTop: 14, paddingHorizontal: 20, alignSelf: 'flex-start' },
  estatisticaValor: { fontFamily: Fonte.tituloBold, fontSize: 20 },
  estatisticaRotulo: { fontFamily: Fonte.corpo, fontSize: 13 },
  anfitriao: { borderRadius: 22, padding: 16, marginTop: 16 },
  avatarVerificado: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  botaoContactar: { paddingHorizontal: 18, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  botaoContactarTexto: { fontFamily: Fonte.corpoBold, fontSize: 14 },
  verificacao: { fontFamily: Fonte.corpo, fontSize: 15, marginTop: 10 },
  secaoTitulo: { fontFamily: Fonte.tituloBold, fontSize: 20, letterSpacing: -0.3, marginTop: 28, marginBottom: 10 },
  secaoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 6 },
  comodidades: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  comodidade: { width: '50%', fontFamily: Fonte.corpo, fontSize: 15 },
  mapa: { height: 190, borderRadius: 20, overflow: 'hidden' },
  mapaVazio: { alignItems: 'center', justifyContent: 'center' },
  mapaAviso: { position: 'absolute', bottom: 10, left: 10, right: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  footerTotal: { fontFamily: Fonte.tituloBold, fontSize: 20 },
  footerReservar: { paddingHorizontal: 34, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  badges: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  badgeCategoria: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm },
  badgeCategoriaTexto: { ...Typography.captionBold, fontSize: 12 },
  badgeFinalidade: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm },
  badgeFinalidadeTexto: { ...Typography.captionBold, fontSize: 12 },

  titulo: { fontFamily: Fonte.tituloBold, fontSize: 28, letterSpacing: -0.4, lineHeight: 32, marginBottom: 6 },
  localizacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  localizacaoTexto: { ...Typography.body, flex: 1 },

  caracteristicasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  caracteristicaItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, paddingHorizontal: 12, borderRadius: Radius.md, gap: 10, width: (width - Spacing.lg * 2 - Spacing.sm) / 2 },
  caracteristicaLabel: { ...Typography.caption, fontSize: 12 },
  caracteristicaValor: { ...Typography.bodyBold, fontSize: 13 },

  descricao: { ...Typography.body, lineHeight: 22 },

  anuncianteBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  anuncianteAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  anuncianteAvatarLetra: { ...Typography.h2, color: Colors.branco, fontFamily: Fonte.tituloSemi },
  anuncianteNomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  anuncianteNome: { ...Typography.bodyBold, fontSize: 15 },
  verificadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verificadoText: { ...Typography.caption, fontSize: 12, fontFamily: Fonte.corpoSemi },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingTexto: { ...Typography.bodyBold, fontSize: 13 },
  avaliacoesTexto: { ...Typography.caption },

  contactoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  contactoIcone: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  contactoTitulo: { ...Typography.h3 },
  contactosLista: { gap: Spacing.sm },
  contactoItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg, gap: 12 },
  contactoLabel: { ...Typography.caption, marginBottom: 2 },
  contactoValor: { ...Typography.bodyBold, fontSize: 15 },

  botaoReportar: {
    marginTop: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    borderWidth: 1, gap: 6,
    backgroundColor: 'rgba(179, 38, 30, 0.04)',
  },
  botaoReportarTexto: { ...Typography.bodyBold, fontSize: 13 },

  botaoReportarSubtil: {
    marginTop: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderRadius: Radius.md,
    borderWidth: 1, gap: 5,
  },
  botaoReportarSubtilTexto: { ...Typography.caption, fontSize: 12 },

  bloqueadoBox: { alignItems: 'center', paddingVertical: Spacing.lg },
  bloqueadoIcone: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  bloqueadoTitulo: { ...Typography.h3, marginBottom: 6 },
  bloqueadoTexto: { ...Typography.body, textAlign: 'center', maxWidth: '85%' },

  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderTopWidth: 1, gap: Spacing.md },
  footerPreco: { flex: 1 },
  footerPrecoLabel: { ...Typography.caption, marginBottom: 2 },
  footerPrecoValores: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  footerPrecoRiscado: { ...Typography.body, fontSize: 12, textDecorationLine: 'line-through' },
  footerPreco25: { ...Typography.h2, fontFamily: Fonte.tituloSemi },
  footerPromo: { ...Typography.caption, fontSize: 12, fontFamily: Fonte.corpoSemi },
  footerBotao: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: Radius.full, overflow: 'hidden' },
  footerBotaoTexto: { ...Typography.button, color: Colors.branco, fontSize: 15 },

  acaoPrincipal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.sm },
  acaoPrincipalTitulo: { color: Colors.branco, fontFamily: Fonte.corpoSemi, fontSize: 14, marginBottom: 3 },
  acaoPrincipalSubtitulo: { color: 'rgba(255,255,255,0.82)', fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 15 },
  acaoSecundaria: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: Radius.lg, borderWidth: 1 },
  acaoChatIcone: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(26, 115, 232, 0.1)', alignItems: 'center', justifyContent: 'center' },
  acaoChatTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, marginBottom: 3 },
  acaoChatSubtitulo: { fontFamily: Fonte.corpo, fontSize: 12 },
  avisoDemo: { fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 15, marginTop: Spacing.sm },
});