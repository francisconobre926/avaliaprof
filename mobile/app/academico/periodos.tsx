import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { SeletorCampo } from '../../src/components/SeletorCampo';
import { Badge, Button, Chip, EmptyState, Input, Modal, SkeletonLoader, useToast } from '../../src/components/ui';
import { Cartao, Segmentos, formatarData } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService, deIso, paraIso } from '../../service/adminPainelService';
import type { PeriodoAdmin, SemestreAdmin } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

interface Form { id?: string; semestre?: string; abre: string; fecha: string; estado: 'OPEN' | 'CLOSED'; cursos: string[] }

export default function Periodos() {
  const router = useRouter(); const cores = useCores(); const toast = useToast();
  const [itens, setItens] = useState<PeriodoAdmin[]>(); const [serverTime, setServerTime] = useState<string>();
  const [semestres, setSemestres] = useState<SemestreAdmin[]>([]); const [cursos, setCursos] = useState<{ id: string; name: string }[]>([]);
  const [erro, setErro] = useState<string>(); const [form, setForm] = useState<Form>(); const [erroForm, setErroForm] = useState<string>(); const [aGuardar, setAGuardar] = useState(false);

  const carregar = useCallback(async () => {
    setErro(undefined);
    try {
      const [p, s, e] = await Promise.all([adminPainelService.periodos(), adminPainelService.semestres(), adminPainelService.estrutura()]);
      setItens(p.items); setServerTime(p.serverTime); setSemestres(s.items); setCursos(e.courses);
    } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  useEffect(() => undefined, []);

  const novo = () => { const agora = new Date(); const fim = new Date(agora.getTime() + 14 * 864e5);
    setErroForm(undefined); setForm({ semestre: semestres.find(s => s.isCurrent)?.id, abre: deIso(agora.toISOString()), fecha: deIso(fim.toISOString()), estado: 'OPEN', cursos: [] }); };
  const editar = (p: PeriodoAdmin) => { setErroForm(undefined); setForm({ id: p.id, semestre: p.semester.id, abre: deIso(p.opensAt), fecha: deIso(p.closesAt), estado: p.status, cursos: p.courses.map(c => c.id) }); };

  const guardar = async () => {
    if (!form) return;
    const abre = paraIso(form.abre); const fecha = paraIso(form.fecha);
    if (!form.id && !form.semestre) return setErroForm('Escolhe o semestre.');
    if (!abre || !fecha) return setErroForm('Datas no formato AAAA-MM-DD HH:mm.');
    if (abre >= fecha) return setErroForm('A abertura tem de ser anterior ao fecho.');
    setAGuardar(true); setErroForm(undefined);
    try {
      const base = { opensAt: abre, closesAt: fecha, status: form.estado, courseIds: form.cursos };
      if (form.id) await adminPainelService.atualizarPeriodo(form.id, base); else await adminPainelService.criarPeriodo({ ...base, semesterId: form.semestre });
      toast.show({ tipo: 'success', titulo: 'Período guardado' }); setForm(undefined); await carregar();
    } catch (e) { setErroForm(mensagemErro(e)); }
    setAGuardar(false);
  };
  const apagar = (p: PeriodoAdmin) => Alert.alert('Apagar período', 'Só é possível se ainda não tiver avaliações. Continuar?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Apagar', style: 'destructive', onPress: async () => {
      try { await adminPainelService.apagarPeriodo(p.id); toast.show({ tipo: 'success', titulo: 'Período apagado' }); await carregar(); }
      catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    } },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Períodos" onVoltar={() => router.back()} acoes={<TopBarBotao icone="add" rotulo="Novo período" onPress={novo} />} />
      {erro ? <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
        : !itens ? <View style={styles.l}><SkeletonLoader variant="custom" height={110} radius={Radius.lg} /></View>
        : <FlatList data={itens} keyExtractor={p => p.id} contentContainerStyle={styles.l}
          ListHeaderComponent={<Text style={[Typography.meta, { color: cores.textoSecundario }]}>Hora do servidor: {serverTime ? formatarData(serverTime) : '—'}. Um período só está aberto se o estado for «Aberto» e a hora estiver entre as datas.</Text>}
          ListEmptyComponent={<EmptyState icon="timer-outline" titulo="Sem períodos" descricao="Sem período aberto, ninguém pode avaliar." ctaLabel="Novo período" onCtaPress={novo} />}
          renderItem={({ item: p }) => (
            <Cartao onPress={() => editar(p)} rotulo={`Período de ${p.semester.label}. Editar`}>
              <View style={styles.h}><Text style={[Typography.tituloCard, { color: cores.textoPrincipal, flex: 1 }]}>{p.semester.label}</Text>
                <Badge label={p.open ? 'A decorrer' : p.status === 'OPEN' ? 'Fora de datas' : 'Fechado'} cor={p.open ? 'verde' : 'cinza'} /></View>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{formatarData(p.opensAt)} → {formatarData(p.closesAt)}</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>Âmbito: {p.courses.length || p.courseSubjects.length ? [...p.courses.map(c => c.name), ...p.courseSubjects.map(c => `${c.name} (${c.course})`)].join(', ') : 'todo o semestre'} · {p.evaluations} avaliações</Text>
              <Button size="sm" variant="ghost" label="Apagar" onPress={() => apagar(p)} />
            </Cartao>)} />}
      <Modal visible={!!form} onClose={() => setForm(undefined)} titulo={form?.id ? 'Editar período' : 'Novo período'}>
        {form && (
          <ScrollView contentContainerStyle={{ gap: Spacing.md }} keyboardShouldPersistTaps="handled">
            {!form.id && <SeletorCampo label="Semestre" opcoes={semestres.map(s => ({ id: s.id, rotulo: s.label }))} valor={form.semestre} onChange={id => setForm({ ...form, semestre: id })} />}
            <Input label="Abre (AAAA-MM-DD HH:mm)" value={form.abre} onChangeText={t => setForm({ ...form, abre: t })} autoCapitalize="none" />
            <Input label="Fecha (AAAA-MM-DD HH:mm)" value={form.fecha} onChangeText={t => setForm({ ...form, fecha: t })} autoCapitalize="none" />
            <Segmentos opcoes={[{ id: 'OPEN', rotulo: 'Aberto' }, { id: 'CLOSED', rotulo: 'Fechado' }]} valor={form.estado} onChange={v => setForm({ ...form, estado: v })} />
            <Text style={[Typography.etiqueta, { color: cores.textoSecundario }]}>Âmbito por curso (nenhum = todo o semestre)</Text>
            <View style={styles.chips}>{cursos.map(c => <Chip key={c.id} label={c.name} seleccionado={form.cursos.includes(c.id)} onPress={() => setForm({ ...form, cursos: form.cursos.includes(c.id) ? form.cursos.filter(x => x !== c.id) : [...form.cursos, c.id] })} />)}</View>
            {erroForm && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erroForm}</Text>}
            <Button label="Guardar" onPress={guardar} loading={aGuardar} fullWidth />
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({ l: { padding: Spacing.base, gap: Spacing.sm, flexGrow: 1 }, h: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs } });
