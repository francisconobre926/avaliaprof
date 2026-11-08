/**
 * Chip — Etiqueta interactiva GoHome
 *
 * Suporta: seleccionável, removível, com ícone
 * Usado em filtros, tags de categoria, interesses, etc.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';

import { Fonte } from '../../theme/fonts';
import { Colors } from '../../theme/colors';
interface ChipProps {
  label: string;
  seleccionado?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  seleccionado = false,
  onPress,
  onRemove,
  icon,
  disabled = false,
  haptic = true,
  style,
}) => {
  const cores = useCores();

  const handlePress = () => {
    if (disabled || !onPress) return;
    if (haptic) Haptics.selectionAsync();
    onPress();
  };

  const handleRemove = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.();
  };

  const corFundo = seleccionado ? cores.principal : cores.fundoSuave;
  const corTexto = seleccionado ? Colors.branco : cores.textoPrincipal;
  const corBorda = seleccionado ? cores.principal : cores.bordaSubtil;

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.container,
        {
          backgroundColor: corFundo,
          borderColor: corBorda,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={14} color={corTexto} />
      )}
      <Text style={[styles.label, { color: corTexto }]}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={handleRemove} hitSlop={8}>
          <Ionicons name="close" size={14} color={corTexto} />
        </TouchableOpacity>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    gap: 6,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 13, fontFamily: Fonte.corpoSemi },
});

export default Chip;