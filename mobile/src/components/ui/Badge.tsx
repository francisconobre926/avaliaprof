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

import { Fonte } from '../../theme/fonts';
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
    azul:     { fundo: 'rgba(10, 107, 192, 0.12)',   texto: '#0A6BC0' },
    laranja:  { fundo: 'rgba(232, 118, 10, 0.14)',   texto: '#E8760A' },
    verde:    { fundo: 'rgba(76, 175, 80, 0.14)',   texto: '#2F7A4F' },
    vermelho: { fundo: 'rgba(244, 67, 54, 0.12)',   texto: '#C2412D' },
    cinza:    { fundo: cores.fundoSuave,            texto: cores.textoSecundario },
    premium:  { fundo: 'rgba(255, 179, 0, 0.14)',   texto: '#C9952F' },
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
          fontFamily: Fonte.corpoSemi,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default Badge;