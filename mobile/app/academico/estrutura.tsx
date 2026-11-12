import { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { SeletorCampo } from '../../src/components/SeletorCampo';
import { Badge, Button, EmptyState, Input, Modal, SkeletonLoader, useToast } from '../../src/components/ui';
import { Cartao, Segmentos } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { EstruturaAdmin } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

type Aba = 'cursos' | 'cadeiras' | 'docentes';
interface Form { nome: string; codigo?: string; dep?: string; curso?: string; ano?: string; sem?: string; cadeira?: string }

/** Cursos, cadeiras e docentes. Criar, ligar cadeiras a cursos e abrir o detalhe do docente (convite). */
export default function Estrutura() {
  const router = useRouter(); const cores = useCores(); const toast = useToast();
  const [d, setD] = useState<EstruturaAdmin>(); const [erro, setErro] = useState<string>();
  const [aba, setAba] = useState<Aba>('cursos'); const [form, setForm] = useState<Form>(); const [ligar, setLigar] = useState(false);
  const [erroForm, setErroForm] = useState<string>(); const [aGuardar, setAGuardar] = useState(false);

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setD(await adminPainelService.estrutura()); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const abrir = (l = false) => { setErroForm(undefined); setLigar(l); setForm({ nome: '' }); };
  const guardar = async () => {
    if (!form || !d) return;
    setErroForm(undefined);
    const ano = form.ano ? Number(form.ano) : undefined; const sem = form.sem ? Number(form.sem) : undefined;
    try {
      setAGuardar(true);
      if (ligar) {
        if (!form.cadeira || !form.curso || !ano || !sem) throw new Error('Escolhe a cadeira, o curso, o ano e o semestre.');
        await adminPainelService.ligarCadeira(form.cadeira, { courseId: form.curso, courseYear: ano, semesterNumber: sem });
      } else if (aba === 'cursos') {
        if (form.nome.trim().length < 3) throw new Error('Indica o nome do curso (mínimo 3 letras).');
        if (!/^[A-Za-z]{2,6}$/.test((form.codigo ?? '').trim())) throw new Error('A abreviatura deve ter 2 a 6 letras (ex.: Info).');
        await adminPainelService.criarCurso(form.nome.trim(), form.codigo!.trim());
      } else if (aba === 'cadeiras') {
        if (form.nome.trim().length < 2 || !form.dep) throw new Error('Indica o nome e o departamento.');
        if (form.curso && (!ano || !sem)) throw new Error('Para ligar a um curso indica o ano e o semestre.');
        await adminPainelService.criarCadeira({ name: form.nome.trim(), departmentId: form.dep, courseId: form.curso, courseYear: ano, semesterNumber: sem });
      } else {
        if (form.nome.trim().length < 3 || !form.dep) throw new Error('Indica o nome e o departamento.');
        await adminPainelService.criarDocente({ name: form.nome.trim(), departmentId: form.dep });
      }
      toast.show({ tipo: 'success', titulo: 'Guardado' }); setForm(undefined); await carregar();
    } catch (e) { setErroForm(mensagemErro(e)); }
    setAGuardar(false);
  };

  const anos = [1, 2, 3, 4, 5].map(a => ({ id: String(a), rotulo: `${a}.º ano` }));
  const sems = [{ id: '1', rotulo: '1.º semestre' }, { id: '2', rotulo: '2.º semestre' }];
  const cursos = d?.courses.map(c => ({ id: c.id, rotulo: c.name })) ?? [];
  const deps = d?.departments.map(c => ({ id: c.id, rotulo: c.name })) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Estrutura académica" onVoltar={() => router.back()} acoes={<TopBarBotao icone="add" rotulo="Criar" onPress={() => abrir()} />} />
      <View style={{ padding: Spacing.base }}><Segmentos opcoes={[{ id: 'cursos', rotulo: 'Cursos' }, { id: 'cadeiras', rotulo: 'Cadeiras' }, { id: 'docentes', rotulo: 'Docentes' }]} valor={aba} onChange={setAba} /></View>
      {erro ? <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
        : !d ? <View style={styles.l}><SkeletonLoader variant="custom" height={70} radius={Radius.lg} /></View>
        : <ScrollView contentContainerStyle={styles.l}>
          {aba === 'cursos' && d.courses.map(c => <Cartao key={c.id}><Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{c.name}</Text><Text style={[Typography.meta, { color: cores.textoSecundario }]}>{c.code} · {c.subjects} cadeiras</Text></Cartao>)}
          {aba === 'cadeiras' && <>
            <Button size="sm" variant="outline" icon="link-outline" label="Ligar cadeira a um curso" onPress={() => abrir(true)} />
            {d.subjects.map(s => (
              <Cartao key={s.id}>
                <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>{s.name}</Text>
                <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{s.department}</Text>
                {s.links.map(l => <Text key={l.id} style={[Typography.meta, { color: cores.textoSecundario }]}>• {l.course} · {l.courseYear}.º ano · {l.semesterNumber}.º sem.</Text>)}
              </Cartao>))}
          </>}
          {aba === 'docentes' && d.teachers.map(t => (
            <Cartao key={t.id} onPress={() => router.push({ pathname: '/academico/docente', params: { id: t.id } })} rotulo={`Docente ${t.name}. Abrir`}>
              <View style={styles.h}><Text style={[Typography.tituloCard, { color: cores.textoPrincipal, flex: 1 }]}>{t.name}</Text>
                <Badge label={t.account ? (t.account.status === 'ACTIVE' ? 'Com conta' : 'Convidado') : 'Sem conta'} cor={t.account?.status === 'ACTIVE' ? 'verde' : 'cinza'} /></View>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{t.department} · {t.subjectIds.length} cadeiras</Text>
            </Cartao>))}
        </ScrollView>}
      <Modal visible={!!form} onClose={() => setForm(undefined)} titulo={ligar ? 'Ligar cadeira a curso' : aba === 'cursos' ? 'Novo curso' : aba === 'cadeiras' ? 'Nova cadeira' : 'Novo docente'}>
        {form && (
          <ScrollView contentContainerStyle={{ gap: Spacing.md }} keyboardShouldPersistTaps="handled">
            {ligar
              ? <SeletorCampo label="Cadeira" opcoes={d?.subjects.map(s => ({ id: s.id, rotulo: s.name })) ?? []} valor={form.cadeira} onChange={id => setForm({ ...form, cadeira: id })} />
              : <Input label="Nome" value={form.nome} onChangeText={t => setForm({ ...form, nome: t })} />}
            {!ligar && aba === 'cursos' && <Input label="Abreviatura" value={form.codigo ?? ''} onChangeText={t => setForm({ ...form, codigo: t })} maxLength={6} autoCapitalize="words" hint="Usada no nome das turmas. Ex.: Info → Info4Lab2L." />}
            {!ligar && aba !== 'cursos' && <SeletorCampo label="Departamento" opcoes={deps} valor={form.dep} onChange={id => setForm({ ...form, dep: id })} />}
            {(ligar || aba === 'cadeiras') && <>
              <SeletorCampo label={ligar ? 'Curso' : 'Curso (opcional)'} opcoes={cursos} valor={form.curso} onChange={id => setForm({ ...form, curso: id })} />
              <SeletorCampo label="Ano curricular" opcoes={anos} valor={form.ano} onChange={id => setForm({ ...form, ano: id })} />
              <SeletorCampo label="Semestre" opcoes={sems} valor={form.sem} onChange={id => setForm({ ...form, sem: id })} />
            </>}
            {erroForm && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erroForm}</Text>}
            <Button label="Guardar" onPress={guardar} loading={aGuardar} fullWidth />
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({ l: { padding: Spacing.base, paddingTop: 0, gap: Spacing.sm }, h: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm } });
