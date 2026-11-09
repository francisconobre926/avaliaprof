/**
 * src/components/TopBar.tsx
 *
 * Barra de topo única da app: clara, baixa (48 dp) e discreta.
 *
 *   <TopBar />                                  → logo + sino
 *   <TopBar acoes={<TopBarBotao icone="add" … />} />
 *   <TopBar titulo="Editar perfil" onVoltar={router.back} />
 *
 * Fundo da própria app, linha fina por baixo, ícones em carvão. O azul fica
 * reservado ao logo e aos elementos interativos. Segue o tema claro/escuro.
 */
import { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../store/themeStore';
import { Spacing } from '../theme/typography';
import { Fonte } from '../theme/fonts';

export const TOPBAR_ALTURA = 48;

type NomeIcone = keyof typeof Ionicons.glyphMap;

interface TopBarBotaoProps {
  icone: NomeIcone;
  onPress?: () => void;
  rotulo: string;
  /** Mostra um ponto indicador (ex.: há notificações por ler). */
  ponto?: boolean;
}

/** Botão de ação só com ícone, área de toque de 40 dp. */
export function TopBarBotao({ icone, onPress, rotulo, ponto }: TopBarBotaoProps) {
  const cores = useCores();
  return (
    <TouchableOpacity
      style={styles.botao}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
    >
      <Ionicons name={icone} size={22} color={cores.textoPrincipal} />
      {ponto && <View style={[styles.ponto, { backgroundColor: cores.erro, borderColor: cores.fundo }]} />}
    </TouchableOpacity>
  );
}

interface TopBarProps {
  /** Título de ecrã secundário; quando omitido mostra o logo. */
  titulo?: string;
  /** Mostra a seta de voltar à esquerda. */
  onVoltar?: () => void;
  /** Ações à direita. Por omissão, o sino de notificações. */
  acoes?: ReactNode;
  onNotificacoes?: () => void;
  temNotificacoes?: boolean;
  /** Mantido por compatibilidade: a linha inferior é sempre apresentada. */
  comLinha?: boolean;
}

export default function TopBar({ titulo, onVoltar, acoes, onNotificacoes, temNotificacoes }: TopBarProps) {
  const router = useRouter();
  const cores = useCores();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safe, { backgroundColor: cores.fundo, borderBottomColor: cores.bordaSubtil }]}
    >
      <StatusBar barStyle={cores.ehEscuro ? 'light-content' : 'dark-content'} backgroundColor={cores.fundo} />
      <View style={styles.barra}>
        <View style={styles.esquerda}>
          {onVoltar && (
            <TouchableOpacity
              onPress={onVoltar}
              style={styles.voltar}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Ionicons name="chevron-back" size={24} color={cores.textoPrincipal} />
            </TouchableOpacity>
          )}
          {titulo ? (
            <Text style={[styles.titulo, { color: cores.textoPrincipal }]} numberOfLines={1} accessibilityRole="header">
              {titulo}
            </Text>
          ) : (
            <Text style={styles.logo} accessibilityRole="header" accessibilityLabel="GoHome">
              <Text style={{ color: cores.textoPrincipal }}>Go</Text>
              <Text style={{ color: cores.principal }}>Home</Text>
            </Text>
          )}
        </View>
        <View style={styles.direita}>
          {acoes ?? (
            <TopBarBotao
              icone="notifications-outline"
              rotulo="Notificações"
              onPress={onNotificacoes ?? (() => router.push('/avisos' as any))}
              ponto={temNotificacoes}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { zIndex: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  barra: {
    height: TOPBAR_ALTURA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  esquerda: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 2 },
  direita: { flexDirection: 'row', alignItems: 'center' },
  voltar: { marginLeft: -8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 20, fontFamily: Fonte.tituloBold, letterSpacing: -0.3 },
  titulo: { fontSize: 16, fontFamily: Fonte.tituloSemi, flex: 1 },
  botao: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  ponto: { position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
});
