/**
 * Avatar — Imagem de perfil profissional GoHome
 *
 * Tamanhos: sm (32) | md (44) | lg (64) | xl (96)
 * Fallback: iniciais do nome com cor derivada
 * Opcional: badge de verificado
 */

import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';

import { Fonte } from '../../theme/fonts';
import { Colors } from '../../theme/colors';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  nome: string;
  foto?: string;
  tamanho?: AvatarSize;
  verificado?: boolean;
  style?: StyleProp<ViewStyle>;
}

const tamanhos: Record<AvatarSize, { size: number; font: number; badge: number; badgeIcon: number }> = {
  sm: { size: 32, font: 13, badge: 14, badgeIcon: 10 },
  md: { size: 44, font: 16, badge: 16, badgeIcon: 11 },
  lg: { size: 64, font: 22, badge: 20, badgeIcon: 13 },
  xl: { size: 96, font: 32, badge: 28, badgeIcon: 18 },
};

// Deriva cor estável a partir do nome (hash simples)
function corPorNome(nome: string, cores: string[]): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cores[Math.abs(hash) % cores.length];
}

const PALETA_AVATARES = [Colors.azul, Colors.azul, Colors.verdeTexto, Colors.azul, Colors.azul, Colors.azul, Colors.erro];

export const Avatar: React.FC<AvatarProps> = ({
  nome,
  foto,
  tamanho = 'md',
  verificado = false,
  style,
}) => {
  const cores = useCores();
  const sz = tamanhos[tamanho];
  const iniciais = (nome || 'A')
    .split(' ')
    .map(n => n.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const corFundo = corPorNome(nome || 'A', PALETA_AVATARES);

  return (
    <View style={[{ width: sz.size, height: sz.size }, style]}>
      {foto ? (
        <Image
          source={{ uri: foto }}
          style={{
            width: sz.size,
            height: sz.size,
            borderRadius: sz.size / 2,
            backgroundColor: cores.fundoSuave,
          }}
        />
      ) : (
        <View
          style={{
            width: sz.size,
            height: sz.size,
            borderRadius: sz.size / 2,
            backgroundColor: corFundo,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: Colors.branco, fontSize: sz.font, fontFamily: Fonte.corpoSemi }}>
            {iniciais}
          </Text>
        </View>
      )}

      {verificado && (
        <View
          style={[
            styles.badge,
            {
              width: sz.badge,
              height: sz.badge,
              borderRadius: sz.badge / 2,
              borderWidth: 2,
              borderColor: cores.fundoElevado,
              backgroundColor: Colors.azul,
            },
          ]}
        >
          <Ionicons name="checkmark" size={sz.badgeIcon} color={Colors.branco} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Avatar;