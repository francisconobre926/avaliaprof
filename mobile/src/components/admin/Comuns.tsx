import { ReactNode } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../store/themeStore';
import { Radius, Spacing, Typography } from '../../theme/typography';

/** Cartão simples de lista. */
export function Cartao({ children, onPress, rotulo }: { children: ReactNode; onPress?: () => void; rotulo?: string }) {
  const cores = useCores();
  const estilo = [styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }];
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={rotulo} style={estilo}>{children}</TouchableOpacity>
    : <View style={estilo}>{children}</View>;
}

/** Controlo segmentado (2-3 opções). */
export function Segmentos<T extends string>({ opcoes, valor, onChange }: { opcoes: { id: T; rotulo: string }[]; valor: T; onChange: (v: T) => void }) {
  const cores = useCores();
  return (
    <View style={[styles.seg, { backgroundColor: cores.fundoSuave }]}>
      {opcoes.map(o => (
        <TouchableOpacity key={o.id} onPress={() => onChange(o.id)} accessibilityRole="button" accessibilityState={{ selected: o.id === valor }}
          style={[styles.segItem, o.id === valor && { backgroundColor: cores.fundoElevado }]}>
          <Text style={[Typography.bodyBold, { color: o.id === valor ? cores.textoPrincipal : cores.textoSecundario }]}>{o.rotulo}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function LinhaMenu({ icone, titulo, descricao, onPress }: { icone: keyof typeof Ionicons.glyphMap; titulo: string; descricao?: string; onPress: () => void }) {
  const cores = useCores();
  return (
    <Cartao onPress={onPress} rotulo={titulo}>
      <View style={styles.linha}>
        <Ionicons name={icone} size={22} color={cores.principalTexto} />
        <View style={{ flex: 1 }}>
          <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{titulo}</Text>
          {descricao ? <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{descricao}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
      </View>
    </Cartao>
  );
}

export const formatarData = (iso: string) => {
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const styles = StyleSheet.create({
  cartao: { padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg, gap: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  seg: { flexDirection: 'row', padding: 3, borderRadius: Radius.lg, gap: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: Radius.md },
});
