import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../../src/components/TopBar';
import { SeletorCampo } from '../../src/components/SeletorCampo';
import { SeletorOpcoes } from '../../src/components/SeletorOpcoes';
import { Badge, Button, Chip, Input, SkeletonLoader, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { adminService } from '../../service/adminService';
import type { CadeiraDoEstudante, EstadoMatricula, EstudanteAdminDetalhe, OpcoesAcademicas } from '../../src/types';
import { validarEmail, validarNome, validarNumeroEstudante, validarObrigatorio, temErros } from '../../src/utils/validacao';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

/** Cadastro manual (e edição) de um estudante pelo administrador. */
export default function EstudanteForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editar = !!id;
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();

  const [opcoes, setOpcoes] = useState<OpcoesAcademicas>();
  const [detalhe, setDetalhe] = useState<EstudanteAdminDetalhe>();
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');
  const [email, setEmail] = useState('');
  const [cursoId, setCursoId] = useState<string>();
  const [semestreId, setSemestreId] = useState<string>();
  const [ano, setAno] = useState<string>();
  const [turmaId, setTurmaId] = useState<string>();
  const [estado, setEstado] = useState<EstadoMatricula>('ACTIVE');
  const [candidatas, setCandidatas] = useState<Omit<CadeiraDoEstudante, 'origem'>[]>();
  const [verCandidatas, setVerCandidatas] = useState(false);
  const [aCarregar, setACarregar] = useState(true);
  const [tentou, setTentou] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const preencher = (e: EstudanteAdminDetalhe, o: OpcoesAcademicas) => {
    setDetalhe(e);
    setNome(e.nome); setNumero(e.numero); setEmail(e.email);
    setCursoId(e.matricula ? e.curso?.id : e.curso?.id);
    setSemestreId(e.matricula?.semestre.id ?? o.semestres.find(s => s.corrente)?.id);
    setAno(e.matricula ? String(e.matricula.ano) : undefined);
    setTurmaId(e.matricula?.turma.id);
    setEstado(e.matricula?.estado ?? 'ACTIVE');
  };

  useEffect(() => {
    (async () => {
      try {
        const o = await adminService.opcoes();
        setOpcoes(o);
        if (id) preencher(await adminService.obterEstudante(id), o);
        else setSemestreId(o.semestres.find(s => s.corrente)?.id);
      } catch (e) { setErro(mensagemErro(e)); } finally { setACarregar(false); }
    })();
  }, [id]);

  const curso = opcoes?.cursos.find(c => c.id === cursoId);
  const anosOpc = useMemo(() => (curso?.anos ?? []).map(a => ({ id: String(a), rotulo: `${a}.º ano` })), [curso]);
  const turmasOpc = useMemo(
    () => (opcoes?.turmas ?? []).filter(t => t.cursoId === cursoId && String(t.ano) === ano && t.semestreId === semestreId).map(t => ({ id: t.id, rotulo: `Turma ${t.nome}` })),
    [opcoes, cursoId, ano, semestreId],
  );
  const semTurmas = !!(cursoId && ano && semestreId) && turmasOpc.length === 0;

  const erros = {
    nome: validarNome(nome),
    numero: validarNumeroEstudante(numero),
    email: validarEmail(email),
    curso: validarObrigatorio(cursoId, 'Escolhe o curso.'),
    ano: validarObrigatorio(ano, 'Escolhe o ano curricular.'),
    semestre: validarObrigatorio(semestreId, 'Escolhe o semestre.'),
    turma: validarObrigatorio(turmaId, 'Escolhe a turma.'),
  };

  const guardar = async () => {
    setTentou(true);
    setErro(undefined);
    if (temErros(erros)) return;
    const dados = { nome: nome.trim(), numero: numero.trim(), email: email.trim(), cursoId: cursoId!, ano: Number(ano), semestreId: semestreId!, turmaId: turmaId!, estado };
    setAGuardar(true);
    try {
      if (editar && id) await adminService.atualizarEstudante(id, dados);
      else await adminService.criarEstudante(dados);
      toast.show({ tipo: 'success', titulo: editar ? 'Estudante actualizado' : 'Estudante registado' });
      router.back();
    } catch (e) {
      setErro(mensagemErro(e));
      setAGuardar(false);
    }
  };

  const abrirCandidatas = async () => {
    if (!id) return;
    try { setCandidatas(await adminService.cadeirasCandidatas(id)); setVerCandidatas(true); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
  };
  const associar = async (courseSubjectId?: string) => {
    if (!id || !courseSubjectId) return;
    try { setDetalhe(await adminService.associarCadeira(id, courseSubjectId)); toast.show({ tipo: 'success', titulo: 'Cadeira associada' }); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
  };
  const remover = (c: CadeiraDoEstudante) =>
    Alert.alert('Remover cadeira', `Remover ${c.nome} das cadeiras deste estudante?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { setDetalhe(await adminService.removerCadeira(id!, c.courseSubjectId)); }
        catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
      } },
    ]);

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={editar ? 'Editar estudante' : 'Novo estudante'} onVoltar={() => router.back()} />
      {aCarregar ? (
        <View style={styles.conteudo}><SkeletonLoader variant="custom" height={360} radius={Radius.lg} /></View>
      ) : !opcoes ? (
        <View style={styles.conteudo}><Text style={[Typography.bodySmall, { color: cores.erro }]}>{erro}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          {detalhe && detalhe.estadoConta === 'PENDING' && (
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
              Conta por activar: o estudante activa-a ao registar-se na app com este mesmo email e número de estudante.
            </Text>
          )}
          <Input label="Nome completo" value={nome} onChangeText={setNome} autoCapitalize="words" error={tentou ? erros.nome : undefined} />
          <Input label="Número de estudante" type="number" value={numero} onChangeText={setNumero} maxLength={10} error={tentou ? erros.numero : undefined} />
          <Input label="Email" type="email" value={email} onChangeText={setEmail} autoCapitalize="none" error={tentou ? erros.email : undefined} />
          <SeletorCampo label="Curso" opcoes={opcoes.cursos.map(c => ({ id: c.id, rotulo: c.nome }))} valor={cursoId} onChange={v => { setCursoId(v); setAno(undefined); setTurmaId(undefined); }} erro={tentou ? erros.curso : undefined} />
          <SeletorCampo label="Semestre" opcoes={opcoes.semestres.map(s => ({ id: s.id, rotulo: s.corrente ? `${s.rotulo} (corrente)` : s.rotulo }))} valor={semestreId} onChange={v => { setSemestreId(v); setTurmaId(undefined); }} erro={tentou ? erros.semestre : undefined} />
          <SeletorCampo label="Ano curricular" opcoes={anosOpc} valor={ano} onChange={v => { setAno(v); setTurmaId(undefined); }} erro={tentou ? erros.ano : undefined} placeholder={cursoId ? 'Seleccionar' : 'Escolhe primeiro o curso'} />
          <SeletorCampo label="Turma" opcoes={turmasOpc} valor={turmaId} onChange={setTurmaId} erro={tentou ? erros.turma : undefined} placeholder={ano ? 'Seleccionar' : 'Escolhe curso, semestre e ano'} />
          {semTurmas && (
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
              Não há turmas para esta combinação. Cria uma no separador Turmas.
            </Text>
          )}
          <View style={{ gap: 6 }}>
            <Text style={[Typography.etiqueta, { color: cores.textoSecundario }]}>Estado da matrícula</Text>
            <View style={styles.linha}>
              <Chip label="Activa" seleccionado={estado === 'ACTIVE'} onPress={() => setEstado('ACTIVE')} />
              <Chip label="Inactiva" seleccionado={estado === 'INACTIVE'} onPress={() => setEstado('INACTIVE')} />
            </View>
            {estado === 'INACTIVE' && <Text style={[Typography.caption, { color: cores.textoTerciario }]}>Com a matrícula inactiva o estudante não vê cadeiras nem pode avaliar.</Text>}
          </View>

          {erro && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erro}</Text>}
          <Button label={editar ? 'Guardar alterações' : 'Registar estudante'} onPress={guardar} loading={aGuardar} fullWidth />

          {detalhe && (
            <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
              <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Cadeiras do semestre</Text>
              {!detalhe.matricula ? (
                <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Sem matrícula neste semestre: escolhe a turma e guarda para associar as cadeiras.</Text>
              ) : detalhe.cadeiras.length === 0 ? (
                <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Ainda sem cadeiras associadas.</Text>
              ) : detalhe.cadeiras.map(c => (
                <View key={c.courseSubjectId} style={[styles.cadeira, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{c.nome}</Text>
                    <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={2}>
                      {c.anoCurso}.º ano · {c.docentes.length ? c.docentes.map(d => d.nome).join(', ') : 'sem docente'}
                    </Text>
                  </View>
                  <Badge label={c.origem === 'AUTO' ? 'Da turma' : 'Manual'} cor={c.origem === 'AUTO' ? 'cinza' : 'azul'} />
                  <TouchableOpacity onPress={() => remover(c)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Remover ${c.nome}`}>
                    <Ionicons name="close-circle-outline" size={22} color={cores.erro} />
                  </TouchableOpacity>
                </View>
              ))}
              {detalhe.matricula && <Button label="Associar cadeira" variant="outline" size="sm" icon="add" onPress={abrirCandidatas} />}
            </View>
          )}
        </ScrollView>
      )}
      {verCandidatas && candidatas && (
        <SeletorOpcoes
          visivel
          titulo={candidatas.length ? 'Associar cadeira' : 'Sem cadeiras para associar'}
          opcoes={candidatas.map(c => ({ id: c.courseSubjectId, rotulo: `${c.nome} (${c.anoCurso}.º ano)` }))}
          onEscolher={associar}
          onFechar={() => setVerCandidatas(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.base },
  linha: { flexDirection: 'row', gap: Spacing.sm },
  cadeira: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
});
