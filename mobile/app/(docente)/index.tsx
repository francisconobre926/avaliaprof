import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { EmptyState, SkeletonLoader, Chip } from '../../src/components/ui';
import { EstatisticasCard } from '../../src/components/professor/EstatisticasCard';
import { GraficoEvolucao } from '../../src/components/GraficoEvolucao';
import { StatTile } from '../../src/components/StatTile';
import { useCores } from '../../src/store/themeStore';
import { docenteService } from '../../service/docenteService';
import type { EstatisticasProfessor } from '../../src/types';
import type { FichaDocente } from '../../src/types/docente';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

/** Painel do docente: só dados reais do servidor; abaixo da amostra mínima mostra apenas a contagem. */
export default function PainelDocente() {
  const cores = useCores();
  const { width } = useWindowDimensions();
  const [ficha, setFicha] = useState<FichaDocente>();
  const [stats, setStats] = useState<EstatisticasProfessor>();
  const [cadeira, setCadeira] = useState<string>();
  const [erro, setErro] = useState<string>();
  const [aActualizar, setAActualizar] = useState(false);

  const carregar = useCallback(async (cad?: string) => {
    setErro(undefined);
    try {
      const [f, s] = await Promise.all([docenteService.ficha(), docenteService.estatisticas(cad)]);
      setFicha(f); setStats(s);
    } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(cadeira); }, [carregar, cadeira]));

  const maxDist = stats?.suficiente ? Math.max(1, ...Object.values(stats.distribuicao)) : 1;
  const caixa = [styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }];
  const titulo = (t: string) => <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} accessibilityRole="header">{t}</Text>;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Painel" />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar de novo" onCtaPress={() => carregar(cadeira)} />
      ) : !ficha || !stats ? (
        <View style={{ padding: Spacing.base }}><SkeletonLoader variant="card" height={160} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={async () => { setAActualizar(true); await carregar(cadeira); setAActualizar(false); }} />}
        >
          <Text style={[Typography.h2, { color: cores.textoPrincipal }]}>{ficha.nome}</Text>
          <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>{ficha.departamento}</Text>

          {ficha.cadeiras.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Todas as cadeiras" seleccionado={!cadeira} onPress={() => setCadeira(undefined)} />
              {ficha.cadeiras.map(c => <Chip key={c.id} label={c.nome} seleccionado={cadeira === c.id} onPress={() => setCadeira(c.id)} />)}
            </ScrollView>
          )}

          <View style={styles.tiles}>
            <StatTile valor={stats.total} rotulo={stats.total === 1 ? 'avaliação' : 'avaliações'} />
            <StatTile valor={stats.suficiente ? stats.media.toFixed(1).replace('.', ',') : '—'} rotulo="média geral" />
          </View>

          <EstatisticasCard stats={stats} />

          {stats.suficiente && (
            <>
              {titulo('Distribuição das classificações')}
              <View style={[...caixa, { gap: Spacing.sm }]}>
                {(['5', '4', '3', '2', '1'] as const).map(n => (
                  <View key={n} style={styles.distLinha} accessible accessibilityLabel={`${n} estrelas: ${stats.distribuicao[n]} avaliações`}>
                    <Text style={[Typography.bodySmall, { color: cores.textoSecundario, width: 38 }]}>{n} ★</Text>
                    <View style={[styles.trilho, { backgroundColor: cores.fundoSuave }]}>
                      <View style={[styles.barra, { width: `${(stats.distribuicao[n] / maxDist) * 100}%`, backgroundColor: cores.principal }]} />
                    </View>
                    <Text style={[Typography.bodySmall, { color: cores.textoPrincipal, width: 28, textAlign: 'right' }]}>{stats.distribuicao[n]}</Text>
                  </View>
                ))}
              </View>
              {titulo('Evolução por semestre')}
              <View style={caixa}>
                <GraficoEvolucao pontos={stats.evolucao} largura={width - Spacing.base * 2 - Spacing.md * 2} />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },
  chips: { gap: Spacing.sm },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  cartao: { padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
  distLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trilho: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barra: { height: 8, borderRadius: 4 },
});
