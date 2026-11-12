import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { Button, Chip, EmptyState, Input, SkeletonLoader, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { docenteService } from '../../service/docenteService';
import type { CadeiraDocente, ComentarioDocente } from '../../src/types/docente';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

/** Comentários públicos (sem autor nem data) e a resposta do docente, também pública. */
export default function ComentariosDocente() {
  const cores = useCores();
  const toast = useToast();
  const [cadeiras, setCadeiras] = useState<CadeiraDocente[]>([]);
  const [cadeira, setCadeira] = useState<string>();
  const [itens, setItens] = useState<ComentarioDocente[]>();
  const [pagina, setPagina] = useState(0);
  const [mais, setMais] = useState(false);
  const [aCarregarMais, setACarregarMais] = useState(false);
  const [erro, setErro] = useState<string>();
  const [aEditar, setAEditar] = useState<string>();
  const [texto, setTexto] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  const carregar = useCallback(async (cad?: string) => {
    setErro(undefined);
    try {
      const [f, r] = await Promise.all([docenteService.ficha(), docenteService.comentarios(0, cad)]);
      setCadeiras(f.cadeiras); setItens(r.itens); setPagina(0); setMais(r.maisPaginas);
    } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(cadeira); }, [carregar, cadeira]));

  const carregarMais = async () => {
    if (!mais || aCarregarMais || !itens) return;
    setACarregarMais(true);
    try {
      const r = await docenteService.comentarios(pagina + 1, cadeira);
      setItens([...itens, ...r.itens]); setPagina(pagina + 1); setMais(r.maisPaginas);
    } catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    setACarregarMais(false);
  };

  const guardar = async (c: ComentarioDocente) => {
    setAGuardar(true);
    try {
      await docenteService.responder(c.id, texto.trim());
      setItens(l => l?.map(x => (x.id === c.id ? { ...x, resposta: texto.trim() } : x)));
      setAEditar(undefined);
      toast.show({ tipo: 'success', titulo: 'Resposta publicada' });
    } catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    setAGuardar(false);
  };

  const apagar = (c: ComentarioDocente) =>
    Alert.alert('Apagar resposta', 'A resposta deixa de ser pública.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: async () => {
          try { await docenteService.apagarResposta(c.id); setItens(l => l?.map(x => (x.id === c.id ? { ...x, resposta: null } : x))); }
          catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
        },
      },
    ]);

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Comentários" />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar de novo" onCtaPress={() => carregar(cadeira)} />
      ) : !itens ? (
        <View style={{ padding: Spacing.base }}><SkeletonLoader variant="card" height={110} /></View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.lista}
          onEndReached={carregarMais}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={cadeiras.length > 1 ? (
            <View style={styles.chips}>
              <Chip label="Todas" seleccionado={!cadeira} onPress={() => setCadeira(undefined)} />
              {cadeiras.map(c => <Chip key={c.id} label={c.nome} seleccionado={cadeira === c.id} onPress={() => setCadeira(c.id)} />)}
            </View>
          ) : undefined}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" titulo="Ainda sem comentários" descricao="Os comentários aprovados pela moderação aparecem aqui." />}
          ListFooterComponent={aCarregarMais ? <ActivityIndicator color={cores.principal} style={{ margin: Spacing.base }} /> : undefined}
          renderItem={({ item: c }) => (
            <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[Typography.meta, { color: cores.textoTerciario }]}>{c.cadeira} · {c.semestre}</Text>
              <Text style={[Typography.body, { color: cores.textoPrincipal }]}>{c.texto}</Text>
              {aEditar === c.id ? (
                <View style={{ gap: Spacing.sm }}>
                  <Input label="A tua resposta" value={texto} onChangeText={setTexto} multiline maxLength={500} />
                  <View style={styles.acoes}>
                    <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setAEditar(undefined)} />
                    <Button label="Publicar" size="sm" loading={aGuardar} disabled={texto.trim().length < 2} onPress={() => guardar(c)} />
                  </View>
                </View>
              ) : c.resposta ? (
                <View style={[styles.resposta, { backgroundColor: cores.fundoSuave }]}>
                  <Text style={[Typography.meta, { color: cores.textoSecundario }]}>A tua resposta</Text>
                  <Text style={[Typography.bodySmall, { color: cores.textoPrincipal }]}>{c.resposta}</Text>
                  <View style={styles.acoes}>
                    <Button label="Editar" variant="ghost" size="sm" onPress={() => { setTexto(c.resposta ?? ''); setAEditar(c.id); }} />
                    <Button label="Apagar" variant="ghost" size="sm" onPress={() => apagar(c)} />
                  </View>
                </View>
              ) : (
                <Button label="Responder" variant="outline" size="sm" icon="return-down-forward-outline" onPress={() => { setTexto(''); setAEditar(c.id); }} />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  lista: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  cartao: { padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg },
  resposta: { padding: Spacing.sm, gap: 4, borderRadius: Radius.md },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.xs },
});
