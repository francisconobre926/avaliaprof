import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from './TopBar';
import { Button, EmptyState, SkeletonLoader } from './ui';
import { useCores } from '../store/themeStore';
import { qrService, type ItemQr, type ResultadoQr } from '../../service/qrService';
import { mensagemErro } from '../utils/erros';
import { Typography, Spacing, Radius } from '../theme/typography';

const hora = (iso?: string | null) => {
  try { return iso ? new Date(iso).toLocaleString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; } catch { return ''; }
};

/** Ecrã comum às duas formas de QR: mostra o docente e, por cadeira, se o estudante pode avaliar. */
export function EcraResultadoQr({ carregar, titulo }: { carregar: () => Promise<ResultadoQr>; titulo: string }) {
  const router = useRouter();
  const cores = useCores();
  const [dados, setDados] = useState<ResultadoQr>();
  const [erro, setErro] = useState<string>();

  const executar = useCallback(async () => {
    setErro(undefined);
    setDados(undefined);
    try { setDados(await carregar()); } catch (e) { setErro(mensagemErro(e)); }
  }, [carregar]);
  useEffect(() => { executar(); }, [executar]);

  const avaliar = (it: ItemQr) =>
    router.replace({
      pathname: '/avaliar',
      params: { professorId: dados!.teacher.id, professorNome: dados!.teacher.name, courseSubjectId: it.courseSubjectId, cadeira: it.subjectName },
    });

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={titulo} />
      {erro ? (
        <EmptyState icon="qr-code-outline" titulo="Não foi possível usar este QR" descricao={erro} ctaLabel="Ler outro QR Code" onCtaPress={() => router.replace('/ler-qr')} />
      ) : !dados ? (
        <View style={styles.conteudo}><SkeletonLoader variant="custom" height={120} radius={Radius.lg} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={{ gap: 2 }}>
            <Text style={[Typography.h1, { color: cores.textoPrincipal }]}>{dados.teacher.name}</Text>
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
              Semestre {dados.semester.label}{dados.sessionClosesAt ? ` · sessão aberta até ${hora(dados.sessionClosesAt)}` : ''}
            </Text>
          </View>
          {dados.items.length === 0 ? (
            <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Não podes avaliar este docente</Text>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                Não tens nenhuma cadeira deste docente neste semestre.
              </Text>
            </View>
          ) : dados.items.map(it => (
            <View key={it.courseSubjectId} style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{it.subjectName}</Text>
              {it.canEvaluate ? (
                <>
                  {it.periodClosesAt && <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Período aberto até {hora(it.periodClosesAt)}</Text>}
                  <Button label="Avaliar" icon="star-outline" onPress={() => avaliar(it)} fullWidth />
                </>
              ) : it.reason === 'JA_AVALIADO' ? (
                <>
                  <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Já avaliaste este docente nesta cadeira.</Text>
                  <Button label="Ver ou editar a minha avaliação" variant="outline" onPress={() => router.replace('/minhas-avaliacoes')} fullWidth />
                </>
              ) : (
                <Text style={[Typography.bodySmall, { color: cores.erro }]}>O período de avaliação desta cadeira não está aberto.</Text>
              )}
            </View>
          ))}
          <Button label="Ler outro QR Code" variant="ghost" icon="qr-code-outline" onPress={() => router.replace('/ler-qr')} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.lg, gap: Spacing.md },
  cartao: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
});
