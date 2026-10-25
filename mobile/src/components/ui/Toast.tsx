/**
 * Toast — Sistema de notificações flutuantes profissional GoHome
 *
 * Imperativo: toast.show({ tipo, titulo, descricao, duracao })
 * Suporta: success, error, warning, info
 * Posição: top | bottom
 * Auto-dismiss com animação
 *
 * COMO USAR:
 * 1. Em app/_layout.tsx: envolve o Stack com <ToastProvider>
 * 2. Em qualquer ecrã: import { useToast } from '@/components/ui/Toast'
 *    const toast = useToast();
 *    toast.show({ tipo: 'success', titulo: 'Guardado!' });
 */

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';
import { Sombras } from '../../theme/colors';

const { width: W } = Dimensions.get('window');

export type ToastTipo = 'success' | 'error' | 'warning' | 'info';
export type ToastPosicao = 'top' | 'bottom';

interface ToastOpcoes {
  tipo?: ToastTipo;
  titulo: string;
  descricao?: string;
  duracao?: number; // ms, default 3000
  posicao?: ToastPosicao;
}

interface ToastInstancia extends ToastOpcoes {
  id: string;
}

interface ToastContextType {
  show: (opts: ToastOpcoes) => void;
  hide: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInstancia[]>([]);

  const show = useCallback((opts: ToastOpcoes) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    const toast: ToastInstancia = {
      id,
      tipo: 'info',
      duracao: 3000,
      posicao: 'top',
      ...opts,
    };
    setToasts(prev => [...prev, toast]);

    // Haptic
    const feedback =
      toast.tipo === 'success' ? Haptics.NotificationFeedbackType.Success :
      toast.tipo === 'error' ? Haptics.NotificationFeedbackType.Error :
      toast.tipo === 'warning' ? Haptics.NotificationFeedbackType.Warning :
      Haptics.NotificationFeedbackType.Success;
    Haptics.notificationAsync(feedback).catch(() => {});

    // Auto-hide
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duracao);
  }, []);

  const hide = useCallback((id?: string) => {
    if (id) setToasts(prev => prev.filter(t => t.id !== id));
    else setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {toasts.map((t, i) => (
          <ToastItem key={t.id} toast={t} index={i} onDismiss={() => hide(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return ctx;
};

// ============================================================
// COMPONENTE INTERNO
// ============================================================
const ToastItem: React.FC<{
  toast: ToastInstancia;
  index: number;
  onDismiss: () => void;
}> = ({ toast, index, onDismiss }) => {
  const cores = useCores();
  const translateY = useRef(new Animated.Value(toast.posicao === 'top' ? -100 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: toast.posicao === 'top' ? -100 : 100,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }, (toast.duracao || 3000) - 220);

    return () => clearTimeout(hideTimer);
  }, []);

  const mapaTipo: Record<ToastTipo, { icon: keyof typeof Ionicons.glyphMap; cor: string }> = {
    success: { icon: 'checkmark-circle', cor: '#00C853' },
    error: { icon: 'close-circle', cor: '#F44336' },
    warning: { icon: 'warning', cor: '#FF9800' },
    info: { icon: 'information-circle', cor: '#0082DE' },
  };
  const info = mapaTipo[toast.tipo || 'info'];

  const posicaoStyle = toast.posicao === 'top'
    ? { top: Platform.OS === 'ios' ? 50 : 20 + index * 80 }
    : { bottom: 40 + index * 80 };

  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={[styles.safeWrap, posicaoStyle]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: cores.fundoElevado,
            transform: [{ translateY }],
            opacity,
            ...Sombras.lg,
          },
        ]}
      >
        <View style={[styles.icone, { backgroundColor: info.cor + '20' }]}>
          <Ionicons name={info.icon} size={22} color={info.cor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: cores.textoPrincipal }]} numberOfLines={1}>
            {toast.titulo}
          </Text>
          {toast.descricao && (
            <Text style={[styles.descricao, { color: cores.textoSecundario }]} numberOfLines={2}>
              {toast.descricao}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={10}>
          <Ionicons name="close" size={18} color={cores.textoTerciario} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 12,
    maxWidth: W - 32,
    width: '100%',
  },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 14, fontWeight: '700' },
  descricao: { fontSize: 12, marginTop: 2 },
});

export default ToastProvider;