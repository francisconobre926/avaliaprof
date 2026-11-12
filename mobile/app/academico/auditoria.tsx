import { useCallback, useState } from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { EmptyState, SkeletonLoader } from '../../src/components/ui';
import { Cartao, formatarData } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { EntradaAuditoria } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

export default function Auditoria() {
  const router = useRouter(); const cores = useCores();
  const [itens, setItens] = useState<EntradaAuditoria[]>(); const [pagina, setPagina] = useState(0); const [mais, setMais] = useState(false); const [erro, setErro] = useState<string>();
  const carregar = useCallback(async (p = 0) => {
    setErro(undefined);
    try { const r = await adminPainelService.auditoria(p); setItens(o => (p === 0 ? r.items : [...(o ?? []), ...r.items])); setMais(r.hasMore); setPagina(p); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(0); }, [carregar]));
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Auditoria" onVoltar={() => router.back()} />
      {erro ? <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={() => carregar(0)} />
        : !itens ? <View style={styles.l}><SkeletonLoader variant="custom" height={64} radius={Radius.lg} /></View>
        : <FlatList data={itens} keyExtractor={a => a.id} contentContainerStyle={styles.l} onEndReached={() => mais && carregar(pagina + 1)}
          ListEmptyComponent={<EmptyState icon="list-outline" titulo="Sem registos" descricao="Ainda não há acções registadas." />}
          renderItem={({ item: a }) => (
            <Cartao>
              <Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>{a.action.replace(/_/g, ' ').toLowerCase()}</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{a.entity} · por {a.actor}</Text>
              <Text style={[Typography.caption, { color: cores.textoTerciario }]}>{formatarData(a.createdAt)}</Text>
            </Cartao>)} />}
    </View>
  );
}
const styles = StyleSheet.create({ l: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 } });
