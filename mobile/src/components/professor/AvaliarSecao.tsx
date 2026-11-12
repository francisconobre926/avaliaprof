import { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { avaliacaoService } from '../../../service/avaliacaoService';
import { Badge, Button } from '../ui';
import { useCores } from '../../store/themeStore';
import type { ElegibilidadeCadeira } from '../../types';
import { mensagemErro } from '../../utils/erros';
import { Typography, Spacing, Radius } from '../../theme/typography';

const MOTIVO: Record<string, string> = { PERIODO_FECHADO: 'Período encerrado' };

/** Cadeiras deste docente que o estudante pode avaliar (ou já avaliou). Dados vêm do servidor. */
export function AvaliarSecao({ professorId, professorNome }: { professorId: string; professorNome: string }) {
  const router = useRouter();
  const cores = useCores();
  const [itens, setItens] = useState<ElegibilidadeCadeira[]>();
  const [erro, setErro] = useState<string>();

  useFocusEffect(useCallback(() => {
    let activo = true;
    avaliacaoService.elegibilidade(professorId)
      .then(r => { if (activo) { setItens(r); setErro(undefined); } })
      .catch(e => { if (activo) setErro(mensagemErro(e)); });
    return () => { activo = false; };
  }, [professorId]));

  const caixa = [styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }];

  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Avaliar</Text>
      {erro ? (
        <View style={caixa}><Text style={[Typography.bodySmall, { color: cores.erro }]}>{erro}</Text></View>
      ) : !itens ? null : itens.length === 0 ? (
        <View style={caixa}>
          <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
            Só podes avaliar docentes das cadeiras que frequentas. Selecciona neste semestre uma cadeira leccionada por este docente.
          </Text>
          <Button label="As minhas cadeiras" variant="outline" size="sm" onPress={() => router.push('/minhas-cadeiras')} />
        </View>
      ) : (
        itens.map(i => (
          <View key={i.courseSubjectId} style={caixa}>
            <View style={styles.linha}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal, flex: 1 }]}>{i.cadeira}</Text>
              {i.motivo === 'JA_AVALIADO' && <Badge label="Avaliada" cor="verde" />}
              {i.motivo === 'PERIODO_FECHADO' && <Badge label={MOTIVO.PERIODO_FECHADO} cor="cinza" />}
            </View>
            {i.podeAvaliar ? (
              <Button
                label="Avaliar"
                size="sm"
                onPress={() => router.push({ pathname: '/avaliar', params: { professorId, professorNome, courseSubjectId: i.courseSubjectId, cadeira: i.cadeira } })}
              />
            ) : i.avaliacaoId ? (
              <Button
                label="Editar a minha avaliação"
                variant="outline"
                size="sm"
                onPress={() => router.push({ pathname: '/avaliar', params: { professorNome, avaliacaoId: i.avaliacaoId!, cadeira: i.cadeira } })}
              />
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, alignItems: 'flex-start' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, alignSelf: 'stretch' },
});
