import { Text, View, StyleSheet } from 'react-native';
import { BarrasCriterios } from '../BarrasCriterios';
import { Estrelas } from '../Estrelas';
import { useCores } from '../../store/themeStore';
import type { EstatisticasProfessor } from '../../types';
import { Typography, Spacing, Radius } from '../../theme/typography';

const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/** Médias reais do servidor. Com amostra insuficiente só mostra a contagem (protege o anonimato). */
export function EstatisticasCard({ stats }: { stats: EstatisticasProfessor }) {
  const cores = useCores();
  const caixa = [styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }];

  if (!stats.suficiente) {
    return (
      <View style={caixa}>
        <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Avaliações</Text>
        <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
          {stats.total === 0
            ? 'Ainda sem avaliações.'
            : `${stats.total} ${stats.total === 1 ? 'avaliação' : 'avaliações'}. As médias só aparecem a partir de ${stats.minimo} avaliações, para proteger o anonimato dos estudantes.`}
        </Text>
      </View>
    );
  }

  return (
    <View style={caixa}>
      <View style={styles.topo}>
        <Text style={[Typography.displayLG, { color: cores.textoPrincipal }]} accessibilityLabel={`Média geral ${fmt(stats.media)} em 5`}>
          {fmt(stats.media)}
        </Text>
        <View style={{ gap: 2 }}>
          <Estrelas valor={stats.media} tamanho={18} rotulo="Média geral" />
          <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{stats.total} avaliações</Text>
        </View>
      </View>
      <BarrasCriterios criterios={stats.criterios} />
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
  topo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trilho: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barra: { height: 6, borderRadius: 3 },
});
