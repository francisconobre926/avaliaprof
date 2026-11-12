import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import TopBar from '../../src/components/TopBar';
import { Badge, Button, Chip, EmptyState, SkeletonLoader, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { docenteService } from '../../service/docenteService';
import type { EstadoSessao, FichaDocente, SessaoAvaliacao } from '../../src/types/docente';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

const DURACOES = [15, 30, 60, 120];
const ESTADOS: Record<EstadoSessao, { rotulo: string; cor: 'verde' | 'cinza' | 'laranja' }> = {
  ACTIVE: { rotulo: 'Activa', cor: 'verde' },
  EXPIRED: { rotulo: 'Expirada', cor: 'cinza' },
  CLOSED: { rotulo: 'Encerrada', cor: 'cinza' },
};

const restante = (fim: string, agora: number) => {
  const s = Math.max(0, Math.floor((new Date(fim).getTime() - agora) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** O QR é só um atalho: o servidor volta a validar conta, matrícula, inscrição e período ao ser lido. */
function Codigo({ valor, rotulo }: { valor: string; rotulo: string }) {
  const toast = useToast();
  const svg = useRef<{ toDataURL: (cb: (b64: string) => void) => void } | null>(null);

  /** Guarda o QR como imagem PNG e abre o menu de partilha (WhatsApp, email, ...). O estudante pode carregá-la na app. */
  const partilhar = () => {
    svg.current?.toDataURL(async b64 => {
      try {
        const ficheiro = new File(Paths.cache, `qr-avaliaprof-${Date.now()}.png`);
        ficheiro.create();
        ficheiro.write(b64, { encoding: 'base64' });
        if (!(await Sharing.isAvailableAsync())) { toast.show({ tipo: 'error', titulo: 'A partilha não está disponível neste dispositivo.' }); return; }
        await Sharing.shareAsync(ficheiro.uri, { mimeType: 'image/png', dialogTitle: 'Partilhar QR Code' });
      } catch {
        toast.show({ tipo: 'error', titulo: 'Não foi possível partilhar o QR Code.' });
      }
    });
  };

  return (
    <View style={{ alignItems: 'center', gap: Spacing.sm }}>
      <View style={styles.qr} accessible accessibilityLabel={rotulo}>
        <QRCode value={valor} size={200} quietZone={16} backgroundColor="#FFFFFF" color="#000000" getRef={r => { svg.current = r; }} />
      </View>
      <Button label="Partilhar imagem" icon="share-outline" variant="outline" onPress={partilhar} />
    </View>
  );
}

export default function QrDocente() {
  const cores = useCores();
  const toast = useToast();
  const [ficha, setFicha] = useState<FichaDocente>();
  const [sessoes, setSessoes] = useState<SessaoAvaliacao[]>();
  const [erro, setErro] = useState<string>();
  const [cadeira, setCadeira] = useState<string>();
  const [minutos, setMinutos] = useState(30);
  const [aCriar, setACriar] = useState(false);
  const [aActualizar, setAActualizar] = useState(false);
  const [agora, setAgora] = useState(Date.now());

  const carregar = useCallback(async () => {
    setErro(undefined);
    try {
      const [f, s] = await Promise.all([docenteService.ficha(), docenteService.sessoes()]);
      setFicha(f); setSessoes(s);
    } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  useEffect(() => { const i = setInterval(() => setAgora(Date.now()), 1000); return () => clearInterval(i); }, []);

  const activa = sessoes?.find(s => s.estado === 'ACTIVE' && new Date(s.fechaEm).getTime() > agora);
  const opcoes = ficha?.cadeiras.flatMap(c => c.cursos.map(cc => ({ id: cc.id, rotulo: `${c.nome} · ${cc.cursoNome}, ${cc.ano}.º ano` }))) ?? [];

  const criar = async () => {
    if (!cadeira) return;
    setACriar(true);
    try { await docenteService.criarSessao(cadeira, minutos); await carregar(); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
    setACriar(false);
  };
  const encerrar = async (s: SessaoAvaliacao) => {
    try { await docenteService.encerrarSessao(s.id); await carregar(); toast.show({ tipo: 'success', titulo: 'Sessão encerrada' }); }
    catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); }
  };

  const caixa = [styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }];
  const titulo = (t: string) => <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} accessibilityRole="header">{t}</Text>;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="QR da aula" />
      {erro ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar de novo" onCtaPress={carregar} />
      ) : !ficha || !sessoes ? (
        <View style={{ padding: Spacing.base }}><SkeletonLoader variant="card" height={240} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.conteudo}
          refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={async () => { setAActualizar(true); await carregar(); setAActualizar(false); }} />}
        >
          {titulo('Sessão de avaliação')}
          {activa ? (
            <View style={caixa}>
              <Codigo valor={`avaliaprof://qr/sessao/${activa.token}`} rotulo={`QR da sessão de ${activa.cadeira}`} />
              <Text style={[Typography.bodyBold, { color: cores.textoPrincipal, textAlign: 'center' }]}>{activa.cadeira}</Text>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario, textAlign: 'center' }]}>
                {activa.curso}{activa.turma ? ` · turma ${activa.turma.nome}` : ''} · termina em {restante(activa.fechaEm, agora)}
              </Text>
              <Button label="Encerrar sessão" variant="outline" onPress={() => encerrar(activa)} fullWidth />
            </View>
          ) : opcoes.length === 0 ? (
            <EmptyState icon="school-outline" titulo="Sem cadeiras associadas" descricao="A administração ainda não te associou cadeiras." />
          ) : (
            <View style={caixa}>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                Os estudantes lêem o QR na app e avaliam só se estiverem matriculados e inscritos nesta cadeira, com o período aberto.
              </Text>
              <View style={styles.chips}>
                {opcoes.map(o => <Chip key={o.id} label={o.rotulo} seleccionado={cadeira === o.id} onPress={() => setCadeira(o.id)} />)}
              </View>
              <Text style={[Typography.meta, { color: cores.textoSecundario }]}>Duração</Text>
              <View style={styles.chips}>
                {DURACOES.map(d => <Chip key={d} label={`${d} min`} seleccionado={minutos === d} onPress={() => setMinutos(d)} />)}
              </View>
              <Button label="Iniciar sessão" icon="qr-code-outline" loading={aCriar} disabled={!cadeira} onPress={criar} fullWidth />
            </View>
          )}

          {titulo('O meu QR permanente')}
          <View style={caixa}>
            <Codigo valor={`avaliaprof://qr/professor/${ficha.codigoPublico}`} rotulo="QR permanente do docente" />
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario, textAlign: 'center' }]}>
              Identifica-te sem dar acesso a nada: cada estudante só pode avaliar se cumprir as regras.
            </Text>
          </View>

          {titulo('Sessões recentes')}
          {sessoes.length === 0 ? (
            <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Ainda não criaste sessões.</Text>
          ) : sessoes.map(s => {
            const estado: EstadoSessao = s.estado === 'ACTIVE' && new Date(s.fechaEm).getTime() <= agora ? 'EXPIRED' : s.estado;
            return (
              <View key={s.id} style={[styles.linha, { borderBottomColor: cores.bordaSubtil }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.body, { color: cores.textoPrincipal }]}>{s.cadeira}</Text>
                  <Text style={[Typography.meta, { color: cores.textoTerciario }]}>
                    {new Date(s.abreEm).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}{s.turma ? ` · turma ${s.turma.nome}` : ''}
                  </Text>
                </View>
                <Badge label={ESTADOS[estado].rotulo} cor={ESTADOS[estado].cor} />
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },
  cartao: { padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
  qr: { alignSelf: 'center', padding: Spacing.md, backgroundColor: '#FFFFFF', borderRadius: Radius.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
});
