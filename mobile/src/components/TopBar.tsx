/**
 * src/components/TopBar.tsx
 *
 * Barra de topo única da app. Todos os ecrãs principais (tabs do
 * procurador e do anunciante) usam este componente, para que o topo
 * seja sempre igual: azul GoHome, 52px, logo à esquerda, acções à direita.
 *
 *   <TopBar />                                  → logo + sino
 *   <TopBar acoes={<TopBarBotao icone="add" … />} />
 *   <TopBar titulo="Editar perfil" onVoltar={router.back} />

 */
import { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/typography';
import { Fonte } from '../theme/fonts';

export const TOPBAR_COR = Colors.azul;
export const TOPBAR_ALTURA = 52;

type NomeIcone = keyof typeof Ionicons.glyphMap;

interface TopBarBotaoProps {
  icone: NomeIcone;
  onPress?: () => void;
  rotulo: string;
  /** Mostra um ponto laranja (ex.: há notificações por ler). */
  ponto?: boolean;
}

export function TopBarBotao({ icone, onPress, rotulo, ponto }: TopBarBotaoProps) {
  return (
    <TouchableOpacity
      style={styles.botao}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
    >
      <Ionicons name={icone} size={20} color="#FFFFFF" />
      {ponto && <View style={styles.ponto} />}
    </TouchableOpacity>
  );
}

interface TopBarProps {
  /** Título de ecrã secundário; quando omitido mostra o logo. */
  titulo?: string;
  /** Mostra a seta de voltar à esquerda. */
  onVoltar?: () => void;
  /** Acções à direita. Por omissão, o sino de notificações. */
  acoes?: ReactNode;
  onNotificacoes?: () => void;
  temNotificacoes?: boolean;
  /** Linha fina por baixo — útil quando o conteúdo já rolou. */
  comLinha?: boolean;
}

export default function TopBar({
  titulo,
  onVoltar,
  acoes,
  onNotificacoes,
  temNotificacoes,
  comLinha,
}: TopBarProps) {
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, comLinha && styles.comLinha]}>
      <StatusBar barStyle="light-content" backgroundColor={TOPBAR_COR} />
      <View style={styles.barra}>
        <View style={styles.esquerda}>
          {onVoltar && (
            <TouchableOpacity
              onPress={onVoltar}
              style={styles.voltar}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {titulo ? (
            <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
          ) : (
            <Text style={styles.logo} accessibilityRole="header" accessibilityLabel="GoHome">
              <Text style={styles.logoGo}>Go</Text>
              <Text style={styles.logoHome}>Home</Text>
            </Text>
          )}
        </View>
        <View style={styles.direita}>
          {acoes ?? (
            <TopBarBotao
              icone="notifications-outline"
              rotulo="Notificações"
              onPress={onNotificacoes}
              ponto={temNotificacoes}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: TOPBAR_COR, zIndex: 10 },
  comLinha: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.18)' },
  barra: {
    height: TOPBAR_ALTURA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  esquerda: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
  direita: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voltar: { marginLeft: -6, width: 32, height: 36, justifyContent: 'center' },
  logo: { fontSize: 22, fontFamily: Fonte.tituloBold, letterSpacing: -0.9 },
  logoGo: { color: '#FFFFFF' },
  logoHome: { color: Colors.laranja },
  titulo: { color: '#FFFFFF', fontSize: 17, fontFamily: Fonte.tituloSemi, letterSpacing: -0.3, flex: 1 },
  botao: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ponto: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.laranja,
    borderWidth: 1.5,
    borderColor: TOPBAR_COR,
  },
});
