import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Avatar } from './ui';
import { useCores } from '../store/themeStore';
import { Typography, Spacing, Radius } from '../theme/typography';

interface Props {
  nome: string;
  departamento: string;
  fotoUrl?: string | null;
  media: number;
  total: number;
  /** Posição num ranking (mostra o número à esquerda). */
  posicao?: number;
  onPress: () => void;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** Docente com a sua média e número de avaliações (destaques e ranking). */
export function LinhaDocente({ nome, departamento, fotoUrl, media, total, posicao, onPress }: Props) {
  const cores = useCores();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${posicao ? `${posicao}.º lugar, ` : ''}${nome}, ${departamento}, média ${fmt(media)} com ${total} avaliações`}
      style={[styles.linha, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
    >
      {posicao != null && <Text style={[Typography.h2, styles.posicao, { color: posicao <= 3 ? cores.principalTexto : cores.textoTerciario }]}>{posicao}</Text>}
      <Avatar nome={nome} foto={fotoUrl ?? undefined} tamanho="md" />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} numberOfLines={1}>{nome}</Text>
        <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>{departamento}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[Typography.h2, { color: cores.textoPrincipal }]}>{fmt(media)}</Text>
        <Text style={[Typography.caption, { color: cores.textoTerciario }]}>{total} {total === 1 ? 'avaliação' : 'avaliações'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
  posicao: { width: 22, textAlign: 'center' },
});
