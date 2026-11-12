import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui';
import { useCores } from '../store/themeStore';
import { useSincronizacao } from '../hooks/useSincronizacao';
import type { ItemFila } from '../offline/outbox';
import { Typography, Spacing, Radius } from '../theme/typography';

const acao = (i: ItemFila) => (i.op === 'create' ? 'Avaliação' : i.op === 'update' ? 'Alteração' : 'Remoção');

/** Faixa de estado: sem ligação, dados guardados, avaliações por enviar e operações recusadas/em conflito. */
export function EstadoSincronizacao() {
  const cores = useCores();
  const { online, aSincronizar, usandoCache, pendentes, problemas, descartar, tentarDeNovo } = useSincronizacao();
  if (online && !usandoCache && pendentes.length === 0 && problemas.length === 0) return null;

  const linhas: string[] = [];
  if (!online) linhas.push('Sem ligação. Podes avaliar na mesma: fica guardado neste dispositivo e é enviado quando houver rede.');
  else if (usandoCache) linhas.push('A mostrar dados guardados neste dispositivo.');
  if (pendentes.length > 0) {
    linhas.push(aSincronizar ? 'A enviar…' : `${pendentes.length} ${pendentes.length === 1 ? 'operação por enviar' : 'operações por enviar'}.`);
  }

  return (
    <View style={styles.raiz} accessibilityLiveRegion="polite">
      {linhas.length > 0 && (
        <View style={[styles.faixa, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <Ionicons name={online ? 'cloud-upload-outline' : 'cloud-offline-outline'} size={18} color={cores.textoSecundario} />
          <Text style={[Typography.bodySmall, { color: cores.textoSecundario, flex: 1 }]}>{linhas.join(' ')}</Text>
        </View>
      )}
      {problemas.map(i => (
        <View key={i.id} style={[styles.faixa, styles.problema, { backgroundColor: cores.fundoElevado, borderColor: cores.erro }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>
              {acao(i)} de {i.payload.professor}{i.payload.cadeira ? ` · ${i.payload.cadeira}` : ''}
            </Text>
            <Text style={[Typography.bodySmall, { color: cores.erro }]}>
              {i.status === 'CONFLICT'
                ? 'A avaliação foi alterada noutro dispositivo. Descarta esta alteração e edita de novo.'
                : i.message ?? 'O servidor recusou esta operação.'}
            </Text>
            <View style={styles.botoes}>
              {i.status === 'REJECTED' && <Button label="Tentar de novo" size="sm" variant="outline" onPress={() => tentarDeNovo(i.id)} />}
              <Button label="Descartar" size="sm" variant="ghost" onPress={() => descartar(i.id)} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: Spacing.xs },
  faixa: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm, borderWidth: 1, borderRadius: Radius.md },
  problema: { alignItems: 'flex-start' },
  botoes: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
});
