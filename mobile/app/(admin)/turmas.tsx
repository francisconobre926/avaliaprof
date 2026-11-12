import { useCallback, useMemo, useState } from 'react';
import { Alert, SectionList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { EmptyState, SkeletonLoader, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { adminService } from '../../service/adminService';
import type { Semestre, TurmaAdmin } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

export default function Turmas() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [dados, setDados] = useState<{ semestre: Semestre; itens: TurmaAdmin[] }>();
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setDados(await adminService.listarTurmas()); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const seccoes = useMemo(() => {
    const mapa = new Map<string, { title: string; data: TurmaAdmin[] }>();
    dados?.itens.forEach(t => {
      const chave = `${t.curso.id}-${t.ano}`;
      mapa.set(chave, { title: `${t.curso.nome} · ${t.ano}.º ano`, data: [...(mapa.get(chave)?.data ?? []), t] });
    });
    return [...mapa.values()];
  }, [dados]);

  const apagar = (t: TurmaAdmin) =>
    Alert.alert('Apagar turma', `Apagar a turma ${t.nome} (${t.curso.nome}, ${t.ano}.º ano)?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: async () => {
          try { await adminService.apagarTurma(t.id); toast.show({ tipo: 'success', titulo: 'Turma apagada' }); await carregar(); }
          catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
        },
      },
    ]);

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Turmas" acoes={<TopBarBotao icone="add" rotulo="Nova turma" onPress={() => router.push('/gestao/turma')} />} />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : !dados ? (
        <View style={styles.lista}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={64} radius={Radius.lg} />)}</View>
      ) : (
        <SectionList
          sections={seccoes}
          keyExtractor={t => t.id}
          contentContainerStyle={styles.lista}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={<Text style={[Typography.meta, { color: cores.textoSecundario }]}>Semestre {dados.semestre.label}</Text>}
          renderSectionHeader={({ section }) => <Text style={[Typography.captionBold, { color: cores.textoTerciario, marginTop: Spacing.sm }]}>{section.title}</Text>}
          renderItem={({ item: t }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/gestao/turma-detalhe', params: { id: t.id } })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Turma ${t.nome}, ${t.estudantes} estudantes. Abrir`}
              style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Turma {t.nome}</Text>
                <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{t.estudantes} {t.estudantes === 1 ? 'estudante' : 'estudantes'}</Text>
              </View>
              <TouchableOpacity onPress={() => apagar(t)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Apagar turma ${t.nome}`}>
                <Ionicons name="trash-outline" size={20} color={cores.erro} />
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState icon="albums-outline" titulo="Ainda não há turmas" descricao="Cria uma turma por curso, ano curricular e semestre para poderes matricular estudantes." ctaLabel="Nova turma" onCtaPress={() => router.push('/gestao/turma')} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  lista: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
});
