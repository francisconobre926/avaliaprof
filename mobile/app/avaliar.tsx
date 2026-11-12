import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TopBar from '../src/components/TopBar';
import { Estrelas } from '../src/components/Estrelas';
import { Button, Input, SkeletonLoader, useToast } from '../src/components/ui';
import { useCores } from '../src/store/themeStore';
import { useOfflineStore } from '../src/offline/estado';
import { outbox } from '../src/offline/outbox';
import { sincronizarSeOnline } from '../src/offline/rede';
import { useUserStore } from '../src/store/userStore';
import { ErroServico } from '../service/erro';
import { EstadoSincronizacao } from '../src/components/EstadoSincronizacao';
import { avaliacaoService } from '../service/avaliacaoService';
import { CRITERIOS, type Avaliacao, type Notas } from '../src/types';
import { mensagemErro } from '../src/utils/erros';
import { Typography, Spacing } from '../src/theme/typography';

const LIMITE = 500;
const VAZIAS: Notas = { clarity: 0, punctuality: 0, availability: 0, mastery: 0, fairness: 0 };

/**
 * Criar ou editar uma avaliação. A nota e o comentário são independentes: se o comentário não
 * for publicado, a nota fica guardada e o estudante pode reformular o comentário.
 */
export default function Avaliar() {
  const p = useLocalSearchParams<{ professorId?: string; professorNome?: string; courseSubjectId?: string; cadeira?: string; avaliacaoId?: string }>();
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const userId = useUserStore(st => st.utilizador?.id);
  // Um clientId por formulário: se o envio for repetido, o servidor não duplica.
  const clientId = useRef(avaliacaoService.novoClientId()).current;
  const [existente, setExistente] = useState<Avaliacao>();
  const [notas, setNotas] = useState<Notas>(VAZIAS);
  const [comentario, setComentario] = useState('');
  const [aCarregar, setACarregar] = useState(!!p.avaliacaoId);
  const [aGuardar, setAGuardar] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [erro, setErro] = useState<string>();

  const preencher = (a: Avaliacao) => { setExistente(a); setNotas(a.notas); setComentario(a.comentario?.texto ?? ''); };

  useEffect(() => {
    if (!p.avaliacaoId) return;
    avaliacaoService.minhas()
      .then(lista => { const a = lista.find(x => x.id === p.avaliacaoId); a ? preencher(a) : setErro('Avaliação não encontrada.'); })
      .catch(e => setErro(mensagemErro(e)))
      .finally(() => setACarregar(false));
  }, [p.avaliacaoId]);

  const incompleta = CRITERIOS.some(c => notas[c.chave] < 1);
  const excedeu = comentario.length > LIMITE;
  const editar = !!existente;

  const avisoComentario = (a: Avaliacao): boolean => {
    const c = a.comentario;
    if (!c || c.estado === 'PUBLISHED') return false;
    const titulo = c.estado === 'BLOCKED' ? 'Comentário não publicado' : 'Comentário em análise';
    Alert.alert(titulo, `${c.mensagem ?? ''}\n\nA tua classificação ficou guardada.`.trim(),
      c.estado === 'BLOCKED'
        ? [{ text: 'Reformular comentário', onPress: () => preencher(a) }, { text: 'Concluir', style: 'cancel', onPress: () => router.back() }]
        : [{ text: 'OK', onPress: () => router.back() }]);
    return true;
  };

  const guardar = async () => {
    setTentou(true);
    setErro(undefined);
    if (incompleta || excedeu) return;
    setAGuardar(true);
    const rotulo = { professor: p.professorNome ?? existente?.professor.nome ?? '', cadeira: existente?.cadeira.nome ?? p.cadeira ?? '' };
    const alteradas = existente ? CRITERIOS.filter(c => notas[c.chave] !== existente.notas[c.chave]) : [];
    const patch = alteradas.length ? Object.fromEntries(alteradas.map(c => [c.chave, notas[c.chave]])) as Partial<Notas> : undefined;
    const textoAntes = existente?.comentario?.texto ?? '';
    const textoAgora = comentario.trim();
    const comentarioEdicao = textoAgora === textoAntes ? undefined : textoAgora === '' ? null : textoAgora;

    // Sem ligação (ou rede falhou): guarda no dispositivo e envia mais tarde. O servidor decide então pela SUA hora.
    const guardarOffline = async () => {
      if (!userId) return false;
      if (editar && existente) {
        await outbox.editar(userId, existente.id, { ...rotulo, patch, comment: comentarioEdicao, version: existente.versao });
      } else {
        await outbox.criar(userId, clientId, { ...rotulo, teacherId: p.professorId!, courseSubjectId: p.courseSubjectId!, scores: notas, comment: textoAgora || undefined });
      }
      sincronizarSeOnline();
      toast.show({ tipo: 'success', titulo: 'Guardada neste dispositivo; será enviada quando houver ligação.' });
      router.back();
      return true;
    };

    try {
      if (!useOfflineStore.getState().online && (await guardarOffline())) return;
      let resultado: Avaliacao;
      if (editar && existente) {
        resultado = await avaliacaoService.editar(existente.id, { notas: patch, comentario: comentarioEdicao, versao: existente.versao });
      } else {
        resultado = await avaliacaoService.criar({
          clientId, professorId: p.professorId!, courseSubjectId: p.courseSubjectId!, notas, comentario,
        });
      }
      if (avisoComentario(resultado)) { setExistente(resultado); return; }
      toast.show({ tipo: 'success', titulo: editar ? 'Avaliação actualizada' : 'Avaliação enviada. Obrigado!' });
      router.back();
    } catch (e) {
      if (e instanceof ErroServico && e.codigo === 'SEM_REDE' && (await guardarOffline().catch(() => false))) return;
      setErro(mensagemErro(e));
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={editar ? 'Editar avaliação' : 'Avaliar'} onVoltar={() => router.back()} />
      {aCarregar ? (
        <View style={styles.conteudo}><SkeletonLoader variant="custom" height={320} radius={16} /></View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            <EstadoSincronizacao />
            <View style={{ gap: 2 }}>
              <Text style={[Typography.h1, { color: cores.textoPrincipal }]}>{p.professorNome}</Text>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>{existente?.cadeira.nome ?? p.cadeira}{existente ? ` · ${existente.semestre.label}` : ''}</Text>
            </View>
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
              A tua avaliação é anónima: ninguém, incluindo o docente, vê quem a fez.
            </Text>

            {CRITERIOS.map(c => (
              <View key={c.chave} style={styles.criterio}>
                <Text style={[Typography.bodyBold, { color: cores.textoPrincipal, flex: 1 }]}>{c.rotulo}</Text>
                <Estrelas valor={notas[c.chave]} onChange={v => setNotas(n => ({ ...n, [c.chave]: v }))} rotulo={c.rotulo} />
              </View>
            ))}
            {tentou && incompleta && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">Classifica os cinco critérios.</Text>}

            <Input
              label="Comentário (opcional)"
              type="textarea"
              value={comentario}
              onChangeText={setComentario}
              placeholder="Fala da aula, da matéria e da avaliação. Sem insultos nem dados pessoais."
              maxLength={LIMITE + 50}
              showCounter
              error={excedeu ? `O comentário excede ${LIMITE} caracteres.` : undefined}
              hint={`Máximo ${LIMITE} caracteres. Os comentários passam por uma verificação automática antes de serem publicados.`}
            />

            {erro && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erro}</Text>}
            <Button label={editar ? 'Guardar alterações' : 'Enviar avaliação'} onPress={guardar} loading={aGuardar} fullWidth />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.base },
  criterio: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
});
