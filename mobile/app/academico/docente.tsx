import { useCallback, useState } from 'react';
import { ScrollView, Share, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { Badge, Button, Chip, EmptyState, Input, SkeletonLoader, useToast } from '../../src/components/ui';
import { Cartao, formatarData } from '../../src/components/admin/Comuns';
import { useCores } from '../../src/store/themeStore';
import { adminPainelService } from '../../service/adminPainelService';
import type { ConviteDocente, EstruturaAdmin } from '../../src/types/adminPainel';
import { mensagemErro } from '../../src/utils/erros';
import { Radius, Spacing, Typography } from '../../src/theme/typography';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Detalhe do docente: cadeiras que lecciona e convite para activar a conta. */
export default function DocenteAdmin() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); const cores = useCores(); const toast = useToast();
  const [d, setD] = useState<EstruturaAdmin>(); const [erro, setErro] = useState<string>();
  const [sel, setSel] = useState<string[]>(); const [email, setEmail] = useState(''); const [convite, setConvite] = useState<ConviteDocente>();
  const [aGuardar, setAGuardar] = useState(false); const [aConvidar, setAConvidar] = useState(false); const [erroConvite, setErroConvite] = useState<string>();

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { const e = await adminPainelService.estrutura(); setD(e); setSel(old => old ?? e.teachers.find(t => t.id === id)?.subjectIds ?? []); } catch (e) { setErro(mensagemErro(e)); }
  }, [id]);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const t = d?.teachers.find(x => x.id === id);
  const guardar = async () => {
    setAGuardar(true);
    try { await adminPainelService.definirCadeirasDocente(id!, sel ?? []); toast.show({ tipo: 'success', titulo: 'Cadeiras guardadas' }); await carregar(); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    setAGuardar(false);
  };
  const convidar = async () => {
    setErroConvite(undefined);
    if (!EMAIL.test(email.trim())) return setErroConvite('Indica um email válido.');
    setAConvidar(true);
    try { setConvite(await adminPainelService.convidarDocente(id!, email.trim().toLowerCase())); await carregar(); }
    catch (e) { setErroConvite(mensagemErro(e)); }
    setAConvidar(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <TopBar titulo="Docente" onVoltar={() => router.back()} />
      {erro ? <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
        : !d || !sel ? <View style={styles.c}><SkeletonLoader variant="custom" height={120} radius={Radius.lg} /></View>
        : !t ? <EmptyState icon="person-outline" titulo="Docente não encontrado" />
        : <ScrollView contentContainerStyle={styles.c} keyboardShouldPersistTaps="handled">
          <Text style={[Typography.h1, { color: cores.textoPrincipal }]}>{t.name}</Text>
          <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{t.department}</Text>

          <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Cadeiras que lecciona</Text>
          <View style={styles.chips}>{d.subjects.map(s => <Chip key={s.id} label={s.name} seleccionado={sel.includes(s.id)} onPress={() => setSel(sel.includes(s.id) ? sel.filter(x => x !== s.id) : [...sel, s.id])} />)}</View>
          <Button label="Guardar cadeiras" variant="outline" onPress={guardar} loading={aGuardar} />

          <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]}>Conta do docente</Text>
          <View style={styles.h}>
            <Badge label={t.account ? (t.account.status === 'ACTIVE' ? 'Conta activa' : 'Convite pendente') : 'Sem conta'} cor={t.account?.status === 'ACTIVE' ? 'verde' : 'cinza'} />
            {t.account && <Text style={[Typography.meta, { color: cores.textoSecundario }]}>{t.account.email}</Text>}
          </View>
          {t.account?.status !== 'ACTIVE' && <>
            <Input label="Email do docente" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={erroConvite} />
            <Button label={t.account ? 'Gerar novo convite' : 'Convidar docente'} onPress={convidar} loading={aConvidar} />
          </>}
          {convite && (
            <Cartao>
              <Text style={[Typography.etiqueta, { color: cores.textoSecundario }]}>Código de convite</Text>
              <Text selectable style={[Typography.displayMD, { color: cores.textoPrincipal, letterSpacing: 4 }]} accessibilityLabel={`Código ${convite.code.split('').join(' ')}`}>{convite.code}</Text>
              <Text style={[Typography.bodySmall, { color: cores.erro }]}>Mostrado só uma vez: partilha-o agora (ou mantém premido o código para o copiar). Válido até {formatarData(convite.expiresAt)}.</Text>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>O docente activa a conta no ecrã «Activar conta de docente», com o email {convite.email} e este código.</Text>
              <View style={styles.h}>
                <Button size="sm" icon="share-outline" label="Partilhar" onPress={() => Share.share({ message: `AvaliaProf: activa a tua conta de docente com o email ${convite.email} e o código ${convite.code} (válido até ${formatarData(convite.expiresAt)}).` })} />
              </View>
            </Cartao>
          )}
        </ScrollView>}
    </View>
  );
}
const styles = StyleSheet.create({ c: { padding: Spacing.base, gap: Spacing.md }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }, h: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' } });
