import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Marca } from './Marca';
import { useCores } from '../store/themeStore';
import { Typography, Spacing, Radius } from '../theme/typography';

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  rodape?: ReactNode;
  /** Ecrã de entrada: marca grande e centrada. Nos restantes a marca é compacta, com seta de voltar. */
  destaque?: boolean;
  onVoltar?: () => void;
}

/** Estrutura comum dos ecrãs sem sessão: marca, título, formulário num cartão e rodapé. */
export function AuthLayout({ titulo, subtitulo, children, rodape, destaque, onVoltar }: Props) {
  const cores = useCores();
  return (
    <SafeAreaView style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <StatusBar style={cores.ehEscuro ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {destaque ? (
            <View style={styles.hero}>
              <Marca />
              <Text style={[Typography.body, { color: cores.textoSecundario, textAlign: 'center' }]}>
                Avaliação de docentes pelos estudantes, de forma anónima e justa.
              </Text>
            </View>
          ) : (
            <View style={styles.topo}>
              {onVoltar && (
                <TouchableOpacity onPress={onVoltar} style={styles.voltar} accessibilityRole="button" accessibilityLabel="Voltar">
                  <Ionicons name="chevron-back" size={24} color={cores.textoPrincipal} />
                </TouchableOpacity>
              )}
              <Marca compacta />
            </View>
          )}

          <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
            <View style={styles.cabecalho}>
              <Text style={[destaque ? Typography.h1 : Typography.displayMD, { color: cores.textoPrincipal }]} accessibilityRole="header">{titulo}</Text>
              {subtitulo && <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>{subtitulo}</Text>}
            </View>
            <View style={styles.form}>{children}</View>
          </View>

          {rodape}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Mensagem de erro do formulário, com ícone (o estado nunca depende só da cor). */
export function ErroFormulario({ mensagem }: { mensagem?: string }) {
  const cores = useCores();
  if (!mensagem) return null;
  return (
    <View style={[styles.erro, { borderColor: cores.erro }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={18} color={cores.erro} />
      <Text style={[Typography.bodySmall, { color: cores.erro, flex: 1 }]}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { flexGrow: 1, padding: Spacing.lg, gap: Spacing.xl, justifyContent: 'center' },
  hero: { alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.base },
  topo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  voltar: { width: 40, height: 40, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
  cartao: { borderWidth: 1, borderRadius: Radius.xxl, padding: Spacing.lg, gap: Spacing.lg },
  cabecalho: { gap: Spacing.xs },
  form: { gap: Spacing.base },
  erro: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
});
