import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { StatTile } from '../../src/components/StatTile';
import { CabecalhoPerfil, GrupoConta, GrupoMenu, GrupoSessao, LinhaMenu } from '../../src/components/perfil/PerfilBase';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { docenteService } from '../../service/docenteService';
import type { FichaDocente } from '../../src/types/docente';
import { Spacing, Typography } from '../../src/theme/typography';

export default function PerfilDocente() {
  const router = useRouter();
  const cores = useCores();
  const utilizador = useUserStore(s => s.utilizador);
  const [ficha, setFicha] = useState<FichaDocente>();
  const [numeros, setNumeros] = useState<{ avaliacoes: number; media: number | null }>();
  const [aActualizar, setAActualizar] = useState(false);

  const carregar = useCallback(async () => {
    await Promise.all([
      docenteService.ficha().then(setFicha).catch(() => {}),
      docenteService.estatisticas().then(e => setNumeros({ avaliacoes: e.total, media: e.suficiente ? e.media : null })).catch(() => {}),
    ]);
  }, []);
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));
  if (!utilizador) return null;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Perfil" />
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={async () => { setAActualizar(true); await carregar(); setAActualizar(false); }} />}
      >
        <CabecalhoPerfil nome={ficha?.nome} foto={ficha?.foto} detalhes={ficha ? [`Departamento de ${ficha.departamento}`] : []} />

        {numeros && ficha && (
          <View style={styles.numeros}>
            <StatTile valor={ficha.cadeiras.length} rotulo="Cadeiras" />
            <StatTile valor={numeros.avaliacoes} rotulo="Avaliações" />
            <StatTile valor={numeros.media != null ? numeros.media.toFixed(1) : '—'} rotulo="Média geral" />
          </View>
        )}

        {ficha && (
          <GrupoMenu titulo="Cadeiras que lecciona">
            {ficha.cadeiras.length === 0 ? (
              <Text style={[Typography.bodySmall, { color: cores.textoSecundario, paddingVertical: Spacing.base }]}>Ainda sem cadeiras associadas. Fala com a administração.</Text>
            ) : ficha.cadeiras.map((c, i) => (
              <LinhaMenu
                key={c.id} icone="book-outline" rotulo={c.nome}
                descricao={c.cursos.map(x => `${x.cursoNome} (${x.ano}.º ano)`).join(' · ') || undefined}
                ultima={i === ficha.cadeiras.length - 1}
              />
            ))}
          </GrupoMenu>
        )}

        <GrupoConta />

        <GrupoMenu titulo="Definições">
          <LinhaMenu icone="notifications-outline" rotulo="Notificações" onPress={() => router.push('/notificacoes')} />
          <LinhaMenu icone="color-palette-outline" rotulo="Aparência" descricao="Tema claro ou escuro e cor" onPress={() => router.push('/aparencia')} ultima />
        </GrupoMenu>

        <GrupoSessao />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  numeros: { flexDirection: 'row', gap: Spacing.sm },
});
