import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../src/components/TopBar';
import { Button, EmptyState, SkeletonLoader, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { adminService } from '../../service/adminService';
import type { CandidatoTurma } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius, Controlo } from '../../src/theme/typography';

/**
 * Escolher um ou vários estudantes para passar para a turma. Só aparecem estudantes do mesmo curso
 * com matrícula activa noutra turma; o servidor volta a validar tudo (tudo ou nada).
 */
export default function AdicionarATurma() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const turmaId = String(id);
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [texto, setTexto] = useState('');
  const [itens, setItens] = useState<CandidatoTurma[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [aCarregar, setACarregar] = useState(true);
  const [aCarregarMais, setACarregarMais] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();
  const pedido = useRef(0);

  const carregar = useCallback(async (pg: number) => {
    const n = ++pedido.current;
    pg === 0 ? setACarregar(true) : setACarregarMais(true);
    setErro(undefined);
    try {
      const r = await adminService.candidatosTurma(turmaId, texto, pg);
      if (n !== pedido.current) return;
      setItens(prev => (pg === 0 ? r.itens : [...prev, ...r.itens]));
      setTotal(r.total);
      setTemMais(r.temMais);
      setPagina(pg);
    } catch (e) {
      if (n === pedido.current) setErro(mensagemErro(e));
    } finally {
      if (n === pedido.current) { setACarregar(false); setACarregarMais(false); }
    }
  }, [turmaId, texto]);

  useEffect(() => {
    const espera = setTimeout(() => carregar(0), 250);
    return () => clearTimeout(espera);
  }, [carregar]);

  const alternar = (sid: string) =>
    setSeleccionados(prev => { const novo = new Set(prev); novo.has(sid) ? novo.delete(sid) : novo.add(sid); return novo; });

  const todosVisiveisMarcados = itens.length > 0 && itens.every(i => seleccionados.has(i.id));
  const alternarTodos = () =>
    setSeleccionados(prev => {
      const novo = new Set(prev);
      itens.forEach(i => (todosVisiveisMarcados ? novo.delete(i.id) : novo.add(i.id)));
      return novo;
    });

  const adicionar = async () => {
    setAGuardar(true);
    setErro(undefined);
    try {
      const n = await adminService.adicionarEstudantesATurma(turmaId, [...seleccionados]);
      toast.show({ tipo: 'success', titulo: n === 1 ? '1 estudante adicionado' : `${n} estudantes adicionados` });
      router.back();
    } catch (e) {
      setErro(mensagemErro(e));
      setAGuardar(false);
    }
  };

  const n = seleccionados.size;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Adicionar estudantes" onVoltar={() => router.back()} />
      <View style={styles.topo}>
        <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
          Estudantes do mesmo curso com matrícula activa noutra turma. Ao adicionar, passam para esta turma e as cadeiras ajustam-se ao ano da turma.
        </Text>
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
        {itens.length > 0 && (
          <TouchableOpacity onPress={alternarTodos} accessibilityRole="button" style={styles.todos}>
            <Ionicons name={todosVisiveisMarcados ? 'checkbox' : 'square-outline'} size={20} color={todosVisiveisMarcados ? cores.principal : cores.textoTerciario} />
            <Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>
              {todosVisiveisMarcados ? 'Desmarcar' : 'Seleccionar'} os {itens.length} visíveis
            </Text>
            <Text style={[Typography.meta, { color: cores.textoSecundario }]}>· {total} no total</Text>
          </TouchableOpacity>
        )}
      </View>

      {aCarregar ? (
        <View style={styles.lista}>{[0, 1, 2, 3].map(i => <SkeletonLoader key={i} variant="custom" height={68} radius={Radius.lg} />)}</View>
      ) : erro && itens.length === 0 ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={() => carregar(0)} />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          extraData={seleccionados}
          renderItem={({ item: i }) => {
            const marcado = seleccionados.has(i.id);
            return (
              <TouchableOpacity
                onPress={() => alternar(i.id)}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: marcado }}
                accessibilityLabel={`${i.nome}, número ${i.numero}, actualmente na turma ${i.turmaActual.nome} do ${i.turmaActual.ano}.º ano`}
                style={[styles.linha, { backgroundColor: cores.fundoElevado, borderColor: marcado ? cores.principal : cores.bordaSubtil }]}
              >
                <Ionicons name={marcado ? 'checkbox' : 'square-outline'} size={22} color={marcado ? cores.principal : cores.textoTerciario} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} numberOfLines={1}>{i.nome}</Text>
                  <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>
                    Nº {i.numero || '—'} · Agora: {i.turmaActual.ano}.º ano, turma {i.turmaActual.nome}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => { if (temMais && !aCarregarMais) carregar(pagina + 1); }}
          ListFooterComponent={aCarregarMais ? <ActivityIndicator style={{ margin: Spacing.base }} color={cores.principal} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              titulo={texto ? 'Sem resultados' : 'Ninguém para adicionar'}
              descricao={texto ? 'Nenhum estudante corresponde à pesquisa.' : 'Não há outros estudantes deste curso com matrícula activa neste semestre.'}
            />
          }
        />
      )}

      <View style={[styles.rodape, { borderTopColor: cores.bordaSubtil, backgroundColor: cores.fundoElevado }]}>
        {erro && itens.length > 0 && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erro}</Text>}
        <Button
          label={n === 0 ? 'Seleccionar estudantes' : n === 1 ? 'Adicionar 1 estudante' : `Adicionar ${n} estudantes`}
          onPress={adicionar}
          loading={aGuardar}
          disabled={n === 0}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  topo: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, gap: Spacing.sm },
  campo: { height: Controlo.input, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.full, paddingHorizontal: Spacing.md },
  input: { flex: 1, paddingVertical: 0 },
  todos: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  lista: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
  rodape: { padding: Spacing.base, gap: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
