import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import TopBar from '../../src/components/TopBar';
import { Estrelas } from '../../src/components/Estrelas';
import { LinhaDocente } from '../../src/components/LinhaDocente';
import { StatTile } from '../../src/components/StatTile';
import { Button, EmptyState, SkeletonLoader } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { painelService } from '../../service/painelService';
import type { InicioDados } from '../../src/types';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

const dia = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }); } catch { return ''; }
};

/** Início: resumo pessoal, o que falta avaliar, docentes em destaque (de todos) e as minhas avaliações recentes. */
export default function Inicio() {
  const { t } = useTranslation();
  const router = useRouter();
  const cores = useCores();
  const nome = useUserStore(s => s.utilizador?.nome.split(' ')[0]);
  const [dados, setDados] = useState<InicioDados>();
  const [erro, setErro] = useState<string>();
  const [aActualizar, setAActualizar] = useState(false);

  const carregar = useCallback(async () => {
    setErro(undefined);
    try { setDados(await painelService.inicio()); } catch (e) { setErro(mensagemErro(e)); }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const actualizar = async () => { setAActualizar(true); await carregar(); setAActualizar(false); };
  const abrirDocente = (id: string) => router.push({ pathname: '/professor/[id]', params: { id } });
  const caixa = { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil };
  const secao = (titulo: string, accao?: { rotulo: string; onPress: () => void }) => (
    <View style={styles.secaoTopo}>
      <Text style={[Typography.tituloSecao, { color: cores.textoPrincipal }]} accessibilityRole="header">{titulo}</Text>
      {accao && (
        <TouchableOpacity onPress={accao.onPress} accessibilityRole="button" hitSlop={8}>
          <Text style={[Typography.bodyBold, { color: cores.principalTexto }]}>{accao.rotulo}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={t('inicio.titulo')} />
      {erro && !dados ? (
        <EmptyState icon="cloud-offline-outline" titulo="Não foi possível carregar" descricao={erro} ctaLabel="Tentar novamente" onCtaPress={carregar} />
      ) : !dados ? (
        <View style={styles.conteudo}>{[0, 1, 2].map(i => <SkeletonLoader key={i} variant="custom" height={110} radius={Radius.lg} />)}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={actualizar} tintColor={cores.principal} />}>
          <View style={{ gap: 2 }}>
            <Text style={[Typography.h1, { color: cores.textoPrincipal }]}>Olá, {nome}</Text>
            {dados.semestre && <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Semestre {dados.semestre.label}</Text>}
          </View>

          <Button label="Ler QR Code" icon="qr-code-outline" size="lg" onPress={() => router.push('/ler-qr')} fullWidth />

          {dados.resumo.cadeiras === 0 ? (
            <View style={[styles.cartao, caixa]}>
              <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]}>Ainda sem cadeiras</Text>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                A tua matrícula ainda não está registada ou activa neste semestre. Quando estiver, aqui aparece o que tens por avaliar.
              </Text>
              <Button label="As minhas cadeiras" variant="outline" size="sm" onPress={() => router.push('/minhas-cadeiras')} />
            </View>
          ) : (
            <>
              <View style={styles.tiles}>
                <StatTile valor={dados.resumo.cadeiras} rotulo="Cadeiras" />
                <StatTile valor={dados.resumo.docentes} rotulo="Docentes" />
                <StatTile valor={dados.resumo.avaliadas} rotulo="Avaliados" />
              </View>

              {secao('Por avaliar', dados.resumo.porAvaliar > dados.porAvaliar.length ? { rotulo: 'Ver docentes', onPress: () => router.push('/(estudante)/professores') } : undefined)}
              {dados.porAvaliar.length === 0 ? (
                <View style={[styles.cartao, caixa]}>
                  <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                    {dados.resumo.avaliadas > 0 ? 'Já avaliaste todos os teus docentes neste semestre. Obrigado!' : 'Não há avaliações abertas neste momento.'}
                  </Text>
                </View>
              ) : (
                dados.porAvaliar.slice(0, 4).map(p => (
                  <TouchableOpacity
                    key={`${p.docenteId}-${p.courseSubjectId}`}
                    onPress={() => abrirDocente(p.docenteId)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Avaliar ${p.docente}, ${p.cadeira}, até ${dia(p.fechaEm)}`}
                    style={[styles.linha, caixa]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} numberOfLines={1}>{p.docente}</Text>
                      <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>{p.cadeira} · até {dia(p.fechaEm)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}

          {secao('Docentes em destaque', { rotulo: 'Estatísticas', onPress: () => router.push('/(estudante)/estatisticas') })}
          {dados.destaques.length === 0 ? (
            <View style={[styles.cartao, caixa]}>
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
                Os destaques aparecem quando houver docentes com pelo menos {dados.minimo} avaliações, para proteger o anonimato.
              </Text>
            </View>
          ) : (
            dados.destaques.map((d, i) => (
              <LinhaDocente key={d.id} posicao={i + 1} nome={d.nome} departamento={d.departamento} fotoUrl={d.fotoUrl} media={d.media} total={d.total} onPress={() => abrirDocente(d.id)} />
            ))
          )}

          {dados.resumo.cadeiras > 0 && (
            <>
              {secao('As minhas avaliações', dados.recentes.length ? { rotulo: 'Ver todas', onPress: () => router.push('/minhas-avaliacoes') } : undefined)}
              {dados.recentes.length === 0 ? (
                <View style={[styles.cartao, caixa]}>
                  <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>Ainda não avaliaste ninguém. As tuas avaliações aparecem aqui.</Text>
                </View>
              ) : (
                dados.recentes.map(r => (
                  <TouchableOpacity key={r.id} onPress={() => router.push('/minhas-avaliacoes')} activeOpacity={0.7} accessibilityRole="button" style={[styles.linha, caixa]}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[Typography.tituloCard, { color: cores.textoPrincipal }]} numberOfLines={1}>{r.docente.nome}</Text>
                      <Text style={[Typography.meta, { color: cores.textoSecundario }]} numberOfLines={1}>{r.cadeira} · {r.semestre}</Text>
                    </View>
                    <Estrelas valor={r.media} tamanho={14} rotulo="Média da avaliação" />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.md },
  tiles: { flexDirection: 'row', gap: Spacing.sm },
  secaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  cartao: { padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.lg, alignItems: 'flex-start' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderWidth: 1, borderRadius: Radius.lg },
});
