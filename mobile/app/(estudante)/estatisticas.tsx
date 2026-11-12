import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import TopBar from '../../src/components/TopBar';
import { BarrasCriterios } from '../../src/components/BarrasCriterios';
import { GraficoEvolucao } from '../../src/components/GraficoEvolucao';
import { LinhaDocente } from '../../src/components/LinhaDocente';
import { SeletorOpcoes } from '../../src/components/SeletorOpcoes';
import { Chip, EmptyState, SkeletonLoader } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { painelService, type FiltrosEstatisticas } from '../../service/painelService';
import type { OpcoesEstatisticas, Ranking, VisaoGeral } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

type Filtro = 'cursoId' | 'cadeiraId' | 'semestreId';
const ROTULOS: Record<Filtro, string> = { cursoId: 'Curso', cadeiraId: 'Cadeira', semestreId: 'Semestre' };

/** Rankings e estatísticas de todos os docentes, com os filtros curso, cadeira e semestre. Dados reais do servidor. */
export default function Estatisticas() {
  const { t } = useTranslation();
  const router = useRouter();
  const cores = useCores();
  const { width } = useWindowDimensions();
  const [opcoes, setOpcoes] = useState<OpcoesEstatisticas>();
  const [filtros, setFiltros] = useState<FiltrosEstatisticas>({});
  const [seletor, setSeletor] = useState<Filtro | null>(null);
  const [ranking, setRanking] = useState<Ranking>();
  const [geral, setGeral] = useState<VisaoGeral>();
  const [erro, setErro] = useState<string>();
  const [aActualizar, setAActualizar] = useState(false);

  useEffect(() => { painelService.opcoes().then(setOpcoes).catch(() => {}); }, []);

  const carregar = useCallback(async () => {
    setErro(undefined);
    try {
      const [r, g] = await Promise.all([painelService.ranking(filtros), painelService.visaoGeral(filtros)]);
      setRanking(r);
      setGeral(g);
    } catch (e) { setErro(mensagemErro(e)); }
  }, [filtros]);
  useEffect(() => { setRanking(undefined); setGeral(undefined); carregar(); }, [carregar]);

  const opcoesDe = (f: Filtro) =>
    f === 'cursoId' ? (opcoes?.cursos ?? []).map(c => ({ id: c.id, rotulo: c.nome }))
    : f === 'semestreId' ? (opcoes?.semestres ?? []).map(s => ({ id: s.id, rotulo: s.corrente ? `${s.rotulo} (corrente)` : s.rotulo }))
    : (opcoes?.cadeiras ?? []).filter(c => !filtros.cursoId || c.cursoIds.includes(filtros.cursoId)).map(c => ({ id: c.id, rotulo: c.nome }));
  const rotuloActivo = (f: Filtro) => opcoesDe(f).find(o => o.id === filtros[f])?.rotulo;
  const nFiltros = Object.values(filtros).filter(Boolean).length;
  const larguraGrafico = useMemo(() => width - 2 * Spacing.base - 2 * Spacing.md - 2, [width]);
  const caixa = [styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }];
  const titulo = (txt: string) => <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]} accessibilityRole="header">{txt}</Text>;
  const abrir = (id: string) => router.push({ pathname: '/professor/[id]', params: { id } });

  const aCarregar = !ranking || !geral;
  const maxDistribuicao = geral?.suficiente ? Math.max(1, ...Object.values(geral.distribuicao)) : 1;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={t('estatisticas.titulo')} />
      <View style={styles.filtros}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(Object.keys(ROTULOS) as Filtro[]).map(f => (
            <Chip
              key={f}
              label={filtros[f] ? (rotuloActivo(f) ?? ROTULOS[f]) : ROTULOS[f]}
              seleccionado={!!filtros[f]}
              icon={filtros[f] ? undefined : 'chevron-down'}
              onPress={() => setSeletor(f)}
              onRemove={filtros[f] ? () => setFiltros(p => ({ ...p, [f]: undefined })) : undefined}
            />
          ))}
          {nFiltros > 1 && <Chip label="Limpar tudo" onPress={() => setFiltros({})} />}
        </ScrollView>
      </View>

      {erro && aCarregar ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : aCarregar ? (
        <View style={styles.conteudo}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={120} radius={Radius.lg} />)}</View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={async () => { setAActualizar(true); await carregar(); setAActualizar(false); }} tintColor={cores.principal} />}
        >
          {titulo('Docentes mais bem avaliados')}
          {ranking.itens.length === 0 ? (
            <View style={caixa}>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                {nFiltros ? 'Nenhum docente tem avaliações suficientes com estes filtros.' : 'Ainda não há docentes com avaliações suficientes.'} Os rankings só incluem docentes com pelo menos {ranking.minimo} avaliações, para proteger o anonimato.
              </Text>
            </View>
          ) : (
            <>
              {ranking.itens.map(i => (
                <LinhaDocente key={i.docente.id} posicao={i.posicao} nome={i.docente.nome} departamento={i.docente.departamento} fotoUrl={i.docente.fotoUrl} media={i.media} total={i.total} onPress={() => abrir(i.docente.id)} />
              ))}
              {ranking.ocultos > 0 && (
                <Text style={[Typography.caption, { color: cores.textoTerciario }]}>
                  {ranking.ocultos} {ranking.ocultos === 1 ? 'docente ainda não aparece' : 'docentes ainda não aparecem'}: têm menos de {ranking.minimo} avaliações.
                </Text>
              )}
            </>
          )}

          {geral.suficiente ? (
            <>
              {titulo('Médias por critério')}
              <View style={caixa}>
                <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Média geral {geral.media.toFixed(1).replace('.', ',')} · {geral.total} avaliações</Text>
                <BarrasCriterios criterios={geral.criterios} />
              </View>

              {titulo('Evolução por semestre')}
              <View style={caixa}>
                <GraficoEvolucao pontos={geral.evolucao.map(e => ({ semestre: e.semestre, total: e.total, media: e.media }))} largura={larguraGrafico} />
              </View>

              {titulo('Distribuição das classificações')}
              <View style={[...caixa, { gap: Spacing.sm }]}>
                {(['5', '4', '3', '2', '1'] as const).map(n => (
                  <View key={n} style={styles.distLinha} accessible accessibilityLabel={`${n} estrelas: ${geral.distribuicao[n]} avaliações`}>
                    <Text style={[Typography.bodySmall, { color: cores.textoSecundario, width: 38 }]}>{n} ★</Text>
                    <View style={[styles.trilho, { backgroundColor: cores.fundoSuave }]}>
                      <View style={[styles.barra, { width: `${(geral.distribuicao[n] / maxDistribuicao) * 100}%`, backgroundColor: cores.principal }]} />
                    </View>
                    <Text style={[Typography.bodySmall, { color: cores.textoPrincipal, width: 28, textAlign: 'right' }]}>{geral.distribuicao[n]}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={caixa}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Estatísticas</Text>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                {geral.total === 0 ? 'Ainda não há avaliações' : `Há ${geral.total} ${geral.total === 1 ? 'avaliação' : 'avaliações'}`} {nFiltros ? 'com estes filtros' : ''}. Os gráficos só aparecem a partir de {geral.minimo} avaliações, para proteger o anonimato.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {seletor && (
        <SeletorOpcoes
          visivel
          titulo={ROTULOS[seletor]}
          opcoes={opcoesDe(seletor)}
          valor={filtros[seletor]}
          rotuloLimpar="Todos"
          onEscolher={id => setFiltros(p => ({ ...p, [seletor]: id, ...(seletor === 'cursoId' ? { cadeiraId: undefined } : {}) }))}
          onFechar={() => setSeletor(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  filtros: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md },
  chips: { gap: Spacing.sm, paddingVertical: 2 },
  conteudo: { padding: Spacing.base, gap: Spacing.md },
  cartao: { padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
  distLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trilho: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barra: { height: 8, borderRadius: 4 },
});
