import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Sombras } from '../theme/colors';
import { Spacing, Typography, Radius } from '../theme/typography';
import { useCores } from '../store/themeStore';
import { Anuncio, dataPublicacaoAnuncio } from '../types';
import { formatarPrecoCompleto, tempoDesde } from '../data/anuncios-mock';

import { Fonte } from '../theme/fonts';
import Icone from './Icone';
const { width } = Dimensions.get('window');

interface CardAnuncioProps {
  anuncio: Anuncio;
  variante?: 'horizontal' | 'vertical' | 'destaque';
  onPress?: () => void;
  onFavoritar?: () => void;
  favoritado?: boolean;
}

// ========================================================
// HELPERS DE APRESENTAÇÃO POR CATEGORIA
// ========================================================

/**
 * Devolve o rótulo em português da categoria
 */
function labelCategoria(categoria: string): string {
  const labels: Record<string, string> = {
    casa: 'Casa',
    apartamento: 'Apart.',
    quarto: 'Quarto',
    moradia: 'Moradia',
    loja: 'Loja',
    escritorio: 'Escritório',
    salao: 'Salão',
    espaco_comercial: 'Espaço',
    terreno: 'Terreno',
    lote: 'Lote',
    espaco_eventos: 'Eventos',
    espaco_casamento: 'Casamento',
    espaco_reuniao: 'Reunião',
    espaco_formacao: 'Formação',
    estudio: 'Estúdio',
    hotel: 'Hotel',
    pensao: 'Pensão',
    hospedagem: 'Hospedagem',
    quarto_hotel: 'Quarto',
    carro: 'Carro',
    mota: 'Mota',
    carrinha: 'Carrinha',
    camiao: 'Camião',
    equipamento: 'Equip.',
    maquina: 'Máquina',
    outro: 'Outro',
  };
  return labels[categoria] || categoria.toUpperCase();
}

/**
 * Devolve o ícone certo para a categoria
 */
function iconeCategoria(categoria: string): string {
  const icones: Record<string, string> = {
    casa: 'home-outline',
    apartamento: 'office-building-outline',
    quarto: 'bed-outline',
    moradia: 'home-city-outline',
    loja: 'storefront-outline',
    escritorio: 'briefcase-outline',
    salao: 'party-popper',
    espaco_comercial: 'store-outline',
    terreno: 'map-outline',
    lote: 'map-marker-outline',
    espaco_eventos: 'party-popper',
    espaco_casamento: 'ring',
    espaco_reuniao: 'account-group-outline',
    espaco_formacao: 'school-outline',
    estudio: 'microphone-outline',
    hotel: 'bed',
    pensao: 'home-heart',
    hospedagem: 'home-circle',
    quarto_hotel: 'bed',
    carro: 'car-outline',
    mota: 'motorbike',
    carrinha: 'van-utility',
    camiao: 'truck-outline',
    equipamento: 'cog-outline',
    maquina: 'wrench-outline',
    outro: 'tag-outline',
  };
  return icones[categoria] || 'tag-outline';
}

/**
 * Renderiza as 2-3 características principais específicas da categoria
 */
