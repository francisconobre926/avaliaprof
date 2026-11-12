import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { Badge, Button, EmptyState, SkeletonLoader } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { adminService } from '../../service/adminService';
import type { TurmaDetalhe } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

/** Uma turma e os seus estudantes. Daqui adicionam-se estudantes (um ou vários) do mesmo curso. */
export default function TurmaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cores = useCores();
  const [turma, setTurma] = useState<TurmaDetalhe>();
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setTurma(await adminService.detalheTurma(String(id))); } catch (e) { setErro(mensagemErro(e)); }
  }, [id]);
  // Recarrega ao voltar do ecrã de adicionar.
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const adicionar = () => router.push({ pathname: '/gestao/turma-adicionar', params: { id: String(id) } });

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={turma ? `Turma ${turma.nome}` : 'Turma'} onVoltar={() => router.back()} />
      {erro ? (
        <EmptyState icon="alert-circle-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : !turma ? (
        <View style={styles.lista}>{[0, 1, 2, 3].map(i => <SkeletonLoader key={i} variant="custom" height={72} radius={Radius.lg} />)}</View>
      ) : (
        <>
          <FlatList
            data={turma.estudantes}
            keyExtractor={e => e.id}
            contentContainerStyle={styles.lista}
            ListHeaderComponent={
              <View style={{ gap: Spacing.sm, marginBottom: Spacing.xs }}>
                <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                  <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{turma.curso.nome}</Text>
                  <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{turma.ano}.º ano · Semestre {turma.semestre.label}</Text>
                </View>
                <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Estudantes ({turma.estudantes.length})</Text>
              </View>
            }
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
                <View style={styles.badges}>
                  {e.estadoMatricula === 'ACTIVE' ? <Badge label="Matrícula activa" cor="verde" /> : <Badge label="Matrícula inactiva" cor="vermelho" />}
                  {e.estadoConta === 'PENDING' && <Badge label="Conta por activar" cor="cinza" />}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <EmptyState icon="people-outline" titulo="Turma sem estudantes" descricao="Adiciona estudantes do mesmo curso com matrícula activa." ctaLabel="Adicionar estudantes" onCtaPress={adicionar} />
            }
          />
          {turma.estudantes.length > 0 && (
            <View style={[styles.rodape, { borderTopColor: cores.bordaSubtil, backgroundColor: cores.fundoElevado }]}>
              <Button label="Adicionar estudantes" icon="person-add-outline" onPress={adicionar} fullWidth />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  lista: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 },
  cartao: { padding: Spacing.md, gap: 3, borderWidth: 1, borderRadius: Radius.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 4 },
  rodape: { padding: Spacing.base, borderTopWidth: StyleSheet.hairlineWidth },
});
