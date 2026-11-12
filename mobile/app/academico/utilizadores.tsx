import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { Badge, Button, Chip, EmptyState, Input, SkeletonLoader, useToast } from '../../src/components/ui';
import { Cartao } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { UtilizadorAdmin } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

const PAPEIS = [{ id: undefined, r: 'Todos' }, { id: 'STUDENT', r: 'Estudantes' }, { id: 'TEACHER', r: 'Docentes' }, { id: 'ADMIN', r: 'Admins' }];
const COR = { ACTIVE: 'verde', PENDING: 'laranja', SUSPENDED: 'vermelho' } as const;
const ROTULO = { ACTIVE: 'Activa', PENDING: 'Pendente', SUSPENDED: 'Suspensa' } as const;

export default function Utilizadores() {
  const router = useRouter(); const cores = useCores(); const toast = useToast();
  const [papel, setPapel] = useState<string>(); const [texto, setTexto] = useState(''); const [q, setQ] = useState('');
  const [itens, setItens] = useState<UtilizadorAdmin[]>(); const [pagina, setPagina] = useState(0); const [mais, setMais] = useState(false); const [erro, setErro] = useState<string>();

  useEffect(() => { const t = setTimeout(() => setQ(texto.trim()), 350); return () => clearTimeout(t); }, [texto]);
  const carregar = useCallback(async (p = 0) => {
    setErro(undefined);
    try { const r = await adminPainelService.utilizadores({ role: papel, q }, p); setItens(o => (p === 0 ? r.items : [...(o ?? []), ...r.items])); setMais(r.hasMore); setPagina(p); } catch (e) { setErro(mensagemErro(e)); }
  }, [papel, q]);
  useEffect(() => { setItens(undefined); carregar(0); }, [carregar]);

  const alterar = (u: UtilizadorAdmin) => {
    const novo = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    Alert.alert(novo === 'SUSPENDED' ? 'Suspender conta' : 'Reactivar conta', `${u.name} (${u.email})`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: novo === 'SUSPENDED' ? 'destructive' : 'default', onPress: async () => {
        try { await adminPainelService.definirEstadoUtilizador(u.id, novo); toast.show({ tipo: 'success', titulo: novo === 'SUSPENDED' ? 'Conta suspensa' : 'Conta reactivada' }); await carregar(0); }
        catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
      } },
    ]);
  };
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Utilizadores" onVoltar={() => router.back()} />
      <View style={styles.topo}>
        <Input label="Pesquisar" value={texto} onChangeText={setTexto} placeholder="Nome ou email" autoCapitalize="none" />
        <View style={styles.chips}>{PAPEIS.map(p => <Chip key={p.r} label={p.r} seleccionado={papel === p.id} onPress={() => setPapel(p.id)} />)}</View>
      </View>
      {erro ? <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={() => carregar(0)} />
        : !itens ? <View style={styles.l}><SkeletonLoader variant="custom" height={80} radius={Radius.lg} /></View>
        : <FlatList data={itens} keyExtractor={u => u.id} contentContainerStyle={styles.l} onEndReached={() => mais && carregar(pagina + 1)} keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState icon="people-outline" titulo="Nenhum utilizador" descricao="Ajusta a pesquisa ou o filtro." />}
          renderItem={({ item: u }) => (
            <Cartao>
              <View style={styles.h}><Text style={[Typography.tituloCard, { color: cores.textoPrincipal, flex: 1 }]}>{u.name}</Text><Badge label={ROTULO[u.status]} cor={COR[u.status]} /></View>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{u.email}{u.studentNumber ? ` · ${u.studentNumber}` : ''} · {u.role === 'STUDENT' ? 'Estudante' : u.role === 'TEACHER' ? 'Docente' : 'Administrador'}</Text>
              {u.status !== 'PENDING' && <Button size="sm" variant={u.status === 'SUSPENDED' ? 'outline' : 'danger'} label={u.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'} onPress={() => alterar(u)} />}
            </Cartao>)} />}
    </View>
  );
}
const styles = StyleSheet.create({ topo: { padding: Spacing.base, gap: Spacing.sm }, l: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }, h: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm } });
