import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import TopBar from '../../src/components/TopBar';
import { CardProfessor } from '../../src/components/CardProfessor';
import { SeletorOpcoes } from '../../src/components/SeletorOpcoes';
import { Chip, EmptyState, SkeletonLoader } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { catalogoService, type OpcoesFiltros } from '../../service/catalogoService';
import type { FiltrosProfessores, Professor } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius, Controlo } from '../../src/theme/typography';

type Filtro = 'cursoId' | 'departamentoId' | 'disciplinaId';
const ROTULOS: Record<Filtro, string> = { cursoId: 'Curso', departamentoId: 'Departamento', disciplinaId: 'Cadeira' };

export default function Professores() {
  const { t } = useTranslation();
  const router = useRouter();
  const cores = useCores();
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState<Omit<FiltrosProfessores, 'texto'>>({});
  const [opcoes, setOpcoes] = useState<OpcoesFiltros>({ cursos: [], departamentos: [], disciplinas: [] });
  const [seletor, setSeletor] = useState<Filtro | null>(null);
  const [itens, setItens] = useState<Professor[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [aCarregar, setACarregar] = useState(true);
  const [aCarregarMais, setACarregarMais] = useState(false);
  const [erro, setErro] = useState<string>();
  const pedido = useRef(0);

  useEffect(() => { catalogoService.opcoesFiltros().then(setOpcoes).catch(() => {}); }, []); // sem filtros a lista continua utilizável

  const carregar = useCallback(async (pg: number, f: FiltrosProfessores) => {
    const id = ++pedido.current;
    pg === 0 ? setACarregar(true) : setACarregarMais(true);
    setErro(undefined);
    try {
      const r = await catalogoService.listarProfessores(f, pg);
      if (id !== pedido.current) return; // resposta de uma pesquisa antiga
      setItens(prev => (pg === 0 ? r.itens : [...prev, ...r.itens]));
      setTotal(r.total);
      setTemMais(r.temMais);
      setPagina(pg);
    } catch (e) {
      if (id === pedido.current) setErro(mensagemErro(e));
    } finally {
      if (id === pedido.current) { setACarregar(false); setACarregarMais(false); }
    }
  }, []);

  // Pesquisa com debounce; filtros aplicam-se de imediato.
  useEffect(() => {
    const espera = setTimeout(() => carregar(0, { ...filtros, texto }), 250);
    return () => clearTimeout(espera);
  }, [texto, filtros, carregar]);

  const opcoesDe = (f: Filtro) =>
    f === 'cursoId' ? opcoes.cursos.map(c => ({ id: c.id, rotulo: c.nome }))
    : f === 'departamentoId' ? opcoes.departamentos.map(d => ({ id: d.id, rotulo: d.nome }))
    : opcoes.disciplinas
        .filter(d => (!filtros.cursoId || d.cursoIds.includes(filtros.cursoId)) && (!filtros.departamentoId || d.departamentoId === filtros.departamentoId))
        .map(d => ({ id: d.id, rotulo: d.nome }));

  const rotuloAtivo = (f: Filtro) => opcoesDe(f).find(o => o.id === filtros[f])?.rotulo ?? opcoes.disciplinas.find(d => d.id === filtros[f])?.nome;
  const nFiltros = Object.values(filtros).filter(Boolean).length;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={t('professores.titulo')} />

      <View style={styles.pesquisa}>
        <View style={[styles.campo, { backgroundColor: cores.fundoSuave }]}>
          <Ionicons name="search" size={18} color={cores.textoTerciario} />
          <TextInput
            style={[Typography.body, styles.input, { color: cores.textoPrincipal }]}
            value={texto}
            onChangeText={setTexto}
            placeholder={t('professores.pesquisar')}
            placeholderTextColor={cores.textoTerciario}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={t('professores.pesquisar')}
          />
          {texto.length > 0 && (
            <Ionicons name="close-circle" size={18} color={cores.textoTerciario} onPress={() => setTexto('')} accessibilityLabel="Limpar pesquisa" />
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(Object.keys(ROTULOS) as Filtro[]).filter(f => f !== 'cursoId' || opcoes.cursos.length > 1).map(f => (
            <Chip
              key={f}
              label={filtros[f] ? (rotuloAtivo(f) ?? ROTULOS[f]) : ROTULOS[f]}
              seleccionado={!!filtros[f]}
              icon={filtros[f] ? undefined : 'chevron-down'}
              onPress={() => setSeletor(f)}
              onRemove={filtros[f] ? () => setFiltros(p => ({ ...p, [f]: undefined })) : undefined}
            />
          ))}
          {nFiltros > 1 && <Chip label="Limpar tudo" onPress={() => setFiltros({})} />}
        </ScrollView>
      </View>

      {aCarregar ? (
        <View style={styles.lista}>
          {[0, 1, 2, 3, 4].map(i => <SkeletonLoader key={i} variant="custom" height={76} radius={Radius.lg} />)}
        </View>
      ) : erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={() => carregar(0, { ...filtros, texto })} />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={itens.length ? <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{total} {total === 1 ? 'docente' : 'docentes'} das tuas cadeiras</Text> : undefined}
          renderItem={({ item }) => <CardProfessor professor={item} onPress={() => router.push({ pathname: '/professor/[id]', params: { id: item.id } })} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (temMais && !aCarregarMais) carregar(pagina + 1, { ...filtros, texto }); }}
          ListFooterComponent={aCarregarMais ? <ActivityIndicator style={{ margin: Spacing.base }} color={cores.principal} /> : undefined}
          ListEmptyComponent={
            texto || nFiltros ? (
              <EmptyState
                icon="search-outline"
                titulo="Sem resultados"
                descricao="Nenhum dos teus docentes corresponde à pesquisa e aos filtros."
                ctaLabel="Limpar filtros"
                onCtaPress={() => { setTexto(''); setFiltros({}); }}
              />
            ) : (
              <EmptyState
                icon="school-outline"
                titulo="Ainda sem docentes"
                descricao="Aqui aparecem os docentes das cadeiras da tua matrícula neste semestre. Se ainda não vês nenhum, a tua matrícula pode não estar registada ou activa."
                ctaLabel="As minhas cadeiras"
                onCtaPress={() => router.push('/minhas-cadeiras')}
              />
            )
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {seletor && (
        <SeletorOpcoes
          visivel
          titulo={ROTULOS[seletor]}
          opcoes={opcoesDe(seletor)}
          valor={filtros[seletor]}
          rotuloLimpar="Todos"
          onEscolher={id => setFiltros(p => ({ ...p, [seletor]: id }))}
          onFechar={() => setSeletor(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  pesquisa: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, gap: Spacing.sm },
  campo: { height: Controlo.input, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.full, paddingHorizontal: Spacing.md },
  input: { flex: 1, paddingVertical: 0 },
  chips: { gap: Spacing.sm, paddingVertical: 2 },
  lista: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
});
