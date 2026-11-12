import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../src/components/TopBar';
import { Badge, EmptyState, SkeletonLoader } from '../src/components/ui';
import { useCores } from '../src/store/themeStore';
import { inscricaoService, type Inscricao } from '../service/inscricaoService';
import type { CadeiraInscricao } from '../src/types';
import { mensagemErro } from '../src/utils/erros';
import { Typography, Spacing, Radius } from '../src/theme/typography';

/**
 * As cadeiras do estudante no semestre corrente e os respectivos docentes, segundo a matrícula
 * atribuída pela administração. Só leitura; sem matrícula não há lista global para mostrar.
 */
export default function MinhasCadeiras() {
  const router = useRouter();
  const cores = useCores();
  const [dados, setDados] = useState<Inscricao>();
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setDados(await inscricaoService.minhas()); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const porAno = useMemo(() => {
    const mapa = new Map<number, CadeiraInscricao[]>();
    dados?.cadeiras.forEach(c => mapa.set(c.anoCurso, [...(mapa.get(c.anoCurso) ?? []), c]));
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
  }, [dados]);

  const m = dados?.matricula;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="As minhas cadeiras" onVoltar={() => router.back()} />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : !dados ? (
        <View style={styles.conteudo}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={64} radius={Radius.lg} />)}</View>
      ) : !m ? (
        <EmptyState icon="school-outline" titulo="Ainda sem matrícula" descricao={`A tua matrícula no semestre ${dados.semestre.label} ainda não foi registada pela administração. Quando for, as tuas cadeiras e docentes aparecem aqui.`} />
      ) : m.estado !== 'ACTIVE' ? (
        <EmptyState icon="lock-closed-outline" titulo="Matrícula inactiva" descricao="A tua matrícula não está activa neste semestre. Contacta a administração." />
      ) : dados.cadeiras.length === 0 ? (
        <EmptyState icon="book-outline" titulo="Sem cadeiras associadas" descricao="Ainda não há cadeiras associadas à tua turma neste semestre." />
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
            <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{m.curso.nome}</Text>
            <Text style={[Typography.meta, { color: cores.textoSecundario }]}>
              {m.anoCurso}.º ano · Turma {m.turma.nome} · Semestre {dados.semestre.label}
            </Text>
          </View>
          {porAno.map(([ano, lista]) => (
            <View key={ano} style={{ gap: Spacing.sm }}>
              {porAno.length > 1 && <Text style={[Typography.captionBold, { color: cores.textoTerciario }]}>{ano}.º ANO</Text>}
              {lista.map(c => (
                <View key={c.courseSubjectId} style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                  <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{c.nome}</Text>
                  <View style={styles.docentes}>
                    {c.docentes.length === 0
                      ? <Text style={[Typography.meta, { color: cores.textoSecundario }]}>Sem docente associado</Text>
                      : c.docentes.map(d => <Badge key={d.id} label={d.nome} cor="cinza" />)}
                  </View>
                </View>
              ))}
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
  cartao: { padding: Spacing.md, gap: 6, borderWidth: 1, borderRadius: Radius.lg },
  docentes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
});
