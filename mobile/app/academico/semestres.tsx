import { useCallback, useState } from 'react';
import { Alert, FlatList, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { Badge, Button, EmptyState, SkeletonLoader, useToast } from '../../src/components/ui';
import { Cartao, formatarData } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { SemestreAdmin } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

export default function Semestres() {
  const router = useRouter(); const cores = useCores(); const toast = useToast();
  const [itens, setItens] = useState<SemestreAdmin[]>(); const [erro, setErro] = useState<string>();
  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setItens((await adminPainelService.semestres()).items); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const tornar = (s: SemestreAdmin) => Alert.alert('Semestre corrente', `Definir ${s.label} como semestre corrente? As matrículas, cadeiras e avaliações passam a seguir este semestre.`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', onPress: async () => {
      try { await adminPainelService.tornarCorrente(s.id); toast.show({ tipo: 'success', titulo: 'Semestre corrente actualizado' }); await carregar(); }
      catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    } },
  ]);
  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Semestres" onVoltar={() => router.back()} />
      {erro ? <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
        : !itens ? <View style={styles.l}><SkeletonLoader variant="custom" height={80} radius={Radius.lg} /></View>
        : <FlatList data={itens} keyExtractor={s => s.id} contentContainerStyle={styles.l} renderItem={({ item: s }) => (
          <Cartao>
            <View style={styles.h}><Text style={[Typography.tituloCard, { color: cores.textoPrincipal, flex: 1 }]}>{s.label}</Text>{s.isCurrent && <Badge label="Corrente" cor="verde" />}</View>
            <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{formatarData(s.startsAt).slice(0, 10)} → {formatarData(s.endsAt).slice(0, 10)}</Text>
            {!s.isCurrent && <Button size="sm" variant="outline" label="Tornar corrente" onPress={() => tornar(s)} />}
          </Cartao>)} />}
    </View>
  );
}
const styles = StyleSheet.create({ l: { padding: Spacing.base, gap: Spacing.sm }, h: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm } });
