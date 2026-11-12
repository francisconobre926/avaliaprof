import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, View, StyleSheet } from 'react-native';
import TopBar from '../../src/components/TopBar';
import { Badge, Button, Chip, EmptyState, SkeletonLoader, useToast } from '../../src/components/ui';
import { Cartao, Segmentos } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { ComentarioMod, DenunciaMod } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

type Aba = 'comentarios' | 'denuncias';
const FILTROS = [{ id: 'PENDING_REVIEW', r: 'Em revisão' }, { id: 'BLOCKED', r: 'Bloqueados' }, { id: 'HIDDEN', r: 'Ocultos' }];
const MOTIVOS: Record<string, string> = { OFFENSIVE: 'Ofensivo', PERSONAL_DATA: 'Dados pessoais', SPAM: 'Repetição / spam', SERIOUS_ACCUSATION: 'Acusação grave' };

/** Moderação: o administrador vê o texto e o contexto, nunca o autor. */
export default function Moderacao() {
  const cores = useCores();
  const toast = useToast();
  const [aba, setAba] = useState<Aba>('comentarios');
  const [filtro, setFiltro] = useState('PENDING_REVIEW');
  const [coms, setComs] = useState<ComentarioMod[]>();
  const [dens, setDens] = useState<DenunciaMod[]>();
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [erro, setErro] = useState<string>();
  const [aTrabalhar, setATrabalhar] = useState<string>();

  const carregar = useCallback(async (p = 0) => {
    setErro(undefined);
    try {
      if (aba === 'comentarios') {
        const r = await adminPainelService.comentarios(filtro, p);
        setComs(old => (p === 0 ? r.items : [...(old ?? []), ...r.items])); setTemMais(r.hasMore);
      } else {
        const r = await adminPainelService.denuncias('OPEN', p);
        setDens(old => (p === 0 ? r.items : [...(old ?? []), ...r.items])); setTemMais(r.hasMore);
      }
      setPagina(p);
    } catch (e) { setErro(mensagemErro(e)); }
  }, [aba, filtro]);
  useEffect(() => { setComs(undefined); setDens(undefined); carregar(0); }, [carregar]);

  const executar = async (id: string, f: () => Promise<unknown>, ok: string) => {
    setATrabalhar(id);
    try { await f(); toast.show({ tipo: 'success', titulo: ok }); await carregar(0); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    setATrabalhar(undefined);
  };
  const confirmar = (titulo: string, msg: string, acao: () => void) =>
    Alert.alert(titulo, msg, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', style: 'destructive', onPress: acao }]);

  const lista = aba === 'comentarios' ? coms : dens;
  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Moderação" />
      <View style={styles.topo}>
        <Segmentos opcoes={[{ id: 'comentarios', rotulo: 'Comentários' }, { id: 'denuncias', rotulo: 'Denúncias' }]} valor={aba} onChange={setAba} />
        {aba === 'comentarios' && (
          <View style={styles.chips}>{FILTROS.map(f => <Chip key={f.id} label={f.r} seleccionado={filtro === f.id} onPress={() => setFiltro(f.id)} />)}</View>
        )}
      </View>
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={() => carregar(0)} />
      ) : !lista ? (
        <View style={styles.lista}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={110} radius={Radius.lg} />)}</View>
      ) : (
        <FlatList
          data={lista as (ComentarioMod | DenunciaMod)[]}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.lista}
          onEndReached={() => temMais && carregar(pagina + 1)}
          ListEmptyComponent={<EmptyState icon="shield-checkmark-outline" titulo="Nada para rever" descricao={aba === 'denuncias' ? 'Não há denúncias abertas.' : 'Não há comentários neste estado.'} />}
          renderItem={({ item }) => aba === 'comentarios' ? (() => {
            const c = item as ComentarioMod;
            return (
              <Cartao>
                <Text style={[Typography.body, { color: cores.textoPrincipal }]}>{c.text}</Text>
                <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{c.teacher} · {c.subject} · {c.semester}</Text>
                <View style={styles.chips}>
                  {c.reason ? <Badge label={MOTIVOS[c.reason] ?? c.reason} cor="laranja" /> : null}
                  {c.reports > 0 ? <Badge label={`${c.reports} denúncia(s)`} cor="vermelho" /> : null}
                </View>
                <View style={styles.acoes}>
                  <Button size="sm" label="Publicar" disabled={aTrabalhar === c.id || c.status === 'PUBLISHED'} onPress={() => executar(c.id, () => adminPainelService.definirComentario(c.id, 'PUBLISHED'), 'Comentário publicado')} />
                  <Button size="sm" variant="outline" label="Ocultar" disabled={aTrabalhar === c.id || c.status === 'HIDDEN'} onPress={() => executar(c.id, () => adminPainelService.definirComentario(c.id, 'HIDDEN'), 'Comentário ocultado')} />
                  <Button size="sm" variant="danger" label="Remover" disabled={aTrabalhar === c.id} onPress={() => confirmar('Remover comentário', 'O comentário deixa de ser visível. Continuar?', () => executar(c.id, () => adminPainelService.definirComentario(c.id, 'REMOVED'), 'Comentário removido'))} />
                </View>
              </Cartao>
            );
          })() : (() => {
            const r = item as DenunciaMod;
            return (
              <Cartao>
                <Text style={[Typography.body, { color: cores.textoPrincipal }]}>{r.comment.text}</Text>
                <Text style={[Typography.meta, { color: cores.textoSecundario }]}>Sobre {r.comment.teacher}</Text>
                <Text style={[Typography.bodySmall, { color: cores.erro }]}>Motivo da denúncia: {r.reason}</Text>
                <View style={styles.acoes}>
                  <Button size="sm" variant="danger" label="Ocultar e resolver" disabled={aTrabalhar === r.id} onPress={() => confirmar('Ocultar comentário', 'O comentário fica oculto e a denúncia resolvida.', () => executar(r.id, () => adminPainelService.resolverDenuncia(r.id, 'RESOLVED', true), 'Denúncia resolvida'))} />
                  <Button size="sm" variant="outline" label="Manter" disabled={aTrabalhar === r.id} onPress={() => executar(r.id, () => adminPainelService.resolverDenuncia(r.id, 'DISMISSED'), 'Denúncia rejeitada')} />
                </View>
              </Cartao>
            );
          })()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  topo: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, gap: Spacing.sm },
  lista: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
