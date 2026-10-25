/**
 * EmptyState — Estado vazio profissional GoHome
 *
 * Usado em: lista de favoritos vazia, sem mensagens, sem resultados de pesquisa, etc.
 * Props: icon, titulo, descricao, botão CTA opcional
 */

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';
import { Button } from './Button';

import { Fonte } from '../../theme/fonts';
interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'help-circle-outline',
  titulo,
  descricao,
  ctaLabel,
  onCtaPress,
  style,
}) => {
  const cores = useCores();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: cores.fundoSuave },
        ]}
      >
        <Ionicons name={icon} size={40} color={cores.textoTerciario} />
      </View>

      <Text style={[styles.titulo, { color: cores.textoPrincipal }]}>
        {titulo}
      </Text>

      {descricao && (
        <Text style={[styles.descricao, { color: cores.textoSecundario }]}>
          {descricao}
        </Text>
      )}

      {ctaLabel && onCtaPress && (
        <View style={styles.ctaWrap}>
          <Button label={ctaLabel} onPress={onCtaPress} variant="primary" size="md" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titulo: {
    fontSize: 18,
    fontFamily: Fonte.corpoSemi,
    textAlign: 'center',
    marginBottom: 8,
  },
  descricao: {
    fontFamily: Fonte.corpo, fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  ctaWrap: {
    marginTop: 24,
  },
});

export default EmptyState;