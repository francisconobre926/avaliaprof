import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../src/components/TopBar';
import { Estrelas } from '../src/components/Estrelas';
import { Badge, Button, EmptyState, SkeletonLoader, useToast } from '../src/components/ui';
import { EstadoSincronizacao } from '../src/components/EstadoSincronizacao';
import { useSincronizacao } from '../src/hooks/useSincronizacao';
import { useOfflineStore } from '../src/offline/estado';
import { outbox } from '../src/offline/outbox';
import { sincronizarSeOnline } from '../src/offline/rede';
import { useUserStore } from '../src/store/userStore';
import { ErroServico } from '../service/erro';
import { useCores } from '../src/store/themeStore';
import { avaliacaoService } from '../service/avaliacaoService';
import type { Avaliacao, EstadoComentario } from '../src/types';
import { mensagemErro } from '../src/utils/erros';
import { Typography, Spacing, Radius } from '../src/theme/typography';

const ESTADO: Record<EstadoComentario, { rotulo: string; cor: 'verde' | 'cinza' | 'vermelho' }> = {
  PUBLISHED: { rotulo: 'Comentário publicado', cor: 'verde' },
  PENDING_REVIEW: { rotulo: 'Comentário em análise', cor: 'cinza' },
  BLOCKED: { rotulo: 'Comentário não publicado', cor: 'vermelho' },
  HIDDEN: { rotulo: 'Comentário oculto', cor: 'cinza' },
  REMOVED: { rotulo: 'Comentário removido', cor: 'vermelho' },
};

export default function MinhasAvaliacoes() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [itens, setItens] = useState<Avaliacao[]>();
  const [erro, setErro] = useState<string>();
  const [aApagar, setAApagar] = useState<string>();
  const userId = useUserStore(st => st.utilizador?.id);
  const { pendentes, versaoDados } = useSincronizacao();
  const porEnviar = pendentes.filter(i => i.op === 'create');
  const comAlteracao = new Map(pendentes.filter(i => i.evaluationId).map(i => [i.evaluationId!, i.op]));

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setItens(await avaliacaoService.minhas()); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  // Uma sincronização aplicou resultados: volta a ler do servidor.
  useEffect(() => { if (versaoDados > 0) carregar(); }, [versaoDados, carregar]);

  const apagar = (a: Avaliacao) =>
    Alert.alert('Apagar avaliação', `Queres apagar a tua avaliação de ${a.professor.nome} em ${a.cadeira.nome}? Poderás avaliar de novo enquanto o período estiver aberto.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: async () => {
          setAApagar(a.id);
          const offline = async () => {
            if (!userId) return false;
            await outbox.apagar(userId, a.id, { professor: a.professor.nome, cadeira: a.cadeira.nome });
            sincronizarSeOnline();
            toast.show({ tipo: 'success', titulo: 'Remoção guardada; será enviada quando houver ligação.' });
            return true;
          };
          try {
            if (!useOfflineStore.getState().online && (await offline())) return;
            await avaliacaoService.apagar(a.id); toast.show({ tipo: 'success', titulo: 'Avaliação apagada' }); await carregar();
          }
          catch (e) {
            if (e instanceof ErroServico && e.codigo === 'SEM_REDE' && (await offline().catch(() => false))) return;
            toast.show({ tipo: 'error', titulo: mensagemErro(e) });
          }
          finally { setAApagar(undefined); }
        },
      },
    ]);

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="As minhas avaliações" onVoltar={() => router.back()} />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : !itens ? (
        <View style={styles.lista}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={120} radius={Radius.lg} />)}</View>
      ) : (
        <FlatList
          data={itens.filter(a => comAlteracao.get(a.id) !== 'delete')}
          keyExtractor={a => a.id}
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            <View style={{ gap: Spacing.sm }}>
              <EstadoSincronizacao />
              {porEnviar.map(i => (
                <View key={i.id} style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                  <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{i.payload.professor}</Text>
                  <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{i.payload.cadeira}</Text>
                  <Badge label="Por enviar" cor="cinza" />
                  <Text style={[Typography.caption, { color: cores.textoTerciario }]}>Guardada neste dispositivo. Será enviada quando houver ligação.</Text>
                </View>
              ))}
            </View>
          }
          ListEmptyComponent={
            porEnviar.length > 0 ? undefined : <EmptyState icon="star-outline" titulo="Ainda não avaliaste ninguém" descricao="Abre o perfil de um docente das tuas cadeiras para o avaliares." ctaLabel="Ver professores" onCtaPress={() => router.replace('/(estudante)/professores')} />
          }
          renderItem={({ item: a }) => (
            <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{a.professor.nome}</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{a.cadeira.nome} · {a.semestre.label}</Text>
              <View style={styles.linha}>
                <Estrelas valor={a.media} tamanho={16} rotulo="Média da avaliação" />
                <Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>{a.media.toFixed(1).replace('.', ',')}</Text>
              </View>
              {a.comentario && (
                <>
                  <Badge label={ESTADO[a.comentario.estado].rotulo} cor={ESTADO[a.comentario.estado].cor} />
                  <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]} numberOfLines={3}>{a.comentario.texto}</Text>
                </>
              )}
              {comAlteracao.get(a.id) === 'update' && <Badge label="Alteração por enviar" cor="cinza" />}
              {a.editavel ? (
                <View style={styles.linha}>
                  <Button label="Editar" size="sm" variant="outline" onPress={() => router.push({ pathname: '/avaliar', params: { professorNome: a.professor.nome, avaliacaoId: a.id, cadeira: a.cadeira.nome } })} />
                  <Button label="Apagar" size="sm" variant="ghost" loading={aApagar === a.id} onPress={() => apagar(a)} />
                </View>
              ) : (
                <Text style={[Typography.caption, { color: cores.textoTerciario }]}>Período encerrado: já não é possível editar nem apagar.</Text>
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
  lista: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
  cartao: { padding: Spacing.md, gap: 6, borderWidth: 1, borderRadius: Radius.lg, alignItems: 'flex-start' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
