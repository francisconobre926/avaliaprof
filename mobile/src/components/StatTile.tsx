import { Text, View, StyleSheet } from 'react-native';
import { useCores } from '../store/themeStore';
import { Typography, Spacing, Radius } from '../theme/typography';

/** Um número com legenda (resumo do início). */
export function StatTile({ valor, rotulo }: { valor: number | string; rotulo: string }) {
  const cores = useCores();
  return (
    <View
      style={[styles.tile, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
      accessible
      accessibilityLabel={`${rotulo}: ${valor}`}
    >
      <Text style={[Typography.displayMD, { color: cores.textoPrincipal }]}>{valor}</Text>
      <Text style={[Typography.caption, { color: cores.textoSecundario }]} numberOfLines={1}>{rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, padding: Spacing.md, gap: 2, borderWidth: 1, borderRadius: Radius.lg },
});
