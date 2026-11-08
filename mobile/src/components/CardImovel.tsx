import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Sombras } from '../theme/colors';
import { Spacing, Typography, Radius } from '../theme/typography';
import { Imovel } from '../types';
import { formatarPreco, tempoDesdeMock } from '../data/imoveis-mock';

import { Fonte } from '../theme/fonts';
import Icone from './Icone';
const { width } = Dimensions.get('window');

interface CardImovelProps {
  imovel: Imovel;
  variante?: 'horizontal' | 'vertical' | 'destaque';
  onPress?: () => void;
  onFavoritar?: () => void;
  favoritado?: boolean;
}

export default function CardImovel({
  imovel,
  variante = 'vertical',
  onPress,
  onFavoritar,
  favoritado = false,
}: CardImovelProps) {
  if (variante === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.cardHorizontal}
        onPress={onPress}
        activeOpacity={0.95}
      >
        <View style={styles.imagemHorizontalContainer}>
          <Image source={{ uri: imovel.fotos[0] }} style={styles.imagemHorizontal} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradienteImagem}
          />
          {/* Badge tipo */}
          <View style={styles.badgeTipo}>
            <Text style={styles.badgeTipoText}>
              {imovel.tipo.toUpperCase()}
            </Text>
          </View>
          {/* Botão favoritar */}
          <TouchableOpacity style={styles.botaoFavoritar} onPress={onFavoritar} activeOpacity={0.7}>
            <Ionicons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={20}
              color={favoritado ? Colors.erro : Colors.branco}
            />
          </TouchableOpacity>
          {/* Preço overlay */}
          <View style={styles.precoHorizontal}>
            <Text style={styles.precoHorizontalTexto}>
              {formatarPreco(imovel.preco, imovel.periodicidade)}
            </Text>
          </View>
        </View>

        <View style={styles.infoHorizontal}>
          <Text style={styles.tituloHorizontal} numberOfLines={1}>
            {imovel.titulo}
          </Text>
          <View style={styles.localizacaoRow}>
            <Ionicons name="location" size={12} color={Colors.textoSecundario} />
            <Text style={styles.localizacaoTexto} numberOfLines={1}>
              {imovel.bairro}, {imovel.cidade}
            </Text>
          </View>

          <View style={styles.caracteristicasRow}>
            {imovel.quartos && (
              <View style={styles.caracteristica}>
                <Icone name="bed-outline" size={14} color={Colors.textoSecundario} />
                <Text style={styles.caracteristicaTexto}>{imovel.quartos}</Text>
              </View>
            )}
            {imovel.casasBanho && (
              <View style={styles.caracteristica}>
                <Icone name="shower" size={14} color={Colors.textoSecundario} />
                <Text style={styles.caracteristicaTexto}>{imovel.casasBanho}</Text>
              </View>
            )}
            {imovel.area && (
              <View style={styles.caracteristica}>
                <Icone name="ruler-square" size={14} color={Colors.textoSecundario} />
                <Text style={styles.caracteristicaTexto}>{imovel.area}m²</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Vertical (padrão) - card completo
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.imagemContainer}>
        <Image source={{ uri: imovel.fotos[0] }} style={styles.imagem} />

        {/* Gradiente overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.gradienteImagem}
        />

        {/* Top row com badges */}
        <View style={styles.topRow}>
          <View style={styles.badges}>
            <View style={[styles.badge, styles.badgeFinalidade]}>
              <Text style={styles.badgeText}>
                {imovel.finalidade === 'arrendar' ? 'ARRENDAR' : imovel.finalidade === 'vender' ? 'VENDER' : 'RESERVAR'}
              </Text>
            </View>
            {imovel.anuncianteVerificado && (
              <View style={styles.badgeVerificado}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.branco} />
                <Text style={styles.badgeVerificadoText}>Verificado</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.favoritoBotao}
            onPress={onFavoritar}
            activeOpacity={0.7}
          >
            <Ionicons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={22}
              color={favoritado ? Colors.erro : Colors.branco}
            />
          </TouchableOpacity>
        </View>

        {/* Contador de fotos */}
        <View style={styles.contadorFotos}>
          <Ionicons name="images" size={12} color={Colors.branco} />
          <Text style={styles.contadorFotosText}>{imovel.fotos.length}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.tituloRow}>
          <Text style={styles.titulo} numberOfLines={1}>
            {imovel.titulo}
          </Text>
        </View>

        <View style={styles.localizacaoRow}>
          <Ionicons name="location" size={14} color={Colors.textoSecundario} />
          <Text style={styles.localizacaoTexto} numberOfLines={1}>
            {imovel.bairro}, {imovel.cidade}
          </Text>
          <View style={styles.pontoSeparador} />
          <Text style={styles.tempoTexto}>{tempoDesdeMock(imovel.publicadoEm)}</Text>
        </View>

        {/* Características */}
        <View style={styles.caracteristicasContainer}>
          {imovel.quartos && (
            <View style={styles.caracteristicaCard}>
              <Icone name="bed" size={14} color={Colors.azul} />
              <Text style={styles.caracteristicaCardTexto}>{imovel.quartos} Quartos</Text>
            </View>
          )}
          {imovel.casasBanho && (
            <View style={styles.caracteristicaCard}>
              <Icone name="shower" size={14} color={Colors.azul} />
              <Text style={styles.caracteristicaCardTexto}>{imovel.casasBanho} WC</Text>
            </View>
          )}
          {imovel.area && (
            <View style={styles.caracteristicaCard}>
              <Icone name="ruler-square" size={14} color={Colors.azul} />
              <Text style={styles.caracteristicaCardTexto}>{imovel.area}m²</Text>
            </View>
          )}
        </View>

        {/* Footer com preço e rating */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.precoLabel}>PREÇO</Text>
            <Text style={styles.preco}>
              {formatarPreco(imovel.preco, imovel.periodicidade)}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color={Colors.premium} />
              <Text style={styles.ratingText}>{imovel.anuncianteRating.toFixed(1)}</Text>
            </View>
            <Text style={styles.ratingCount}>({imovel.anuncianteAvaliacoes})</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ============ VERTICAL (padrão) ============
  card: {
    backgroundColor: Colors.branco,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.bordaSubtil,
    ...Sombras.md,
  },
  imagemContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  gradienteImagem: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  topRow: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  badgeFinalidade: {
    backgroundColor: Colors.azul,
  },
  badgeText: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  badgeVerificado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.verdeTexto,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 3,
  },
  badgeVerificadoText: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 12,
  },
  favoritoBotao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contadorFotos: {
    position: 'absolute',
    bottom: Spacing.md,
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
  info: {
    padding: Spacing.base,
  },
  tituloRow: {
    marginBottom: Spacing.xs,
  },
  titulo: {
    ...Typography.h3,
    color: Colors.textoPrincipal,
  },
  localizacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 4,
  },
  localizacaoTexto: {
    ...Typography.bodySmall,
    color: Colors.textoSecundario,
    flex: 1,
  },
  pontoSeparador: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textoTerciario,
    marginHorizontal: 6,
  },
  tempoTexto: {
    ...Typography.caption,
    color: Colors.textoTerciario,
  },
  caracteristicasContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  caracteristicaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.fundoSuave,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    gap: 4,
  },
  caracteristicaCardTexto: {
    ...Typography.caption,
    color: Colors.textoPrincipal,
    fontFamily: Fonte.corpoSemi,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.bordaSubtil,
    paddingTop: Spacing.md,
  },
  precoLabel: {
    ...Typography.caption,
    color: Colors.textoTerciario,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  preco: {
    ...Typography.preco,
    color: Colors.azulTexto,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
  },
  ratingCount: {
    ...Typography.caption,
    color: Colors.textoTerciario,
  },

  // ============ HORIZONTAL (compacto - carrossel) ============
  cardHorizontal: {
    width: 240,
    backgroundColor: Colors.branco,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.bordaSubtil,
    ...Sombras.sm,
  },
  imagemHorizontalContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  imagemHorizontal: {
    width: '100%',
    height: '100%',
  },
  badgeTipo: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  badgeTipoText: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  botaoFavoritar: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  precoHorizontal: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  precoHorizontalTexto: {
    ...Typography.bodyBold,
    color: Colors.branco,
    fontSize: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoHorizontal: {
    padding: Spacing.md,
  },
  tituloHorizontal: {
    ...Typography.bodyBold,
    color: Colors.textoPrincipal,
    marginBottom: 4,
  },
  caracteristicasRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  caracteristica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  caracteristicaTexto: {
    ...Typography.caption,
    color: Colors.textoSecundario,
  },
});