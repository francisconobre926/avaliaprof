import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopBar, { TopBarBotao } from '../src/components/TopBar';
import { EmptyState, SkeletonLoader, useToast } from '../src/components/ui';
import { useCores } from '../src/store/themeStore';
import { useUserStore } from '../src/store/userStore';
import { useNotificacoesStore } from '../src/store/notificacoesStore';
import { notificacoesService, type Notificacao } from '../service/notificacoesService';
import { mensagemErro } from '../src/utils/erros';
import { Typography, Spacing, Radius } from '../src/theme/typography';

type Icone = keyof typeof Ionicons.glyphMap;
const ICONES: Record<string, Icone> = {
  COMMENT_PUBLISHED: 'checkmark-circle-outline', COMMENT_BLOCKED: 'alert-circle-outline', COMMENT_PENDING: 'time-outline',
  COMMENT_HIDDEN: 'eye-off-outline', COMMENT_REMOVED: 'trash-outline', TEACHER_REPLY: 'chatbubble-ellipses-outline',
  REPORT_REVIEWED: 'flag-outline', PERIOD_OPEN: 'calendar-outline', PERIOD_CLOSING: 'hourglass-outline', TEACHER_STATS_READY: 'stats-chart-outline',
};

const quando = (iso: string) => new Date(iso).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });

/** Destino de cada notificação, conforme o papel (o servidor só diz o "ecrã" em código). */
function destino(ecra: string | null, papel?: string): string | null {
  if (!ecra) return null;
  if (papel === 'estudante') return ({ 'minhas-avaliacoes': '/minhas-avaliacoes', professores: '/(estudante)/professores', inicio: '/(estudante)' } as Record<string, string>)[ecra] ?? null;
  if (papel === 'docente') return ({ painel: '/(docente)', 'minhas-avaliacoes': '/(docente)/comentarios' } as Record<string, string>)[ecra] ?? null;
  return null;
}

export default function Notificacoes() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const papel = useUserStore(s => s.utilizador?.papel);
  const definir = useNotificacoesStore(s => s.definir);
  const [itens, setItens] = useState<Notificacao[]>();
  const [pagina, setPagina] = useState(0);
  const [mais, setMais] = useState(false);
  const [erro, setErro] = useState<string>();
  const [aActualizar, setAActualizar] = useState(false);

  const carregar = useCallback(async (p = 0) => {
    setErro(undefined);
    try {
      const r = await notificacoesService.listar(p);
      setItens(a => (p === 0 ? r.itens : [...(a ?? []), ...r.itens]));
      setPagina(p); setMais(r.maisPaginas); definir(r.porLer);
    } catch (e) { setErro(mensagemErro(e)); }
  }, [definir]);
  useFocusEffect(useCallback(() => { carregar(0); }, [carregar]));

  const abrir = async (n: Notificacao) => {
    if (!n.lida) {
      setItens(a => a?.map(x => (x.id === n.id ? { ...x, lida: true } : x)));
      try { definir(await notificacoesService.marcarLida(n.id)); } catch { /* volta a sincronizar na próxima abertura */ }
    }
    const d = destino(n.ecra, papel);
    if (d) router.push(d as never);
  };

  const todas = async () => {
    try { await notificacoesService.marcarTodas(); setItens(a => a?.map(x => ({ ...x, lida: true }))); definir(0); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
  };

  const haPorLer = itens?.some(n => !n.lida);

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Notificações" onVoltar={() => router.back()} acoes={haPorLer ? <TopBarBotao icone="checkmark-done" rotulo="Marcar todas como lidas" onPress={todas} /> : undefined} />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar de novo" onCtaPress={() => carregar(0)} />
      ) : !itens ? (
        <View style={styles.lista}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={76} radius={16} />)}</View>
      ) : (
        <FlatList
          data={itens}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.lista}
          refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={async () => { setAActualizar(true); await carregar(0); setAActualizar(false); }} />}
          ListEmptyComponent={<EmptyState icon="notifications-outline" titulo="Sem notificações" descricao="Quando houver novidades (períodos, comentários, respostas) aparecem aqui." />}
          onEndReached={() => { if (mais) carregar(pagina + 1); }}
          onEndReachedThreshold={0.4}
          renderItem={({ item: n }) => (
            <TouchableOpacity
              onPress={() => abrir(n)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${n.lida ? '' : 'Por ler. '}${n.titulo}. ${n.corpo}`}
              style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: n.lida ? cores.bordaSubtil : cores.principal }]}
            >
              <Ionicons name={ICONES[n.tipo] ?? 'notifications-outline'} size={22} color={n.lida ? cores.textoTerciario : cores.principalTexto} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{n.titulo}</Text>
                <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>{n.corpo}</Text>
                <Text style={[Typography.meta, { color: cores.textoTerciario }]}>{quando(n.criadaEm)}</Text>
              </View>
              {!n.lida && <View style={[styles.ponto, { backgroundColor: cores.principal }]} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  lista: { padding: Spacing.base, gap: Spacing.md },
  cartao: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.base, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'flex-start' },
  ponto: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
});
