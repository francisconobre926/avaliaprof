/**
 * Modal — Diálogo profissional GoHome
 *
 * Variantes: bottom-sheet | center
 * Com backdrop opcional (blur efeito vidro)
 * Suporta: título, subtítulo, swipe to close (apenas bottom-sheet)
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
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';

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
  children,
}) => {
  const cores = useCores();
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
          >
            <BackdropComponent style={StyleSheet.absoluteFill} {...backdropProps} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          {...(variant === 'bottom-sheet' ? panResponder.panHandlers : {})}
          style={[
            variant === 'bottom-sheet' ? styles.bottomSheet : styles.centerModal,
            {
              backgroundColor: cores.fundoElevado,
              transform: [{ translateY: variant === 'bottom-sheet' ? translateY : 0 }],
              opacity: variant === 'center' ? opacity : 1,
            },
          ]}
        >
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
                >
                  <Ionicons name="close" size={20} color={cores.textoPrincipal} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: H * 0.9,
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
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  titulo: { fontSize: 20, fontWeight: '800' },
  subtitulo: { fontSize: 13, marginTop: 4 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 20 },
});

export default Modal;