function CaracteristicasCard({ anuncio, cores }: { anuncio: Anuncio; cores: any }) {
  const c = anuncio.caracteristicas;
  if (!c) return null;

  // IMÓVEL
  if (c.tipo === 'imovel') {
    return (
      <View style={styles.caracteristicasRow}>
        {c.quartos !== undefined && c.quartos > 0 && (
          <View style={styles.caracteristica}>
            <Icone name="bed-outline" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.quartos}</Text>
          </View>
        )}
        {c.casasBanho !== undefined && c.casasBanho > 0 && (
          <View style={styles.caracteristica}>
            <Icone name="shower" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.casasBanho}</Text>
          </View>
        )}
        {c.area !== undefined && c.area > 0 && (
          <View style={styles.caracteristica}>
            <Icone name="ruler-square" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.area}m²</Text>
          </View>
        )}
      </View>
    );
  }

  // VEÍCULO
  if (c.tipo === 'veiculo') {
    return (
      <View style={styles.caracteristicasRow}>
        <View style={styles.caracteristica}>
          <Icone name="calendar" size={14} color={cores.textoSecundario} />
          <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.ano}</Text>
        </View>
        {c.kilometragem !== undefined && (
          <View style={styles.caracteristica}>
            <Icone name="speedometer" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>
              {(c.kilometragem / 1000).toFixed(0)}k km
            </Text>
          </View>
        )}
        {c.transmissao && (
          <View style={styles.caracteristica}>
            <Icone name="car-cog" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>
              {c.transmissao === 'automatica' ? 'Auto' : 'Manual'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // ESPAÇO
  if (c.tipo === 'espaco') {
    return (
      <View style={styles.caracteristicasRow}>
        <View style={styles.caracteristica}>
          <Icone name="account-group" size={14} color={cores.textoSecundario} />
          <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.capacidade} pessoas</Text>
        </View>
        {c.area !== undefined && (
          <View style={styles.caracteristica}>
            <Icone name="ruler-square" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.area}m²</Text>
          </View>
        )}
        {c.estacionamento && (
          <View style={styles.caracteristica}>
            <Icone name="parking" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>Estac.</Text>
          </View>
        )}
      </View>
    );
  }

  // ALOJAMENTO
  if (c.tipo === 'alojamento') {
    return (
      <View style={styles.caracteristicasRow}>
        {c.piscina && (
          <View style={styles.caracteristica}>
            <Icone name="pool" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>Piscina</Text>
          </View>
        )}
        {c.pequenoAlmoco && (
          <View style={styles.caracteristica}>
            <Icone name="coffee" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>Pequeno-almoço</Text>
          </View>
        )}
        {c.wifi && (
          <View style={styles.caracteristica}>
            <Icone name="wifi" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>Wi-Fi</Text>
          </View>
        )}
      </View>
    );
  }

  // EQUIPAMENTO
  if (c.tipo === 'equipamento') {
    return (
      <View style={styles.caracteristicasRow}>
        {c.marca && (
          <View style={styles.caracteristica}>
            <Icone name="tag" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.marca}</Text>
          </View>
        )}
        {c.condicao && (
          <View style={styles.caracteristica}>
            <Icone name="check-circle" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>{c.condicao}</Text>
          </View>
        )}
        {c.garantia && (
          <View style={styles.caracteristica}>
            <Icone name="shield-check" size={14} color={cores.textoSecundario} />
            <Text style={[styles.caracteristicaTexto, { color: cores.textoSecundario }]}>Garantia</Text>
          </View>
        )}
      </View>
    );
  }

  // OUTRO — sem características específicas
  return null;
}

// ========================================================
// COMPONENTE PRINCIPAL
// ========================================================

