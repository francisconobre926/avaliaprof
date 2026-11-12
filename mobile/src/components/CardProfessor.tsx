import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Avatar } from './ui';
import { useCores } from '../store/themeStore';
import type { Professor } from '../types';
import { Typography, Spacing, Radius } from '../theme/typography';

interface Props { professor: Professor; onPress: () => void }

/** Cartão compacto de professor para listagens. */
export function CardProfessor({ professor, onPress }: Props) {
  const cores = useCores();
  const n = professor.disciplinaIds.length;
  const total = professor.totalAvaliacoes;
  const nAval = `${total} ${total === 1 ? 'avaliação' : 'avaliações'}`;
  // A média só vem do servidor com amostra suficiente (anonimato); antes disso mostra-se só a contagem.
  const resumo = total === 0 ? 'Sem avaliações'
    : professor.mediaGeral == null ? nAval
    : `${professor.mediaGeral.toFixed(1).replace('.', ',')} ★ · ${nAval}`;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Professor ${professor.nome}`}
    >
      <Avatar nome={professor.nome} foto={professor.fotoUrl ?? undefined} tamanho="md" />
      <View style={styles.texto}>
        <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} numberOfLines={1}>{professor.nome}</Text>
        <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>
          {professor.departamentoNome}
        </Text>
        <Text style={[Typography.caption, { color: cores.textoTerciario }]}>
          {n} {n === 1 ? 'cadeira' : 'cadeiras'} · {resumo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  texto: { flex: 1, gap: 2 },
});
