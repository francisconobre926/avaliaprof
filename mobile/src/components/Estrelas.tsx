import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../store/themeStore';

interface Props {
  valor: number;
  /** Sem `onChange` as estrelas são só de leitura. */
  onChange?: (v: number) => void;
  tamanho?: number;
  rotulo?: string;
}

/** Classificação de 1 a 5 estrelas. Editável com toque; acessível como controlo de ajuste. */
export function Estrelas({ valor, onChange, tamanho = 22, rotulo }: Props) {
  const cores = useCores();
  const arredondado = Math.round(valor);
  return (
    <View
      style={styles.linha}
      accessible
      accessibilityRole={onChange ? 'adjustable' : 'image'}
      accessibilityLabel={`${rotulo ? rotulo + ': ' : ''}${valor ? `${arredondado} de 5 estrelas` : 'sem classificação'}`}
      accessibilityValue={{ min: 0, max: 5, now: arredondado }}
      onAccessibilityAction={e => {
        if (!onChange) return;
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, arredondado + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(1, arredondado - 1));
      }}
      accessibilityActions={onChange ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
    >
      {[1, 2, 3, 4, 5].map(n => {
        const icone = <Ionicons name={n <= arredondado ? 'star' : 'star-outline'} size={tamanho} color={n <= arredondado ? cores.principal : cores.textoTerciario} />;
        return onChange ? (
          <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }} accessible={false}>
            {icone}
          </TouchableOpacity>
        ) : (
          <View key={n}>{icone}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ linha: { flexDirection: 'row', gap: 6, alignItems: 'center' } });
