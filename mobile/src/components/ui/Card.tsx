/**
 * Card — Container profissional GoHome
 *
 * Variantes: elevated (sombra) | outlined (borda) | flat (nenhum)
 * Pressable opcional (vira TouchableOpacity se onPress for passado)
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCores } from '../../store/themeStore';
import { Sombras } from '../../theme/colors';

export type CardVariant = 'elevated' | 'outlined' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  padding?: number;
  radius?: number;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  onPress,
  padding = 16,
  radius = 16,
  haptic = true,
  style,
}) => {
  const cores = useCores();

  const containerStyle: ViewStyle = {
    backgroundColor: cores.fundoElevado,
    borderRadius: radius,
    padding,
    borderWidth: variant === 'outlined' ? 1 : 0,
    borderColor: variant === 'outlined' ? cores.bordaSubtil : 'transparent',
    ...(variant === 'elevated' ? Sombras.sm : {}),
  };

  const handlePress = () => {
    if (!onPress) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{children}</View>;
};

export default Card;