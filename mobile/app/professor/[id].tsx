import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { AvaliarSecao } from '../../src/components/professor/AvaliarSecao';
import { ComentariosLista } from '../../src/components/professor/ComentariosLista';
import { EstatisticasCard } from '../../src/components/professor/EstatisticasCard';
import { Avatar, EmptyState, SkeletonLoader } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { avaliacaoService } from '../../service/avaliacaoService';
import { catalogoService } from '../../service/catalogoService';
import type { DetalheProfessor, EstatisticasProfessor } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

export default function PerfilProfessor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cores = useCores();
  const papel = useUserStore(s => s.utilizador?.papel);
  const [detalhe, setDetalhe] = useState<DetalheProfessor>();
  const [stats, setStats] = useState<EstatisticasProfessor>();
  const [erro, setErro] = useState<string>();
  const [versao, setVersao] = useState(0);

  // Recarrega ao voltar do formulário: as médias e os comentários podem ter mudado.
  useFocusEffect(useCallback(() => {
    const prof = String(id);
    catalogoService.obterProfessor(prof).then(setDetalhe).catch(e => setErro(mensagemErro(e)));
    avaliacaoService.estatisticas(prof).then(setStats).catch(() => setStats(undefined));
    setVersao(v => v + 1);
  }, [id]));

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Professor" onVoltar={() => router.back()} />
      {erro ? (
        <EmptyState icon="alert-circle-outline" titulo="Professor indisponível" descricao={erro} ctaLabel="Voltar" onCtaPress={() => router.back()} />
      ) : !detalhe ? (
        <View style={styles.conteudo}>
          <SkeletonLoader variant="custom" height={96} radius={Radius.lg} />
          <SkeletonLoader variant="custom" height={160} radius={Radius.lg} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={styles.cabecalho}>
            <Avatar nome={detalhe.professor.nome} foto={detalhe.professor.fotoUrl ?? undefined} tamanho="lg" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[Typography.h1, { color: cores.textoPrincipal }]} accessibilityRole="header">{detalhe.professor.nome}</Text>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>{detalhe.departamento.nome}</Text>
            </View>
          </View>

          {stats && <EstatisticasCard stats={stats} />}

          {papel === 'estudante' && <AvaliarSecao professorId={detalhe.professor.id} professorNome={detalhe.professor.nome} />}

          <ComentariosLista professorId={detalhe.professor.id} recarregar={versao} />

          <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Cadeiras leccionadas</Text>
          {detalhe.disciplinas.map(d => (
            <View key={d.id} style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{d.nome}</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{d.cursos.map(c => c.nome).join(' · ')}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.md },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  cartao: { padding: Spacing.md, gap: 4, borderWidth: 1, borderRadius: Radius.lg },
});
