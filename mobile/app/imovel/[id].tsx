import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Linking,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { IMOVEIS_MOCK, formatarPreco, tempoDesdeMock } from '../../src/data/imoveis-mock';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
const { width, height } = Dimensions.get('window');

export default function DetalheImovel() {
  const { id, desbloqueado } = useLocalSearchParams<{ id: string; desbloqueado?: string }>();
  const router = useRouter();
  const [fotoAtual, setFotoAtual] = useState(0);
  const [favoritado, setFavoritado] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const imovel = IMOVEIS_MOCK.find(i => i.id === id);
  const foiDesbloqueado = desbloqueado === 'true';

  if (!imovel) {
    return (
      <View style={styles.container}>
        <Text>Imóvel não encontrado</Text>
      </View>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200, 300],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const abrirWhatsApp = () => {
    const numero = imovel.anuncianteTelefone1.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${numero}?text=Olá, vi o seu anúncio "${imovel.titulo}" no GoHome.`);
  };

  const ligar = () => {
    Linking.openURL(`tel:${imovel.anuncianteTelefone1}`);
  };

  const descricaoParcial = imovel.descricao.substring(0, 150) + '...';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header sticky que aparece ao scrollar */}
      <Animated.View style={[styles.headerFixo, { opacity: headerOpacity }]}>
        <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={styles.headerFixoContent}>
          <TouchableOpacity style={styles.botaoHeader} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textoPrincipal} />
          </TouchableOpacity>
          <Text style={styles.headerFixoTitulo} numberOfLines={1}>
            {imovel.titulo}
          </Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      </Animated.View>

      {/* Botões flutuantes no topo (voltar + favoritar/partilhar) */}
      <SafeAreaView edges={['top']} style={styles.botoesFlutantes}>
        <TouchableOpacity
          style={styles.botaoFlutante}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textoPrincipal} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.botaoFlutante} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={22} color={Colors.textoPrincipal} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botaoFlutante}
            onPress={() => setFavoritado(!favoritado)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={22}
              color={favoritado ? Colors.erro : Colors.textoPrincipal}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Galeria de fotos */}
        <View style={styles.galeriaContainer}>
          <FlatList
            data={imovel.fotos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setFotoAtual(index);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.foto} />
            )}
          />
          {/* Contador de fotos */}
          <View style={styles.contadorFotos}>
            <Ionicons name="images" size={14} color={Colors.branco} />
            <Text style={styles.contadorFotosText}>
              {fotoAtual + 1} / {imovel.fotos.length}
            </Text>
          </View>
          {/* Dots */}
          <View style={styles.fotoDots}>
            {imovel.fotos.map((_, i) => (
              <View
                key={i}
                style={[styles.fotoDot, i === fotoAtual && styles.fotoDotActive]}
              />
            ))}
          </View>
        </View>

        {/* Info do imóvel */}
        <View style={styles.conteudo}>
          {/* Badges topo */}
          <View style={styles.badgesTopo}>
            <View style={[styles.badge, { backgroundColor: Colors.azul }]}>
              <Text style={styles.badgeText}>
                {imovel.finalidade === 'arrendar' ? 'ARRENDAR' : imovel.finalidade === 'vender' ? 'VENDER' : 'RESERVAR'}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: Colors.fundoSuave }]}>
              <Text style={[styles.badgeText, { color: Colors.textoPrincipal }]}>
                {imovel.tipo.toUpperCase()}
              </Text>
            </View>
            {imovel.anuncianteVerificado && (
              <View style={[styles.badge, styles.badgeVerificado]}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.verde} />
                <Text style={[styles.badgeText, { color: Colors.verde }]}>VERIFICADO</Text>
              </View>
            )}
          </View>

          {/* Título e localização */}
          <Text style={styles.titulo}>{imovel.titulo}</Text>
          <View style={styles.localizacaoRow}>
            <Ionicons name="location" size={16} color={Colors.azul} />
            <Text style={styles.localizacao}>
              {foiDesbloqueado ? imovel.moradaCompleta : `${imovel.bairro}, ${imovel.cidade}`}
            </Text>
          </View>

          {/* Preço + tempo */}
          <View style={styles.precoContainer}>
            <View>
              <Text style={styles.precoLabel}>PREÇO</Text>
              <Text style={styles.preco}>
                {formatarPreco(imovel.preco, imovel.periodicidade)}
              </Text>
            </View>
            <View style={styles.tempoContainer}>
              <View style={styles.tempoBadge}>
                <View style={styles.tempoBadgeDot} />
                <Text style={styles.tempoBadgeText}>{tempoDesdeMock(imovel.publicadoEm)}</Text>
              </View>
              <View style={styles.visualizacoes}>
                <Ionicons name="eye-outline" size={14} color={Colors.textoSecundario} />
                <Text style={styles.visualizacoesText}>{imovel.visualizacoes} vistas</Text>
              </View>
            </View>
          </View>

          {/* Características principais */}
          <View style={styles.caracteristicas}>
            {imovel.quartos && (
              <View style={styles.caracteristicaBox}>
                <View style={styles.caracteristicaIcone}>
                  <Icone name="bed" size={22} color={Colors.azul} />
                </View>
                <Text style={styles.caracteristicaValor}>{imovel.quartos}</Text>
                <Text style={styles.caracteristicaLabel}>Quartos</Text>
              </View>
            )}
            {imovel.casasBanho && (
              <View style={styles.caracteristicaBox}>
                <View style={styles.caracteristicaIcone}>
                  <Icone name="shower" size={22} color={Colors.azul} />
                </View>
                <Text style={styles.caracteristicaValor}>{imovel.casasBanho}</Text>
                <Text style={styles.caracteristicaLabel}>WC</Text>
              </View>
            )}
            {imovel.area && (
              <View style={styles.caracteristicaBox}>
                <View style={styles.caracteristicaIcone}>
                  <Icone name="ruler-square" size={22} color={Colors.azul} />
                </View>
                <Text style={styles.caracteristicaValor}>{imovel.area}</Text>
                <Text style={styles.caracteristicaLabel}>m²</Text>
              </View>
            )}
            <View style={styles.caracteristicaBox}>
              <View style={styles.caracteristicaIcone}>
                <Icone
                  name={imovel.mobilado ? 'sofa' : 'sofa-outline'}
                  size={22}
                  color={Colors.azul}
                />
              </View>
              <Text style={styles.caracteristicaValor}>{imovel.mobilado ? 'Sim' : 'Não'}</Text>
              <Text style={styles.caracteristicaLabel}>Mobilado</Text>
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.seccao}>
            <Text style={styles.seccaoTitulo}>Descrição</Text>
            <Text style={styles.descricao}>
              {foiDesbloqueado ? imovel.descricao : descricaoParcial}
            </Text>
            {!foiDesbloqueado && (
              <View style={styles.descricaoBloqueada}>
                <Ionicons name="lock-closed" size={14} color={Colors.textoTerciario} />
                <Text style={styles.descricaoBloqueadaText}>
                  Descrição completa disponível após desbloqueio
                </Text>
              </View>
            )}
          </View>

          {/* Comodidades */}
          <View style={styles.seccao}>
            <Text style={styles.seccaoTitulo}>Comodidades</Text>
            <View style={styles.comodidades}>
              <ComodidadeItem icon="water" ativo={imovel.agua} label="Água" />
              <ComodidadeItem icon="flash" ativo={imovel.energia} label="Energia" />
              <ComodidadeItem icon="wifi" ativo={imovel.wifi} label="Wi-Fi" />
              <ComodidadeItem icon="car" ativo={imovel.estacionamento} label="Estacionamento" />
            </View>
          </View>

          {/* Anunciante */}
          <View style={styles.seccao}>
            <Text style={styles.seccaoTitulo}>Anunciante</Text>
            <View style={styles.anuncianteCard}>
              <View style={styles.anuncianteAvatar}>
                <LinearGradient
                  colors={Colors.gradientePrimario}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.anuncianteAvatarLetra}>
                  {imovel.anuncianteNome.charAt(0)}
                </Text>
              </View>
              <View style={styles.anuncianteInfo}>
                <View style={styles.anuncianteNomeRow}>
                  <Text style={styles.anuncianteNome}>
                    {foiDesbloqueado ? imovel.anuncianteNome : imovel.anuncianteNome.split(' ')[0]}
                  </Text>
                  {imovel.anuncianteVerificado && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.verde} />
                  )}
                </View>
                <View style={styles.anuncianteRating}>
                  <Ionicons name="star" size={12} color={Colors.premium} />
                  <Text style={styles.ratingText}>
                    {imovel.anuncianteRating.toFixed(1)} · {imovel.anuncianteAvaliacoes} avaliações
                  </Text>
                </View>
                <Text style={styles.tempoResposta}>Responde em ~2 horas</Text>
              </View>
            </View>
          </View>

          {/* Localização - Mapa placeholder */}
          <View style={styles.seccao}>
            <Text style={styles.seccaoTitulo}>Localização</Text>
            <View style={styles.mapaPlaceholder}>
              <LinearGradient
                colors={['rgba(33, 150, 243, 0.1)', 'rgba(76, 175, 80, 0.1)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {!foiDesbloqueado && (
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.mapaConteudo}>
                <View style={styles.mapaPin}>
                  <Icone name="map-marker" size={40} color={Colors.azul} />
                </View>
                <Text style={styles.mapaTexto}>
                  {foiDesbloqueado ? '📍 Localização exacta desbloqueada' : '📍 Zona aproximada'}
                </Text>
                {foiDesbloqueado && (
                  <TouchableOpacity style={styles.botaoDirecoes} activeOpacity={0.8}>
                    <Icone name="directions" size={16} color={Colors.branco} />
                    <Text style={styles.botaoDirecoesText}>Como chegar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* CONTACTOS - só visíveis se desbloqueado */}
          {foiDesbloqueado && (
            <View style={styles.seccao}>
              <View style={styles.contactosHeader}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.verde} />
                <Text style={styles.contactosHeaderText}>Contactos desbloqueados</Text>
              </View>

              <View style={styles.contactosCard}>
                <View style={styles.contactoItem}>
                  <View style={styles.contactoIcone}>
                    <Ionicons name="call" size={18} color={Colors.azul} />
                  </View>
                  <View style={styles.contactoInfo}>
                    <Text style={styles.contactoLabel}>Principal</Text>
                    <Text style={styles.contactoNumero}>{imovel.anuncianteTelefone1}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactoBotao} onPress={ligar}>
                    <Ionicons name="call" size={16} color={Colors.branco} />
                  </TouchableOpacity>
                </View>

                <View style={styles.contactoDivider} />

                <View style={styles.contactoItem}>
                  <View style={styles.contactoIcone}>
                    <Ionicons name="call" size={18} color={Colors.azul} />
                  </View>
                  <View style={styles.contactoInfo}>
                    <Text style={styles.contactoLabel}>Alternativo</Text>
                    <Text style={styles.contactoNumero}>{imovel.anuncianteTelefone2}</Text>
                  </View>
                  <TouchableOpacity style={styles.contactoBotao}>
                    <Ionicons name="call" size={16} color={Colors.branco} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Footer fixo */}
      <View style={styles.footer}>
        <SafeAreaView edges={['bottom']}>
          {!foiDesbloqueado ? (
            // Não desbloqueado - Botão de pagamento
            <View style={styles.footerBloqueado}>
              <View style={styles.footerInfo}>
                <View style={styles.footerBadgePromo}>
                  <Icone name="tag" size={10} color={Colors.branco} />
                  <Text style={styles.footerBadgePromoText}>50% OFF</Text>
                </View>
                <View>
                  <Text style={styles.footerPrecoAntigo}>50 MT</Text>
                  <Text style={styles.footerPrecoNovo}>25 MT</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.footerBotao}
                onPress={() => router.push(`/pagamento?imovelId=${imovel.id}` as any)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={Colors.gradientePrimario}
                  style={styles.footerBotaoGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="lock-open" size={20} color={Colors.branco} />
                  <Text style={styles.footerBotaoText}>Desbloquear</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            // Desbloqueado - Botões de contacto
            <View style={styles.footerDesbloqueado}>
              <TouchableOpacity
                style={[styles.footerBotaoContacto, { backgroundColor: Colors.azul }]}
                onPress={ligar}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={20} color={Colors.branco} />
                <Text style={styles.footerBotaoContactoText}>Ligar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBotaoContacto, { backgroundColor: '#25D366' }]}
                onPress={abrirWhatsApp}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="whatsapp" size={20} color={Colors.branco} />
                <Text style={styles.footerBotaoContactoText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.footerBotaoChat}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble" size={20} color={Colors.azul} />
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
}

function ComodidadeItem({ icon, ativo, label }: any) {
  return (
    <View style={[styles.comodidade, !ativo && styles.comodidadeInativa]}>
      <Ionicons
        name={icon}
        size={20}
        color={ativo ? Colors.azul : Colors.textoTerciario}
      />
      <Text style={[styles.comodidadeLabel, !ativo && { color: Colors.textoTerciario }]}>
        {label}
      </Text>
      {ativo && (
        <View style={styles.comodidadeCheck}>
          <Ionicons name="checkmark" size={10} color={Colors.branco} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.branco,
  },
  headerFixo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordaSubtil,
  },
  headerFixoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  headerFixoTitulo: {
    ...Typography.h4,
    color: Colors.textoPrincipal,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  botaoHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botoesFlutantes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  botaoFlutante: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.md,
  },

  // Galeria
  galeriaContainer: {
    position: 'relative',
    height: 320,
  },
  foto: {
    width: width,
    height: 320,
  },
  contadorFotos: {
    position: 'absolute',
    top: Spacing.xxl + 40,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  contadorFotosText: {
    ...Typography.caption,
    color: Colors.branco,
    fontFamily: Fonte.corpoSemi,
  },
  fotoDots: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  fotoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  fotoDotActive: {
    backgroundColor: Colors.branco,
    width: 20,
  },

  conteudo: {
    padding: Spacing.lg,
    marginTop: -20,
    backgroundColor: Colors.branco,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
  },
  badgesTopo: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeVerificado: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  badgeText: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  titulo: {
    ...Typography.displayMD,
    color: Colors.textoPrincipal,
    marginBottom: Spacing.sm,
  },
  localizacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.lg,
  },
  localizacao: {
    ...Typography.body,
    color: Colors.textoSecundario,
    flex: 1,
  },
  precoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bordaSubtil,
  },
  precoLabel: {
    ...Typography.caption,
    color: Colors.textoTerciario,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  preco: {
    ...Typography.precoDisplay,
    color: Colors.azul,
    marginTop: 2,
  },
  tempoContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  tempoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 4,
  },
  tempoBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.verde,
  },
  tempoBadgeText: {
    ...Typography.caption,
    color: Colors.verde,
    fontFamily: Fonte.corpoSemi,
  },
  visualizacoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visualizacoesText: {
    ...Typography.caption,
    color: Colors.textoSecundario,
  },

  // Características
  caracteristicas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  caracteristicaBox: {
    flex: 1,
    backgroundColor: Colors.fundoSuave,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  caracteristicaIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.branco,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  caracteristicaValor: {
    ...Typography.h4,
    color: Colors.textoPrincipal,
  },
  caracteristicaLabel: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    marginTop: 2,
  },

  seccao: {
    marginBottom: Spacing.xl,
  },
  seccaoTitulo: {
    ...Typography.h2,
    color: Colors.textoPrincipal,
    marginBottom: Spacing.md,
  },
  descricao: {
    ...Typography.body,
    color: Colors.textoSecundario,
    lineHeight: 24,
  },
  descricaoBloqueada: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.fundoSuave,
    borderRadius: Radius.md,
  },
  descricaoBloqueadaText: {
    ...Typography.caption,
    color: Colors.textoTerciario,
    fontStyle: 'italic',
  },

  // Comodidades
  comodidades: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  comodidade: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fundoSuave,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  comodidadeInativa: {
    borderColor: Colors.bordaSubtil,
  },
  comodidadeLabel: {
    ...Typography.bodySmall,
    color: Colors.textoPrincipal,
    fontFamily: Fonte.corpoSemi,
  },
  comodidadeCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.verde,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Anunciante
  anuncianteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fundoSuave,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  anuncianteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.sm,
  },
  anuncianteAvatarLetra: {
    ...Typography.h2,
    color: Colors.branco,
    fontFamily: Fonte.tituloSemi,
  },
  anuncianteInfo: {
    flex: 1,
  },
  anuncianteNomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  anuncianteNome: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
  },
  anuncianteRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.caption,
    color: Colors.textoSecundario,
  },
  tempoResposta: {
    ...Typography.caption,
    color: Colors.verde,
    fontFamily: Fonte.corpoSemi,
    marginTop: 2,
  },

  // Mapa
  mapaPlaceholder: {
    height: 200,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.bordaSubtil,
    position: 'relative',
  },
  mapaConteudo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mapaPin: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.branco,
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombras.md,
  },
  mapaTexto: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
  },
  botaoDirecoes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.azul,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 6,
    marginTop: Spacing.sm,
  },
  botaoDirecoesText: {
    ...Typography.button,
    color: Colors.branco,
  },

  // Contactos
  contactosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  contactosHeaderText: {
    ...Typography.h4,
    color: Colors.textoPrincipal,
  },
  contactosCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  contactoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  contactoIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.branco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactoInfo: {
    flex: 1,
  },
  contactoLabel: {
    ...Typography.caption,
    color: Colors.textoSecundario,
    fontFamily: Fonte.corpoSemi,
  },
  contactoNumero: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
    marginTop: 2,
  },
  contactoBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.verde,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactoDivider: {
    height: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    marginVertical: Spacing.md,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.branco,
    borderTopWidth: 1,
    borderTopColor: Colors.bordaSubtil,
    ...Sombras.lg,
  },
  footerBloqueado: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerBadgePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.destaque,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    gap: 3,
  },
  footerBadgePromoText: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 9,
  },
  footerPrecoAntigo: {
    ...Typography.caption,
    color: Colors.textoTerciario,
    textDecorationLine: 'line-through',
  },
  footerPrecoNovo: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
  },
  footerBotao: {
    flex: 1,
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Sombras.colorida('#0A6BC0'),
  },
  footerBotaoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 8,
  },
  footerBotaoText: {
    ...Typography.buttonLarge,
    color: Colors.branco,
  },

  footerDesbloqueado: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  footerBotaoContacto: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    gap: 8,
  },
  footerBotaoContactoText: {
    ...Typography.button,
    color: Colors.branco,
  },
  footerBotaoChat: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});