import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { SeletorOpcoes } from '../../src/components/SeletorOpcoes';
import { Badge, Chip, EmptyState, SkeletonLoader } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { adminService } from '../../service/adminService';
import type { EstadoMatricula, EstudanteAdmin, OpcoesAcademicas } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius, Controlo } from '../../src/theme/typography';

type Filtro = 'cursoId' | 'turmaId' | 'estado';
interface Filtros { cursoId?: string; turmaId?: string; estado?: EstadoMatricula }
const ESTADOS = [{ id: 'ACTIVE', rotulo: 'Matrícula activa' }, { id: 'INACTIVE', rotulo: 'Matrícula inactiva' }];

export default function Estudantes() {
  const router = useRouter();
  const cores = useCores();
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState<Filtros>({});
  const [opcoes, setOpcoes] = useState<OpcoesAcademicas>();
  const [seletor, setSeletor] = useState<Filtro | null>(null);
  const [itens, setItens] = useState<EstudanteAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [aCarregar, setACarregar] = useState(true);
  const [aCarregarMais, setACarregarMais] = useState(false);
  const [erro, setErro] = useState<string>();
  const pedido = useRef(0);

  const corrente = opcoes?.semestres.find(s => s.corrente)?.id;
  const turmasDisponiveis = (opcoes?.turmas ?? []).filter(t => t.semestreId === corrente && (!filtros.cursoId || t.cursoId === filtros.cursoId));

  const carregar = useCallback(async (pg: number) => {
    const id = ++pedido.current;
    pg === 0 ? setACarregar(true) : setACarregarMais(true);
    setErro(undefined);
    try {
      const r = await adminService.listarEstudantes({ texto, ...filtros }, pg);
      if (id !== pedido.current) return;
      setItens(prev => (pg === 0 ? r.itens : [...prev, ...r.itens]));
      setTotal(r.total);
      setTemMais(r.temMais);
      setPagina(pg);
    } catch (e) {
      if (id === pedido.current) setErro(mensagemErro(e));
    } finally {
      if (id === pedido.current) { setACarregar(false); setACarregarMais(false); }
    }
  }, [texto, filtros]);

  // Pesquisa com debounce; filtros aplicam-se de imediato.
  useEffect(() => {
    const espera = setTimeout(() => carregar(0), 250);
    return () => clearTimeout(espera);
  }, [carregar]);

  // Ao voltar do formulário a lista e as opções (turmas novas) podem ter mudado.
  useFocusEffect(useCallback(() => {
    adminService.opcoes().then(setOpcoes).catch(() => {});
    carregar(0);
  }, [carregar]));

  const opcoesDe = (f: Filtro) =>
    f === 'cursoId' ? (opcoes?.cursos ?? []).map(c => ({ id: c.id, rotulo: c.nome }))
    : f === 'turmaId' ? turmasDisponiveis.map(t => ({ id: t.id, rotulo: `${opcoes?.cursos.find(c => c.id === t.cursoId)?.nome ?? ''} · ${t.ano}.º ano · ${t.nome}` }))
    : ESTADOS;
  const rotulo = (f: Filtro) => (f === 'cursoId' ? 'Curso' : f === 'turmaId' ? 'Turma' : 'Estado');
  const valorRotulo = (f: Filtro) => opcoesDe(f).find(o => o.id === filtros[f])?.rotulo;
  const activos = Object.values(filtros).filter(Boolean).length;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar
        titulo="Estudantes"
        acoes={<>
          <TopBarBotao icone="cloud-upload-outline" rotulo="Importar estudantes" onPress={() => router.push('/gestao/importar')} />
          <TopBarBotao icone="person-add-outline" rotulo="Novo estudante" onPress={() => router.push('/gestao/estudante')} />
        </>}
      />
      <View style={styles.pesquisa}>
        <View style={[styles.campo, { backgroundColor: cores.fundoSuave }]}>
          <Ionicons name="search" size={18} color={cores.textoTerciario} />
          <TextInput
            style={[Typography.body, styles.input, { color: cores.textoPrincipal }]}
            value={texto}
            onChangeText={setTexto}
            placeholder="Nome, número ou email"
            placeholderTextColor={cores.textoTerciario}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Pesquisar estudantes"
          />
          {texto.length > 0 && <Ionicons name="close-circle" size={18} color={cores.textoTerciario} onPress={() => setTexto('')} accessibilityLabel="Limpar pesquisa" />}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {(['cursoId', 'turmaId', 'estado'] as Filtro[]).map(f => (
            <Chip
              key={f}
              label={filtros[f] ? (valorRotulo(f) ?? rotulo(f)) : rotulo(f)}
              seleccionado={!!filtros[f]}
              icon={filtros[f] ? undefined : 'chevron-down'}
              onPress={() => setSeletor(f)}
              onRemove={filtros[f] ? () => setFiltros(p => ({ ...p, [f]: undefined })) : undefined}
            />
          ))}
          {activos > 1 && <Chip label="Limpar tudo" onPress={() => setFiltros({})} />}
        </ScrollView>
      </View>

      {aCarregar ? (
        <View style={styles.lista}>{[0, 1, 2, 3, 4].map(i => <SkeletonLoader key={i} variant="custom" height={88} radius={Radius.lg} />)}</View>
      ) : erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={() => carregar(0)} />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={e => e.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={itens.length ? <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{total} {total === 1 ? 'estudante' : 'estudantes'}</Text> : undefined}
          renderItem={({ item: e }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/gestao/estudante', params: { id: e.id } })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Estudante ${e.nome}`}
              style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
            >
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} numberOfLines={1}>{e.nome}</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>Nº {e.numero || '—'} · {e.email}</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>
                {e.matricula ? `${e.curso?.nome ?? ''} · ${e.matricula.ano}.º ano · Turma ${e.matricula.turma.nome}` : e.curso?.nome ?? 'Sem curso'}
              </Text>
              <View style={styles.badges}>
                {!e.matricula ? <Badge label="Sem matrícula" cor="cinza" />
                  : e.matricula.estado === 'ACTIVE' ? <Badge label="Matrícula activa" cor="verde" /> : <Badge label="Matrícula inactiva" cor="vermelho" />}
                {e.estadoConta === 'PENDING' && <Badge label="Conta por activar" cor="cinza" />}
                {e.estadoConta === 'SUSPENDED' && <Badge label="Conta suspensa" cor="vermelho" />}
              </View>
            </TouchableOpacity>
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (temMais && !aCarregarMais) carregar(pagina + 1); }}
          ListFooterComponent={aCarregarMais ? <ActivityIndicator style={{ margin: Spacing.base }} color={cores.principal} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              titulo={texto || activos ? 'Sem resultados' : 'Ainda não há estudantes'}
              descricao={texto || activos ? 'Nenhum estudante corresponde à pesquisa e aos filtros.' : 'Regista o primeiro estudante para começar.'}
              ctaLabel={texto || activos ? 'Limpar filtros' : 'Novo estudante'}
              onCtaPress={texto || activos ? () => { setTexto(''); setFiltros({}); } : () => router.push('/gestao/estudante')}
            />
          }
          keyboardShouldPersistTaps="handled"
        />
      )}

      {seletor && (
        <SeletorOpcoes
          visivel
          titulo={rotulo(seletor)}
          opcoes={opcoesDe(seletor)}
          valor={filtros[seletor]}
          rotuloLimpar="Todos"
          onEscolher={id => setFiltros(p => ({ ...p, [seletor]: id, ...(seletor === 'cursoId' ? { turmaId: undefined } : {}) } as Filtros))}
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
  cartao: { padding: Spacing.md, gap: 3, borderWidth: 1, borderRadius: Radius.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 4 },
});
