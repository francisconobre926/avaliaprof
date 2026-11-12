import { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { CabecalhoPerfil, GrupoConta, GrupoMenu, GrupoSessao, LinhaMenu } from '../../src/components/perfil/PerfilBase';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { adminPainelService } from '../../service/adminPainelService';
import { Spacing } from '../../src/theme/typography';

export default function PerfilAdmin() {
  const router = useRouter();
  const cores = useCores();
  const utilizador = useUserStore(s => s.utilizador);
  const [pendentes, setPendentes] = useState<{ comentarios: number; denuncias: number }>();

  useFocusEffect(useCallback(() => {
    adminPainelService.estatisticas().then(e => setPendentes({ comentarios: e.pendingComments, denuncias: e.openReports })).catch(() => {});
  }, []));
  if (!utilizador) return null;

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Perfil" />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <CabecalhoPerfil />

        <GrupoConta />

        <GrupoMenu titulo="Administração">
          <LinhaMenu
            icone="shield-checkmark-outline" rotulo="Moderação"
            descricao={pendentes ? `${pendentes.comentarios} comentário(s) em revisão · ${pendentes.denuncias} denúncia(s) aberta(s)` : undefined}
            onPress={() => router.push('/(admin)/moderacao')}
          />
          <LinhaMenu icone="people-circle-outline" rotulo="Utilizadores" descricao="Suspender ou reactivar contas" onPress={() => router.push('/academico/utilizadores')} />
          <LinhaMenu icone="list-outline" rotulo="Registo de auditoria" onPress={() => router.push('/academico/auditoria')} ultima />
        </GrupoMenu>

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
});
