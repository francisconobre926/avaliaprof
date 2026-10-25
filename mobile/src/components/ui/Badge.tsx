/**
 * Badge — Etiqueta de status profissional GoHome
 *
 * Cores semânticas: azul | laranja | verde | vermelho | cinza | premium
 * Tamanhos: sm | md
 */

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';

export type BadgeCor = 'azul' | 'laranja' | 'verde' | 'vermelho' | 'cinza' | 'premium';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  cor?: BadgeCor;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  cor = 'azul',
  size = 'sm',
  icon,
  style,
}) => {
  const cores = useCores();

  const mapaCor: Record<BadgeCor, { fundo: string; texto: string }> = {
    azul:     { fundo: 'rgba(0, 130, 222, 0.12)',   texto: '#0082DE' },
    laranja:  { fundo: 'rgba(254, 138, 0, 0.14)',   texto: '#FE8A00' },
    verde:    { fundo: 'rgba(76, 175, 80, 0.14)',   texto: '#4CAF50' },
    vermelho: { fundo: 'rgba(244, 67, 54, 0.12)',   texto: '#F44336' },
    cinza:    { fundo: cores.fundoSuave,            texto: cores.textoSecundario },
    premium:  { fundo: 'rgba(255, 179, 0, 0.14)',   texto: '#FFB300' },
  };
  const { fundo, texto } = mapaCor[cor];

  const szStyles = {
    sm: { padV: 3, padH: 8, font: 10, icon: 11, gap: 4 },
    md: { padV: 5, padH: 12, font: 12, icon: 13, gap: 5 },
  }[size];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: fundo,
          paddingVertical: szStyles.padV,
          paddingHorizontal: szStyles.padH,
          borderRadius: 100,
          gap: szStyles.gap,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={szStyles.icon} color={texto} />}
      <Text
        style={{
          color: texto,
          fontSize: szStyles.font,
          fontWeight: '700',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default Badge;