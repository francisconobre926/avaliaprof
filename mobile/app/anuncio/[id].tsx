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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useCores } from '../../src/store/themeStore';
import { ANUNCIOS_MOCK, formatarPrecoCompleto, tempoDesde } from '../../src/data/anuncios-mock';
import { Anuncio } from '../../src/types';
import { obterAnuncioLocal } from '../../src/store/anunciosLocal';

const { width } = Dimensions.get('window');

// ============================================================
// CORES GOHOME OFICIAIS (do logo)
// ============================================================
const LARANJA_MARCA = '#FE8A00';
const AZUL_MARCA = '#0082DE';
const AZUL_ESCURO = '#0061A6';

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

  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [fotoIndex, setFotoIndex] = useState(0);
  const [favoritado, setFavoritado] = useState(false);
  const estaDesbloqueado = desbloqueado === 'true';

  useEffect(() => {
    let activo = true;
    const carregar = async () => {
      const idActual = Array.isArray(id) ? id[0] : String(id || '');
      if (!idActual) { if (activo) setAnuncio(null); return; }

      const local = await obterAnuncioLocal(idActual);
      if (!activo) return;
      if (local) {
        setAnuncio(local as unknown as Anuncio);
        return;
      }

      const encontrado = ANUNCIOS_MOCK.find(a => a.id === idActual);
      if (encontrado) { setAnuncio(encontrado); return; }

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
        <Text style={{ color: cores.textoPrincipal }}>Anúncio não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: cores.principal }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  const abrirChat = () => {
    router.push({ pathname: '/chat/[id]' as any, params: { id: anuncio.id, anuncioId: anuncio.id, titulo: anuncio.titulo, anunciante: anuncio.anuncianteNome || 'Anunciante' } });
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ============ CARROUSEL DE FOTOS ============ */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setFotoIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {anuncio.fotos.length > 0 ? anuncio.fotos.map((foto, index) => (
              <Image key={index} source={{ uri: foto }} style={styles.fotoCarousel} />
            )) : (
              <View style={[styles.fotoCarousel, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EEF5' }]}>
                <Ionicons name="home-outline" size={64} color="#8A9AAF" />
                <Text style={{ marginTop: 10, color: '#64748B', fontWeight: '600' }}>Sem fotografias disponíveis</Text>
              </View>
            )}
          </ScrollView>

          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.gradienteTopo}
          />

          {/* Header controls */}
          <SafeAreaView edges={['top']} style={styles.headerControls}>
            <TouchableOpacity
              style={styles.botaoCircular}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerDireita}>
              <TouchableOpacity style={styles.botaoCircular} onPress={partilharAnuncio}>
                <Ionicons name="share-social" size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botaoCircular}
                onPress={() => setFavoritado(!favoritado)}
              >
                <Ionicons
                  name={favoritado ? 'heart' : 'heart-outline'}
                  size={20}
                  color={favoritado ? Colors.erro : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Indicadores de página */}
          <View style={styles.indicadores}>
            {anuncio.fotos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicador,
                  { backgroundColor: index === fotoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)' },
                ]}
              />
            ))}
          </View>

          {/* Contagem fotos */}
          <View style={styles.contagemFotos}>
            <Ionicons name="images" size={12} color="#FFFFFF" />
            <Text style={styles.contagemFotosTexto}>
              {fotoIndex + 1}/{anuncio.fotos.length}
            </Text>
          </View>
        </View>

        {/* ============ INFO PRINCIPAL ============ */}
        <View style={[styles.secçao, { backgroundColor: cores.fundoElevado }]}>
          {/* Badges */}
          <View style={styles.badges}>
            <View style={[styles.badgeCategoria, { backgroundColor: cores.principalClara }]}>
              <Text style={[styles.badgeCategoriaTexto, { color: cores.principal }]}>
                {labelCategoria(anuncio.categoria)}
              </Text>
            </View>
            <View style={[styles.badgeFinalidade, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <Text style={[styles.badgeFinalidadeTexto, { color: Colors.verde }]}>
                {labelFinalidade(anuncio.finalidade)}
              </Text>
            </View>
          </View>

          {/* Título */}
          <Text style={[styles.titulo, { color: cores.textoPrincipal }]}>
            {anuncio.titulo}
          </Text>

          {/* Localização */}
          <View style={styles.localizacaoRow}>
            <Ionicons name="location" size={16} color={cores.principal} />
            <Text style={[styles.localizacaoTexto, { color: cores.textoSecundario }]}>
              {estaDesbloqueado ? (anuncio.moradaCompleta || `${anuncio.bairro}, ${anuncio.cidade}`) : `${anuncio.bairro}, ${anuncio.cidade}`}
            </Text>
          </View>

          {/* Preço */}
          <View style={[styles.precoBox, { backgroundColor: cores.fundoSuave }]}>
            <View>
              <Text style={[styles.precoLabel, { color: cores.textoSecundario }]}>Preço</Text>
              <Text style={[styles.preco, { color: cores.principal }]}>
                {formatarPrecoCompleto(anuncio)}
              </Text>
            </View>
            <View style={styles.tempoBox}>
              <Ionicons name="time-outline" size={14} color={cores.textoTerciario} />
              <Text style={[styles.tempoTexto, { color: cores.textoTerciario }]}>
                {tempoDesde(anuncio.publicadoEm || anuncio.dataCriacao || '')}
              </Text>
            </View>
          </View>
        </View>

        {/* ============ CARACTERÍSTICAS ============ */}
        <View style={[styles.secçao, { backgroundColor: cores.fundoElevado, marginTop: Spacing.sm }]}>
          <Text style={[styles.secçaoTitulo, { color: cores.textoPrincipal }]}>
            Características
          </Text>
          <CaracteristicasDetalhadas anuncio={anuncio} cores={cores} />
        </View>

        {/* ============ DESCRIÇÃO ============ */}
        <View style={[styles.secçao, { backgroundColor: cores.fundoElevado, marginTop: Spacing.sm }]}>
          <Text style={[styles.secçaoTitulo, { color: cores.textoPrincipal }]}>Descrição</Text>
          <Text style={[styles.descricao, { color: cores.textoSecundario }]}>
            {anuncio.descricao}
          </Text>
        </View>

        {/* ============ ANUNCIANTE ============ */}
        <View style={[styles.secçao, { backgroundColor: cores.fundoElevado, marginTop: Spacing.sm }]}>
          <Text style={[styles.secçaoTitulo, { color: cores.textoPrincipal }]}>Anunciante</Text>
          <View style={styles.anuncianteBox}>
            <View style={[styles.anuncianteAvatar, { backgroundColor: cores.principal }]}>
              <Text style={styles.anuncianteAvatarLetra}>
                {(anuncio.anuncianteNome || 'A').charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.anuncianteNomeRow}>
                <Text style={[styles.anuncianteNome, { color: cores.textoPrincipal }]}>
                  {anuncio.anuncianteNome || 'Anunciante'}
                </Text>
                {anuncio.anuncianteVerificado && (
                  <View style={styles.verificadoBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.verde} />
                    <Text style={[styles.verificadoText, { color: Colors.verde }]}>Verificado</Text>
                  </View>
                )}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={Colors.premium} />
                <Text style={[styles.ratingTexto, { color: cores.textoPrincipal }]}>
                  {(anuncio.anuncianteRating ?? 0).toFixed(1)}
                </Text>
                <Text style={[styles.avaliacoesTexto, { color: cores.textoSecundario }]}>
                  ({anuncio.anuncianteAvaliacoes ?? 0} avaliações)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ============ ACÇÕES: GPS E CHAT ============ */}
        <View style={[styles.secçao, { backgroundColor: cores.fundoElevado, marginTop: Spacing.sm }]}>
          <Text style={[styles.secçaoTitulo, { color: cores.textoPrincipal }]}>Próximos passos</Text>
          <TouchableOpacity style={styles.acaoPrincipal} onPress={abrirGoogleMaps} activeOpacity={0.85}>
            <LinearGradient colors={[AZUL_ESCURO, AZUL_MARCA]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.acaoPrincipalTitulo}>Ver rota no Google Maps</Text>
              <Text style={styles.acaoPrincipalSubtitulo}>Abrir direcções para {anuncio.bairro}, {anuncio.cidade}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.acaoSecundaria, { borderColor: cores.bordaSubtil }]} onPress={abrirChat} activeOpacity={0.85}>
            <View style={styles.acaoChatIcone}><Ionicons name="chatbubbles" size={21} color={LARANJA_MARCA} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.acaoChatTitulo, { color: cores.textoPrincipal }]}>Conversar com o anunciante</Text>
              <Text style={[styles.acaoChatSubtitulo, { color: cores.textoSecundario }]}>Abrir chat deste anúncio</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={cores.textoSecundario} />
          </TouchableOpacity>
          <Text style={[styles.avisoDemo, { color: cores.textoTerciario }]}>A navegação abre no Google Maps para acompanhar a localização e o percurso. O chat interno depende da integração de mensagens entre utilizadores.</Text>
        </View>

        {/* ============ CONTACTO (bloqueado ou desbloqueado) ============ */}
        {estaDesbloqueado ? (
          <View style={[styles.secçao, { backgroundColor: cores.fundoElevado, marginTop: Spacing.sm }]}>
            <View style={styles.contactoHeader}>
              <View style={[styles.contactoIcone, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.verde} />
              </View>
              <Text style={[styles.contactoTitulo, { color: cores.textoPrincipal }]}>
                Contacto desbloqueado
              </Text>
            </View>

            <View style={styles.contactosLista}>
              <TouchableOpacity style={[styles.contactoItem, { backgroundColor: cores.fundoSuave }]} onPress={ligarAnunciante} activeOpacity={0.8}>
                <Ionicons name="call" size={20} color={cores.principal} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactoLabel, { color: cores.textoSecundario }]}>Telefone 1</Text>
                  <Text style={[styles.contactoValor, { color: cores.textoPrincipal }]}>
                    +258 {anuncio.anuncianteTelefone1 || '— — —'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={cores.principal} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.contactoItem, { backgroundColor: cores.fundoSuave }]} onPress={abrirWhatsApp} activeOpacity={0.8}>
                <MaterialCommunityIcons name="whatsapp" size={22} color={Colors.verde} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactoLabel, { color: cores.textoSecundario }]}>WhatsApp</Text>
                  <Text style={[styles.contactoValor, { color: cores.textoPrincipal }]}>
                    +258 {anuncio.anuncianteTelefone2 || '— — —'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={Colors.verde} />
              </TouchableOpacity>
            </View>

            {/* Botão "Reportar algo errado" (link para /anuncio/reportar) */}
            <TouchableOpacity
              style={[styles.botaoReportar, { borderColor: cores.bordaSubtil }]}
              onPress={reportarAnuncio}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={16} color={Colors.erro} />
              <Text style={[styles.botaoReportarTexto, { color: Colors.erro }]}>
                Reportar algo errado
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.secçao, { backgroundColor: cores.fundoElevado, marginTop: Spacing.sm }]}>
            <View style={styles.bloqueadoBox}>
              <View style={[styles.bloqueadoIcone, { backgroundColor: cores.principalClara }]}>
                <Ionicons name="lock-closed" size={28} color={cores.principal} />
              </View>
              <Text style={[styles.bloqueadoTitulo, { color: cores.textoPrincipal }]}>
                Contactos protegidos
              </Text>
              <Text style={[styles.bloqueadoTexto, { color: cores.textoSecundario }]}>
                Desbloqueia para ver telefone, WhatsApp e localização exacta do anunciante
              </Text>
            </View>

            {/* Botão de reportar também disponível antes de desbloquear */}
            <TouchableOpacity
              style={[styles.botaoReportarSubtil, { borderColor: cores.bordaSubtil }]}
              onPress={reportarAnuncio}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={14} color={cores.textoSecundario} />
              <Text style={[styles.botaoReportarSubtilTexto, { color: cores.textoSecundario }]}>
                Reportar este anúncio
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ============ FOOTER FIXO: BOTÃO DESBLOQUEAR ============ */}
      {!estaDesbloqueado && (
        <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}>
          <View style={styles.footerPreco}>
            <Text style={[styles.footerPrecoLabel, { color: cores.textoSecundario }]}>Desbloquear</Text>
            <View style={styles.footerPrecoValores}>
              <Text style={[styles.footerPrecoRiscado, { color: cores.textoTerciario }]}>50 MT</Text>
              <Text style={[styles.footerPreco25, { color: cores.principal }]}>25 MT</Text>
            </View>
            <Text style={[styles.footerPromo, { color: LARANJA_MARCA }]}>Promoção -50%</Text>
          </View>

          <TouchableOpacity
            style={styles.footerBotao}
            onPress={irParaDesbloqueio}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={cores.gradiente}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="lock-open" size={18} color="#FFFFFF" />
            <Text style={styles.footerBotaoTexto}>Desbloquear agora</Text>
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
          <MaterialCommunityIcons name={item.icone} size={18} color={cores.principal} />
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

  carouselContainer: { height: 300, position: 'relative' },
  fotoCarousel: { width, height: 300, backgroundColor: '#E0E0E0' },
  gradienteTopo: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  headerControls: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  headerDireita: { flexDirection: 'row', gap: Spacing.sm },
  botaoCircular: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  indicadores: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  indicador: { width: 8, height: 8, borderRadius: 4 },
  contagemFotos: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, gap: 4 },
  contagemFotosTexto: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  secçao: { padding: Spacing.lg },
  secçaoTitulo: { ...Typography.h3, marginBottom: Spacing.md },

  badges: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  badgeCategoria: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm },
  badgeCategoriaTexto: { ...Typography.captionBold, fontSize: 11 },
  badgeFinalidade: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm },
  badgeFinalidadeTexto: { ...Typography.captionBold, fontSize: 11 },

  titulo: { ...Typography.h2, marginBottom: Spacing.sm, lineHeight: 28 },
  localizacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  localizacaoTexto: { ...Typography.body, flex: 1 },

  precoBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.lg },
  precoLabel: { ...Typography.caption, marginBottom: 2 },
  preco: { ...Typography.precoGrande },
  tempoBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tempoTexto: { ...Typography.caption },

  caracteristicasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  caracteristicaItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, paddingHorizontal: 12, borderRadius: Radius.md, gap: 10, width: (width - Spacing.lg * 2 - Spacing.sm) / 2 },
  caracteristicaLabel: { ...Typography.caption, fontSize: 10 },
  caracteristicaValor: { ...Typography.bodyBold, fontSize: 13 },

  descricao: { ...Typography.body, lineHeight: 22 },

  anuncianteBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  anuncianteAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  anuncianteAvatarLetra: { ...Typography.h2, color: '#FFFFFF', fontWeight: '800' },
  anuncianteNomeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  anuncianteNome: { ...Typography.bodyBold, fontSize: 15 },
  verificadoBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  verificadoText: { ...Typography.caption, fontSize: 10, fontWeight: '700' },
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
    backgroundColor: 'rgba(244, 67, 54, 0.04)',
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
  footerPreco25: { ...Typography.h2, fontWeight: '800' },
  footerPromo: { ...Typography.caption, fontSize: 10, fontWeight: '700' },
  footerBotao: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: Radius.full, overflow: 'hidden' },
  footerBotaoTexto: { ...Typography.button, color: '#FFFFFF', fontSize: 15 },

  acaoPrincipal: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.sm },
  acaoPrincipalTitulo: { color: '#FFFFFF', fontWeight: '800', fontSize: 14, marginBottom: 3 },
  acaoPrincipalSubtitulo: { color: 'rgba(255,255,255,0.82)', fontSize: 11, lineHeight: 15 },
  acaoSecundaria: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: Radius.lg, borderWidth: 1 },
  acaoChatIcone: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(254, 138, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  acaoChatTitulo: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  acaoChatSubtitulo: { fontSize: 11 },
  avisoDemo: { fontSize: 10, lineHeight: 15, marginTop: Spacing.sm },
});