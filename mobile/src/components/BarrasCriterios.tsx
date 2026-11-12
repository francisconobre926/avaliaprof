import { Text, View, StyleSheet } from 'react-native';
import { useCores } from '../store/themeStore';
import { CRITERIOS, type Notas } from '../types';
import { Typography, Spacing } from '../theme/typography';

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** Média de cada um dos cinco critérios, em barras horizontais (escala 0 a 5). */
export function BarrasCriterios({ criterios }: { criterios: Notas }) {
  const cores = useCores();
  return (
    <View style={{ gap: Spacing.sm }}>
      {CRITERIOS.map(c => {
        const v = criterios[c.chave];
        return (
          <View key={c.chave} style={{ gap: 4 }} accessible accessibilityLabel={`${c.rotulo}: ${fmt(v)} em 5`}>
            <View style={styles.linha}>
              <Text style={[Typography.bodySmall, { color: cores.textoPrincipal, flex: 1 }]}>{c.rotulo}</Text>
              <Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>{fmt(v)}</Text>
            </View>
            <View style={[styles.trilho, { backgroundColor: cores.fundoSuave }]}>
              <View style={[styles.barra, { width: `${(v / 5) * 100}%`, backgroundColor: cores.principal }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trilho: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barra: { height: 6, borderRadius: 3 },
});
