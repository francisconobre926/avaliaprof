/**
 * SkeletonLoader — Placeholder animado profissional GoHome
 *
 * Variantes: text | avatar | card | image | custom
 * Shimmer animation suave
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useCores } from '../../store/themeStore';

export type SkeletonVariant = 'text' | 'avatar' | 'card' | 'image' | 'custom';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  linhas?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  radius,
  linhas = 1,
  gap = 8,
  style,
}) => {
  const cores = useCores();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacityAnim = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  // Dimensões por variante
  const defaults: Record<SkeletonVariant, { w: number | `${number}%`; h: number; r: number }> = {
    text:   { w: '100%', h: 14, r: 6 },
    avatar: { w: 44,     h: 44, r: 22 },
    card:   { w: '100%', h: 180, r: 16 },
    image:  { w: '100%', h: 220, r: 12 },
    custom: { w: width ?? '100%', h: height ?? 20, r: radius ?? 6 },
  };
  const def = defaults[variant];

  const renderUm = (key?: number) => (
    <Animated.View
      key={key}
      style={[
        {
          width: width ?? def.w,
          height: height ?? def.h,
          borderRadius: radius ?? def.r,
          backgroundColor: cores.fundoSuave,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );

  if (variant === 'text' && linhas > 1) {
    return (
      <View style={{ gap }}>
        {Array.from({ length: linhas }).map((_, i) => (
          <Animated.View
            key={i}
            style={{
              width: i === linhas - 1 ? '70%' : width ?? '100%',
              height: height ?? def.h,
              borderRadius: radius ?? def.r,
              backgroundColor: cores.fundoSuave,
              opacity: opacityAnim,
            }}
          />
        ))}
      </View>
    );
  }

  return renderUm();
};

// Combinador: linha de card tipo "avatar + 2 linhas de texto"
export const SkeletonLinha: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => (
  <View style={[styles.linha, style]}>
    <SkeletonLoader variant="avatar" />
    <View style={{ flex: 1, gap: 6 }}>
      <SkeletonLoader variant="text" width="60%" />
      <SkeletonLoader variant="text" width="40%" />
    </View>
  </View>
);

// Combinador: card de anúncio
export const SkeletonCardAnuncio: React.FC = () => (
  <View style={{ gap: 10, marginBottom: 16 }}>
    <SkeletonLoader variant="image" height={180} />
    <SkeletonLoader variant="text" width="80%" height={16} />
    <SkeletonLoader variant="text" width="50%" height={13} />
    <SkeletonLoader variant="text" width="35%" height={18} />
  </View>
);

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
});

export default SkeletonLoader;