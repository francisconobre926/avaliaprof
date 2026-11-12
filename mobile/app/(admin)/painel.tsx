import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { EmptyState, SkeletonLoader } from '../../src/components/ui';
import { Cartao, LinhaMenu } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { EstatisticasAdmin } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

const ROTULO_ESTADO: Record<string, string> = { PUBLISHED: 'Publicados', PENDING_REVIEW: 'Em revisão', BLOCKED: 'Bloqueados', HIDDEN: 'Ocultos', REMOVED: 'Removidos' };

function Numero({ valor, rotulo }: { valor: string | number; rotulo: string }) {
  const cores = useCores();
  return (
    <View style={[styles.numero, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text style={[Typography.h1, { color: cores.textoPrincipal }]}>{valor}</Text>
      <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{rotulo}</Text>
    </View>
  );
}

/** Estatísticas gerais da plataforma (dados reais; nada aqui identifica estudantes). */
export default function Painel() {
  const router = useRouter();
  const cores = useCores();
  const [d, setD] = useState<EstatisticasAdmin>();
  const [erro, setErro] = useState<string>();
  const [aAtualizar, setAAtualizar] = useState(false);

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setD(await adminPainelService.estatisticas()); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const max = Math.max(1, ...(d?.evaluationsPerSemester.map(s => s.count) ?? [1]));

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Painel" />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : !d ? (
        <View style={styles.conteudo}><SkeletonLoader variant="custom" height={120} radius={Radius.lg} /><SkeletonLoader variant="custom" height={160} radius={Radius.lg} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}
          refreshControl={<RefreshControl refreshing={aAtualizar} onRefresh={async () => { setAAtualizar(true); await carregar(); setAAtualizar(false); }} />}>
          <Text style={[Typography.meta, { color: cores.textoSecundario }]}>Semestre corrente: {d.currentSemester?.label ?? 'não definido'}</Text>
          <View style={styles.grelha}>
            <Numero valor={d.activeStudents} rotulo={`Estudantes activos (de ${d.students})`} />
            <Numero valor={d.teachers} rotulo="Docentes" />
            <Numero valor={d.evaluations} rotulo="Avaliações" />
            <Numero valor={`${d.participationRate}%`} rotulo="Participação" />
            <Numero valor={d.pendingComments} rotulo="Comentários a rever" />
            <Numero valor={d.openReports} rotulo="Denúncias abertas" />
          </View>
          <Cartao>
            <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Avaliações por semestre</Text>
            {d.evaluationsPerSemester.length === 0 ? <Text style={[Typography.meta, { color: cores.textoSecundario }]}>Ainda não há avaliações.</Text> : d.evaluationsPerSemester.map(s => (
              <View key={s.semester} style={styles.barraLinha} accessible accessibilityLabel={`${s.semester}: ${s.count} avaliações`}>
                <Text style={[Typography.meta, { color: cores.textoSecundario, width: 70 }]}>{s.semester}</Text>
                <View style={[styles.barraFundo, { backgroundColor: cores.fundoSuave }]}><View style={[styles.barra, { width: `${(s.count / max) * 100}%`, backgroundColor: cores.principalTexto }]} /></View>
                <Text style={[Typography.bodyBold, { color: cores.textoPrincipal, width: 36, textAlign: 'right' }]}>{s.count}</Text>
              </View>
            ))}
          </Cartao>
          <Cartao>
            <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Comentários por estado</Text>
            {Object.entries(ROTULO_ESTADO).map(([k, r]) => (
              <View key={k} style={styles.barraLinha}><Text style={[Typography.body, { color: cores.textoSecundario, flex: 1 }]}>{r}</Text><Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>{d.comments[k] ?? 0}</Text></View>
            ))}
          </Cartao>
          <Text style={[Typography.meta, { color: cores.textoSecundario }]}>
            {d.teachersWithEnoughEvaluations} docentes com avaliações suficientes (mínimo {d.minSample}) para mostrar médias.
          </Text>
          <LinhaMenu icone="shield-checkmark-outline" titulo="Moderação" descricao="Comentários e denúncias" onPress={() => router.push('/(admin)/moderacao')} />
          <LinhaMenu icone="list-outline" titulo="Auditoria" descricao="Registo de acções administrativas" onPress={() => router.push('/academico/auditoria')} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.md },
  grelha: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  numero: { flexBasis: '48%', flexGrow: 1, padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg, gap: 2 },
  barraLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barraFundo: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barra: { height: 10, borderRadius: 5 },
});
