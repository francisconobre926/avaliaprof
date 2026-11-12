/**
 * Modal — Diálogo profissional AvaliaProf
 *
 * Variantes: bottom-sheet | center
 * Com backdrop opcional (blur efeito vidro)
 * Suporta: título, subtítulo, swipe to close (apenas bottom-sheet),
 * corpo com scroll interno e rodapé de ação fixo (`rodape`).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';

import { Fonte } from '../../theme/fonts';
import { Folha } from '../../theme/typography';
const { height: H } = Dimensions.get('window');

export type ModalVariant = 'bottom-sheet' | 'center';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  variant?: ModalVariant;
  titulo?: string;
  subtitulo?: string;
  swipeToClose?: boolean;
  showCloseButton?: boolean;
  backdropBlur?: boolean;
  /** Ação principal fixa no fundo da folha (ex.: <Button …/>); não desliza com o conteúdo. */
  rodape?: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  variant = 'bottom-sheet',
  titulo,
  subtitulo,
  swipeToClose = true,
  showCloseButton = true,
  backdropBlur = true,
  rodape,
  children,
}) => {
  const cores = useCores();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(H)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: H, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => swipeToClose && g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) onClose();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const BackdropComponent: any = backdropBlur ? BlurView : View;
  const backdropProps = backdropBlur
    ? { intensity: 25, tint: cores.ehEscuro ? 'dark' : 'light' as any }
    : { style: { backgroundColor: 'rgba(0,0,0,0.5)' } };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <BackdropComponent style={StyleSheet.absoluteFill} {...backdropProps} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            variant === 'bottom-sheet' ? styles.bottomSheet : styles.centerModal,
            variant === 'bottom-sheet' && { paddingBottom: Math.max(insets.bottom, 12) },
            {
              backgroundColor: cores.fundoElevado,
              transform: [{ translateY: variant === 'bottom-sheet' ? translateY : 0 }],
              opacity: variant === 'center' ? opacity : 1,
            },
          ]}
        >
          {/* Zona de arrasto: só handle + cabeçalho, para não competir com o scroll do corpo */}
          <View {...(variant === 'bottom-sheet' ? panResponder.panHandlers : {})}>
          {variant === 'bottom-sheet' && (
            <View style={[styles.handle, { backgroundColor: cores.bordaMedia }]} />
          )}

          {(titulo || showCloseButton) && (
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                {titulo && (
                  <Text style={[styles.titulo, { color: cores.textoPrincipal }]}>
                    {titulo}
                  </Text>
                )}
                {subtitulo && (
                  <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>
                    {subtitulo}
                  </Text>
                )}
              </View>
              {showCloseButton && (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeBtn, { backgroundColor: cores.fundoSuave }]}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar"
                >
                  <Ionicons name="close" size={20} color={cores.textoPrincipal} />
                </TouchableOpacity>
              )}
            </View>
          )}
          </View>

          <ScrollView
            style={styles.corpoScroll}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>

          {rodape ? (
            <View style={[styles.rodape, { borderTopColor: cores.bordaSubtil }]}>{rodape}</View>
          ) : null}
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  bottomSheet: {
    borderTopLeftRadius: Folha.raio,
    borderTopRightRadius: Folha.raio,
    paddingTop: 8,
    maxHeight: H * Folha.alturaMaxima,
  },
  centerModal: {
    margin: 20,
    marginVertical: 'auto',
    borderRadius: 20,
    padding: 4,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
  },
  handle: {
    width: Folha.handle.largura,
    height: Folha.handle.altura,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  titulo: { fontSize: 18, fontFamily: Fonte.tituloSemi },
  subtitulo: { fontFamily: Fonte.corpo, fontSize: 13, marginTop: 4 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpoScroll: { flexGrow: 0, flexShrink: 1 },
  body: { paddingHorizontal: 20, paddingBottom: 8 },
  rodape: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});

export default Modal;