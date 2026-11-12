import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { avaliacaoService } from '../../../service/avaliacaoService';
import { useCores } from '../../store/themeStore';
import type { ComentarioPublico } from '../../types';
import { mensagemErro } from '../../utils/erros';
import { Typography, Spacing, Radius } from '../../theme/typography';

/** Comentários publicados: anónimos, sem data (só o semestre), em ordem não cronológica. */
export function ComentariosLista({ professorId, recarregar }: { professorId: string; recarregar: number }) {
  const cores = useCores();
  const [itens, setItens] = useState<ComentarioPublico[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState<string>();

  const carregar = useCallback(async (pg: number) => {
    setACarregar(true);
    setErro(undefined);
    try {
      const r = await avaliacaoService.comentarios(professorId, pg);
      setItens(prev => (pg === 0 ? r.itens : [...prev, ...r.itens]));
      setTotal(r.total);
      setTemMais(r.temMais);
      setPagina(pg);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setACarregar(false);
    }
  }, [professorId]);

  useEffect(() => { carregar(0); }, [carregar, recarregar]);

  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Comentários{total ? ` (${total})` : ''}</Text>
      {itens.map(c => (
        <View key={c.id} style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <Text style={[Typography.body, { color: cores.textoPrincipal }]}>{c.texto}</Text>
          <Text style={[Typography.caption, { color: cores.textoTerciario }]}>Estudante anónimo · {c.semestre}</Text>
        </View>
      ))}
      {!aCarregar && !erro && itens.length === 0 && (
        <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Ainda não há comentários publicados.</Text>
      )}
      {erro && <Text style={[Typography.bodySmall, { color: cores.erro }]}>{erro}</Text>}
      {aCarregar ? <ActivityIndicator color={cores.principal} /> : temMais && (
        <TouchableOpacity onPress={() => carregar(pagina + 1)} accessibilityRole="button" style={styles.mais}>
          <Text style={[Typography.bodyBold, { color: cores.principalTexto }]}>Ver mais comentários</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { padding: Spacing.md, gap: 6, borderWidth: 1, borderRadius: Radius.lg },
  mais: { alignSelf: 'center', paddingVertical: Spacing.sm },
});