export default function CardAnuncio({
  anuncio,
  variante = 'vertical',
  onPress,
  onFavoritar,
  favoritado = false,
}: CardAnuncioProps) {
  const cores = useCores();

  // Variante HORIZONTAL (destaques, listas horizontais)
  if (variante === 'horizontal') {
    return (
      <TouchableOpacity
        style={[styles.cardHorizontal, { backgroundColor: cores.fundoElevado }]}
        onPress={onPress}
        activeOpacity={0.95}
      >
        <View style={styles.imagemHorizontalContainer}>
          <Image source={{ uri: anuncio.fotos[0] }} style={styles.imagemHorizontal} />
          <LinearGradient
            colors={['transparent', 'rgba(15,16,18,0.45)']}
            style={styles.gradienteImagem}
          />
          <View style={styles.badgeTipo}>
            <Icone name={iconeCategoria(anuncio.categoria) as any} size={11} color={Colors.textoPrincipal} />
            <Text style={styles.badgeTipoText}>{labelCategoria(anuncio.categoria)}</Text>
          </View>
          <TouchableOpacity style={styles.botaoFavoritar} onPress={onFavoritar} activeOpacity={0.7}>
            <Ionicons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={18}
              color={favoritado ? Colors.erro : Colors.textoPrincipal}
            />
          </TouchableOpacity>
          <View style={styles.precoHorizontal}>
            <Text style={styles.precoHorizontalTexto}>
              {formatarPrecoCompleto(anuncio)}
            </Text>
          </View>
        </View>

        <View style={styles.infoHorizontal}>
          <Text style={[styles.tituloHorizontal, { color: cores.textoPrincipal }]} numberOfLines={1}>
            {anuncio.titulo}
          </Text>
          <View style={styles.localizacaoRow}>
            <Ionicons name="location-outline" size={12} color={cores.textoSecundario} />
            <Text style={[styles.localizacaoTexto, { color: cores.textoSecundario }]} numberOfLines={1}>
              {anuncio.bairro}, {anuncio.cidade}
            </Text>
          </View>
          <CaracteristicasCard anuncio={anuncio} cores={cores} />
        </View>
      </TouchableOpacity>
    );
  }

  // Variante VERTICAL (lista principal)
  return (
    <TouchableOpacity
      style={[styles.cardVertical, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.imagemVerticalContainer}>
        <Image source={{ uri: anuncio.fotos[0] }} style={styles.imagemVertical} />
        <LinearGradient
          colors={['transparent', 'rgba(15,16,18,0.35)']}
          style={styles.gradienteImagemVertical}
        />

        {/* Badge categoria */}
        <View style={styles.badgeTipoVertical}>
          <Icone name={iconeCategoria(anuncio.categoria) as any} size={12} color={Colors.textoPrincipal} />
          <Text style={styles.badgeTipoText}>{labelCategoria(anuncio.categoria)}</Text>
        </View>

        {/* Badge verificado */}
        {anuncio.anuncianteVerificado && (
          <View style={styles.badgeVerificado}>
            <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
            <Text style={styles.badgeVerificadoTexto}>Verificado</Text>
          </View>
        )}

        {/* Botão favoritar */}
        <TouchableOpacity style={styles.botaoFavoritarVertical} onPress={onFavoritar} activeOpacity={0.7}>
          <Ionicons
            name={favoritado ? 'heart' : 'heart-outline'}
            size={18}
            color={favoritado ? Colors.erro : Colors.textoPrincipal}
          />
        </TouchableOpacity>

        {/* Contagem fotos */}
        {anuncio.fotos.length > 1 && (
          <View style={styles.contagemFotos}>
            <Ionicons name="images" size={11} color="#FFFFFF" />
            <Text style={styles.contagemFotosTexto}>{anuncio.fotos.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.infoVertical}>
        {/* Título */}
        <Text style={[styles.tituloVertical, { color: cores.textoPrincipal }]} numberOfLines={2}>
          {anuncio.titulo}
        </Text>

        {/* Localização */}
        <View style={styles.localizacaoRow}>
          <Ionicons name="location-outline" size={12} color={cores.textoSecundario} />
          <Text style={[styles.localizacaoTexto, { color: cores.textoSecundario }]} numberOfLines={1}>
            {anuncio.bairro}, {anuncio.cidade}
          </Text>
        </View>

        {/* Características específicas da categoria */}
        <CaracteristicasCard anuncio={anuncio} cores={cores} />

        {/* Linha de preço + tempo */}
        <View style={styles.rodape}>
          <Text style={[styles.preco, { color: cores.textoPrincipal }]}>
            {formatarPrecoCompleto(anuncio)}
          </Text>
          <View style={styles.tempoContainer}>
            <Ionicons name="time-outline" size={11} color={cores.textoTerciario} />
            <Text style={[styles.tempoTexto, { color: cores.textoTerciario }]}>
              {tempoDesde(dataPublicacaoAnuncio(anuncio))}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ========================================================
// STYLES
// ========================================================

const styles = StyleSheet.create({
  // ============ VARIANTE HORIZONTAL ============
  cardHorizontal: {
    width: 240,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  imagemHorizontalContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  imagemHorizontal: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E7E5DF',
  },
  gradienteImagem: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  badgeTipo: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.94)',
    gap: 4,
  },
  badgeTipoText: {
    fontFamily: Fonte.corpoSemi,
    color: Colors.textoPrincipal,
    fontSize: 11,
  },
  botaoFavoritar: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  precoHorizontal: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  precoHorizontalTexto: {
    fontFamily: Fonte.tituloSemi,
    color: Colors.textoPrincipal,
    fontSize: 14,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
  infoHorizontal: {
    paddingTop: 10,
    paddingHorizontal: 2,
    gap: 3,
  },
  tituloHorizontal: {
    fontFamily: Fonte.corpoSemi,
    fontSize: 14,
    lineHeight: 19,
  },
  localizacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  localizacaoTexto: {
    ...Typography.caption,
    fontFamily: Fonte.corpo,
    fontSize: 12,
    flex: 1,
  },
  caracteristicasRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  caracteristica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caracteristicaTexto: {
    fontFamily: Fonte.corpoMedio,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },

  // ============ VARIANTE VERTICAL ============
  cardVertical: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imagemVerticalContainer: {
    width: '100%',
    height: 196,
    position: 'relative',
  },
  imagemVertical: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E7E5DF',
  },
  gradienteImagemVertical: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  badgeTipoVertical: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.94)',
    gap: 4,
  },
  badgeVerificado: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(15,16,18,0.55)',
  },
  badgeVerificadoTexto: {
    fontFamily: Fonte.corpoSemi,
    color: '#FFFFFF',
    fontSize: 11,
  },
  botaoFavoritarVertical: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contagemFotos: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,16,18,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  contagemFotosTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonte.corpoSemi,
    fontVariant: ['tabular-nums'],
  },
  infoVertical: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 5,
  },
  tituloVertical: {
    fontFamily: Fonte.corpoSemi,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  preco: {
    ...Typography.preco,
    fontSize: 19,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tempoTexto: {
    ...Typography.caption,
    fontFamily: Fonte.corpo,
    fontSize: 11,
  },
});
