/**
 * Button — Componente de botão profissional AvaliaProf
 *
 * Variantes: primary | secondary | outline | ghost | danger
 * Tamanhos: sm | md | lg
 * Suporta: icon, loading state, haptic feedback, fullWidth
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';
import { Colors, Sombras } from '../../theme/colors';
import { Controlo } from '../../theme/typography';

import { Fonte } from '../../theme/fonts';
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic = true,
  style,
  labelStyle,
}) => {
  const cores = useCores();

  const handlePress = () => {
    if (disabled || loading) return;
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Tamanhos
  const sizeStyles: Record<ButtonSize, { padV: number; padH: number; font: number; icon: number; height: number }> = {
    sm: { padV: 6, padH: 14, font: 13, icon: 16, height: Controlo.botaoPequeno },
    md: { padV: 10, padH: 18, font: 15, icon: 18, height: Controlo.botao },
    lg: { padV: 12, padH: 22, font: 16, icon: 20, height: Controlo.botaoGrande },
  };
  const sz = sizeStyles[size];

  // Cores por variante
  const corTexto = (() => {
    if (variant === 'primary') return cores.textoSobrePrincipal;
    if (variant === 'danger') return Colors.branco;
    if (variant === 'secondary') return cores.textoPrincipal;
    if (variant === 'outline' || variant === 'ghost') return cores.principalTexto;
    return Colors.branco;
  })();

  const corFundo = (() => {
    if (disabled) return cores.bordaSubtil;
    if (variant === 'secondary') return cores.fundoSuave;
    if (variant === 'danger') return cores.erro;
    if (variant === 'outline' || variant === 'ghost') return 'transparent';
    return 'transparent'; // primary usa gradiente
  })();

  const corBorda = variant === 'outline' ? cores.principalTexto : 'transparent';

  const containerBase: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sz.padV,
    paddingHorizontal: sz.padH,
    minHeight: sz.height,
    borderRadius: Math.min(12, sz.height / 2),
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: corBorda,
    backgroundColor: corFundo,
    opacity: disabled ? 0.6 : 1,
    overflow: 'hidden',
    width: fullWidth ? '100%' : undefined,
    gap: 8,
    ...(variant === 'primary' || variant === 'danger' ? Sombras.sm : {}),
  };

  const renderConteudo = () => (
    <>
      {loading ? (
        <ActivityIndicator color={corTexto} size="small" />
      ) : (
        <>
          {icon && !iconRight && (
            <Ionicons name={icon} size={sz.icon} color={corTexto} />
          )}
          <Text
            style={[
              { color: corTexto, fontSize: sz.font, fontFamily: Fonte.corpoSemi },
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconRight && (
            <Ionicons name={icon} size={sz.icon} color={corTexto} />
          )}
        </>
      )}
    </>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[containerBase, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {variant === 'primary' && !disabled && (
        <LinearGradient
          colors={cores.gradiente}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.conteudoLinha}>{renderConteudo()}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  conteudoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default Button;