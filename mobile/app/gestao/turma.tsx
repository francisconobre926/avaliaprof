import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { SeletorCampo } from '../../src/components/SeletorCampo';
import { Button, SkeletonLoader, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { adminService } from '../../service/adminService';
import type { OpcoesAcademicas } from '../../src/types';
import { validarObrigatorio, temErros } from '../../src/utils/validacao';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing } from '../../src/theme/typography';

/** Nova turma: Curso → Ano curricular → Semestre → Regime. O nome é gerado (ex.: Info4Lab2L = Informática, 4.º ano, 2.º semestre, laboral). */
export default function NovaTurma() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [opcoes, setOpcoes] = useState<OpcoesAcademicas>();
  const [cursoId, setCursoId] = useState<string>();
  const [ano, setAno] = useState<string>();
  const [semestreId, setSemestreId] = useState<string>();
  const [regime, setRegime] = useState<string>('LABORAL');
  const [tentou, setTentou] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    adminService.opcoes()
      .then(o => { setOpcoes(o); setSemestreId(o.semestres.find(s => s.corrente)?.id); })
      .catch(e => setErro(mensagemErro(e)));
  }, []);

  const curso = opcoes?.cursos.find(c => c.id === cursoId);
  const anos = useMemo(() => (curso?.anos ?? []).map(a => ({ id: String(a), rotulo: `${a}.º ano` })), [curso]);

  const erros = {
    curso: validarObrigatorio(cursoId, 'Escolhe o curso.'),
    ano: validarObrigatorio(ano, 'Escolhe o ano curricular.'),
    semestre: validarObrigatorio(semestreId, 'Escolhe o semestre.'),
  };
  const semestre = opcoes?.semestres.find(x => x.id === semestreId);
  const nomeGerado = curso && ano && semestre ? `${curso.codigo}${ano}Lab${semestre.numero}${regime === 'LABORAL' ? 'L' : 'P'}` : undefined;

  const guardar = async () => {
    setTentou(true);
    setErro(undefined);
    if (temErros(erros)) return;
    setAGuardar(true);
    try {
      await adminService.criarTurma({ cursoId: cursoId!, ano: Number(ano), semestreId: semestreId!, regime: regime as 'LABORAL' | 'POS_LABORAL' });
      toast.show({ tipo: 'success', titulo: 'Turma criada' });
      router.back();
    } catch (e) {
      setErro(mensagemErro(e));
      setAGuardar(false);
    }
  };

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Nova turma" onVoltar={() => router.back()} />
      {!opcoes ? (
        <View style={styles.conteudo}>{erro ? <Text style={[Typography.bodySmall, { color: cores.erro }]}>{erro}</Text> : <SkeletonLoader variant="custom" height={240} radius={16} />}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <SeletorCampo label="Curso" opcoes={opcoes.cursos.map(c => ({ id: c.id, rotulo: c.nome }))} valor={cursoId} onChange={id => { setCursoId(id); setAno(undefined); }} erro={tentou ? erros.curso : undefined} />
          <SeletorCampo label="Ano curricular" opcoes={anos} valor={ano} onChange={setAno} erro={tentou ? erros.ano : undefined} placeholder={cursoId ? 'Seleccionar' : 'Escolhe primeiro o curso'} />
          <SeletorCampo label="Semestre" opcoes={opcoes.semestres.map(s => ({ id: s.id, rotulo: s.corrente ? `${s.rotulo} (corrente)` : s.rotulo }))} valor={semestreId} onChange={setSemestreId} erro={tentou ? erros.semestre : undefined} />
          <SeletorCampo label="Regime" opcoes={[{ id: 'LABORAL', rotulo: 'Laboral' }, { id: 'POS_LABORAL', rotulo: 'Pós-laboral' }]} valor={regime} onChange={setRegime} />
          <Text style={[Typography.body, { color: cores.textoSecundario }]} accessibilityLiveRegion="polite">
            {nomeGerado ? `Nome da turma: ${nomeGerado}` : 'O nome da turma é gerado a partir do curso, ano, semestre e regime.'}
          </Text>
          {erro && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erro}</Text>}
          <Button label="Criar turma" onPress={guardar} loading={aGuardar} fullWidth />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.base },
});
