import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import TopBar from '../../src/components/TopBar';
import { Chip } from '../../src/components/ui';
import { StatTile } from '../../src/components/StatTile';
import { CabecalhoPerfil, GrupoConta, GrupoMenu, GrupoSessao, LinhaMenu } from '../../src/components/perfil/PerfilBase';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { useLinguaStore } from '../../src/store/linguaStore';
import { useSincronizacao } from '../../src/hooks/useSincronizacao';
import { inscricaoService } from '../../service/inscricaoService';
import { painelService } from '../../service/painelService';
import type { Inscricao } from '../../service/inscricaoService';
import type { InicioDados } from '../../src/types';
import { Spacing } from '../../src/theme/typography';

export default function Perfil() {
  const { t } = useTranslation();
  const router = useRouter();
  const cores = useCores();
  const utilizador = useUserStore(s => s.utilizador);
  const lingua = useLinguaStore(s => s.linguaEscolhida) ?? 'pt';
  const escolherLingua = useLinguaStore(s => s.escolherLingua);
  const { pendentes } = useSincronizacao();
  const [inscricao, setInscricao] = useState<Inscricao>();
  const [resumo, setResumo] = useState<InicioDados['resumo']>();
  const [aActualizar, setAActualizar] = useState(false);

  // Os números são um complemento: se falhar a rede o perfil continua utilizável.
  const carregar = useCallback(async () => {
    await Promise.all([
      inscricaoService.minhas().then(setInscricao).catch(() => {}),
      painelService.inicio().then(d => setResumo(d.resumo)).catch(() => {}),
    ]);
  }, []);
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  if (!utilizador) return null;
  const m = inscricao?.matricula;
  const detalhes = [
    `${m?.curso.nome ?? utilizador.cursoNome ?? 'Sem curso'} · N.º ${utilizador.numeroEstudante}`,
    m ? `${m.anoCurso}.º ano · Turma ${m.turma.nome}${m.estado === 'ACTIVE' ? '' : ' · matrícula inactiva'}` : inscricao ? 'Sem matrícula neste semestre' : '',
  ];

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo={t('perfil.titulo')} />
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={async () => { setAActualizar(true); await carregar(); setAActualizar(false); }} />}
      >
        <CabecalhoPerfil detalhes={detalhes} />

        {resumo && (
          <View style={styles.numeros}>
            <StatTile valor={resumo.cadeiras} rotulo="Cadeiras" />
            <StatTile valor={resumo.avaliadas} rotulo="Avaliações feitas" />
            <StatTile valor={resumo.porAvaliar} rotulo="Por avaliar" />
          </View>
        )}

        <GrupoConta />

        <GrupoMenu titulo="Académico">
          <LinhaMenu icone="book-outline" rotulo="As minhas cadeiras" valor={resumo ? String(resumo.cadeiras) : undefined} onPress={() => router.push('/minhas-cadeiras')} />
          <LinhaMenu
            icone="star-outline" rotulo="As minhas avaliações"
            descricao={pendentes.length > 0 ? `${pendentes.length} por enviar` : undefined}
            valor={resumo ? String(resumo.avaliadas) : undefined}
            onPress={() => router.push('/minhas-avaliacoes')}
          />
          <LinhaMenu icone="qr-code-outline" rotulo="Ler QR Code" descricao="Do docente ou da aula" onPress={() => router.push('/ler-qr')} />
          <LinhaMenu icone="notifications-outline" rotulo="Notificações" onPress={() => router.push('/notificacoes')} ultima />
        </GrupoMenu>

        <GrupoMenu titulo={t('perfil.definicoes')}>
          <LinhaMenu icone="color-palette-outline" rotulo={t('perfil.aparencia')} descricao="Tema claro ou escuro e cor" onPress={() => router.push('/aparencia')} />
          <LinhaMenu
            icone="language-outline" rotulo={t('perfil.lingua')} ultima
            direita={(
              <View style={styles.chips}>
                <Chip label="PT" seleccionado={lingua === 'pt'} onPress={() => escolherLingua('pt')} />
                <Chip label="EN" seleccionado={lingua === 'en'} onPress={() => escolherLingua('en')} />
              </View>
            )}
          />
        </GrupoMenu>

        <GrupoSessao porEnviar={pendentes.length} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  numeros: { flexDirection: 'row', gap: Spacing.sm },
  chips: { flexDirection: 'row', gap: Spacing.xs },
});
