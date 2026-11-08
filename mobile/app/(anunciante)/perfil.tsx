import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/userStore';
import { useCores } from '../../src/store/themeStore';

import { Fonte } from '../../src/theme/fonts';
import { Typography, Spacing } from '../../src/theme/typography';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
import { Colors } from '../../src/theme/colors';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const AZUL_MARCA = Colors.azul;
const AZUL_ESCURO = Colors.azulTexto;
const COR_ACENTO = Colors.azul;
const LARANJA_PALE = 'rgba(26, 115, 232, 0.12)';
const VERDE = Colors.verdeTexto;
const VERDE_PALE = Colors.verdeSuave;
const VERMELHO = Colors.erro;
const VERMELHO_PALE = Colors.erroFundo;
const AZUL_PALE = 'rgba(26, 115, 232, 0.1)';

export default function PerfilAnunciante() {
  const router = useRouter();
  const cores = useCores();
  const limparDadosLocais = useUserStore((state) => state.limpar);
  const usuario = useUserStore((state) => state.usuario);

  const nomeExibir = usuario?.nome?.trim() || 'Anunciante';
  const inicialAvatar = nomeExibir.charAt(0).toUpperCase();

  const escolherPapelStore = useUserStore((state) => state.escolherPapel);
  const voltarAProcurar = async () => {
    await escolherPapelStore('procurador');
    router.replace('/(procurador)' as never);
  };

  const confirmarResetDesenvolvimento = () => {
    Alert.alert(
      'Reiniciar aplicação (TESTE)',
      'Isto vai apagar os dados locais do GoHome neste dispositivo e voltar ao início do onboarding. Não apaga contas existentes num servidor. Queres continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            try {
              await limparDadosLocais();
              router.replace('/' as never);
            } catch (error) {
              console.error('[PerfilAnunciante] erro ao reiniciar dados:', error);
              Alert.alert(
                'Não foi possível reiniciar',
                'Ocorreu um erro ao limpar os dados locais. Consulta o terminal do Expo para mais detalhes.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar
        acoes={<TopBarBotao icone="settings-outline" rotulo="Definições" />}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.titulo, { color: cores.textoPrincipal }]}>O meu perfil</Text>

        {/* Cartão de identidade */}
        <View style={[styles.profileCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLetra}>{inicialAvatar}</Text>
            <View style={[styles.verificado, { borderColor: cores.fundoElevado }]}>
              <Ionicons name="checkmark" size={12} color={Colors.branco} />
            </View>
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.nome, { color: cores.textoPrincipal }]}>{nomeExibir}</Text>
            <View style={styles.tipoContainer}>
              <Ionicons name="shield-checkmark-outline" size={15} color={cores.textoSecundario} />
              <Text style={[styles.tipo, { color: cores.textoSecundario }]}>
                Perfil de anunciante
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={Colors.aviso} />
              <Text style={[styles.ratingValor, { color: cores.textoPrincipal }]}>4.8</Text>
              <Text style={[styles.ratingCount, { color: cores.textoSecundario }]}>
                · 47 avaliações
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={cores.textoSecundario} />
        </View>

        <View style={[styles.trustRow, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <TrustItem icon="shield-checkmark-outline" title="Conta" subtitle="Protegida" cores={cores} />
          <View style={[styles.trustDivider, { backgroundColor: cores.bordaSubtil }]} />
          <TrustItem icon="flash-outline" title="Resposta" subtitle="Rápida" cores={cores} />
          <View style={[styles.trustDivider, { backgroundColor: cores.bordaSubtil }]} />
          <TrustItem icon="home-outline" title="Anúncios" subtitle="Geridos" cores={cores} />
        </View>

        <View style={styles.menu}>
          <SectionTitle title="A minha conta" subtitle="Dados e preferências pessoais" cores={cores} />
          <MenuItem icon="person-outline" tint={AZUL_PALE} iconColor={AZUL_MARCA} title="Informações pessoais" description="Nome, email e telefone" onPress={() => router.push('/editar-perfil')} cores={cores} />
          <MenuItem icon="card-outline" tint={VERDE_PALE} iconColor={VERDE} title="Pagamentos" description="Métodos e histórico de pagamentos" onPress={() => router.push('/carteira' as any)} cores={cores} />
          <MenuItem icon="notifications-outline" tint={LARANJA_PALE} iconColor={COR_ACENTO} title="Notificações" description="Escolhe o que queres receber" onPress={() => {}} cores={cores} />
          <MenuItem icon="color-palette-outline" tint={Colors.azulSuave} iconColor={Colors.azul} title="Aparência" description="Tema e cores da aplicação" onPress={() => router.push('/aparencia')} cores={cores} />

          <SectionTitle title="O meu negócio" subtitle="Acompanha a actividade dos anúncios" cores={cores} />
          <MenuItem icon="stats-chart-outline" tint={AZUL_PALE} iconColor={AZUL_MARCA} title="Estatísticas" description="Desempenho dos anúncios" onPress={() => {}} cores={cores} />
          <MenuItem icon="bookmark-outline" tint={LARANJA_PALE} iconColor={COR_ACENTO} title="Avaliações recebidas" description="Consulta as opiniões dos utilizadores" onPress={() => {}} cores={cores} />
          <MenuItem icon="pricetag-outline" tint={VERDE_PALE} iconColor={VERDE} title="Promoções" description="Ofertas e destaques disponíveis" onPress={() => {}} cores={cores} />

          <SectionTitle title="Ajuda e segurança" subtitle="Estamos aqui para ajudar" cores={cores} />
          <MenuItem icon="help-circle-outline" tint={AZUL_PALE} iconColor={AZUL_MARCA} title="Centro de ajuda" description="Perguntas frequentes e suporte" onPress={() => {}} cores={cores} />
          <MenuItem icon="document-text-outline" tint={cores.fundoSuave} iconColor={cores.textoSecundario} title="Termos de utilização" description="Condições de uso da plataforma" onPress={() => {}} cores={cores} />
          <MenuItem icon="lock-closed-outline" tint={cores.fundoSuave} iconColor={cores.textoSecundario} title="Privacidade" description="Como protegemos os teus dados" onPress={() => {}} cores={cores} />

          <TouchableOpacity
            style={styles.logoutBotao}
            onPress={voltarAProcurar}
            activeOpacity={0.85}
          >
            <Ionicons name="search-outline" size={20} color={VERMELHO} />
            <Text style={styles.logoutTexto}>Voltar a procurar espaços</Text>
            <Ionicons name="chevron-forward" size={18} color={VERMELHO} />
          </TouchableOpacity>

          {__DEV__ ? (
            <TouchableOpacity
              style={styles.resetDevBotao}
              onPress={confirmarResetDesenvolvimento}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Reiniciar aplicação para testes"
            >
              <Ionicons name="refresh-circle-outline" size={21} color={AZUL_ESCURO} />
              <View style={styles.resetDevInfo}>
                <Text style={styles.resetDevTitulo}>Reiniciar aplicação (TESTE)</Text>
                <Text style={[styles.resetDevDescricao, { color: cores.textoSecundario }]}>
                  Limpa os dados locais e volta ao onboarding. Apenas desenvolvimento.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={AZUL_ESCURO} />
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.versao, { color: cores.textoTerciario }]}>
            GoHome v1.0  ·  Let's Go Tech
          </Text>
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function TrustItem({ icon, title, subtitle, cores }: any) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIcon}>
        <Ionicons name={icon} size={19} color={COR_ACENTO} />
      </View>
      <View>
        <Text style={[styles.trustTitle, { color: cores.textoPrincipal }]}>{title}</Text>
        <Text style={[styles.trustSubtitle, { color: cores.textoSecundario }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title, subtitle, cores }: any) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={[styles.sectionTitle, { color: cores.textoPrincipal }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: cores.textoSecundario }]}>{subtitle}</Text>
    </View>
  );
}

function MenuItem({ icon, tint, iconColor, title, description, onPress, badge, cores }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
      ]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuTitle, { color: cores.textoPrincipal }]}>{title}</Text>
        <Text style={[styles.menuDescription, { color: cores.textoSecundario }]}>
          {description}
        </Text>
      </View>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 18 },
  titulo: { ...Typography.h1, paddingHorizontal: Spacing.lg, marginTop: 16, marginBottom: 12 },
  profileCard: {
    marginHorizontal: 18, padding: 16,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderWidth: 1, borderBottomWidth: 0,
    flexDirection: 'row', alignItems: 'center', gap: 13,
  },
  avatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: LARANJA_PALE,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarLetra: { fontSize: 28, fontFamily: Fonte.tituloSemi, color: COR_ACENTO },
  verificado: {
    position: 'absolute', right: -3, bottom: -3,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: VERDE, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  profileText: { flex: 1 },
  nome: { fontSize: 18, lineHeight: 22, fontFamily: Fonte.corpoSemi },
  tipoContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  tipo: { fontSize: 12, fontFamily: Fonte.corpoSemi },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  ratingValor: { fontSize: 12, fontFamily: Fonte.corpoSemi },
  ratingCount: { fontFamily: Fonte.corpo, fontSize: 12 },

  trustRow: {
    marginHorizontal: 18,
    paddingVertical: 14, paddingHorizontal: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    borderWidth: 1, borderTopWidth: StyleSheet.hairlineWidth,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trustIcon: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: LARANJA_PALE,
    alignItems: 'center', justifyContent: 'center',
  },
  trustTitle: { fontSize: 12, fontFamily: Fonte.corpoSemi },
  trustSubtitle: { fontFamily: Fonte.corpo, fontSize: 12, marginTop: 2 },
  trustDivider: { width: 1, height: 28 },

  menu: { paddingHorizontal: 18, paddingTop: 12 },
  sectionHeading: { marginTop: 22, marginBottom: 11 },
  sectionTitle: { fontSize: 18, fontFamily: Fonte.corpoSemi },
  sectionSubtitle: { fontFamily: Fonte.corpo, fontSize: 12, marginTop: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 13, minHeight: 76,
    borderRadius: 17, borderWidth: 1,
    marginBottom: 9,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuInfo: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: Fonte.corpoSemi },
  menuDescription: { fontFamily: Fonte.corpo, fontSize: 12, marginTop: 4, lineHeight: 15 },
  badge: {
    backgroundColor: LARANJA_PALE, color: COR_ACENTO,
    fontSize: 12, fontFamily: Fonte.corpoSemi,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8,
  },
  logoutBotao: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 15, marginTop: 20,
    backgroundColor: VERMELHO_PALE,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.erroFundo,
  },
  logoutTexto: { flex: 1, color: VERMELHO, fontSize: 14, fontFamily: Fonte.corpoSemi },
  resetDevBotao: {
    flexDirection: 'row', alignItems: 'center',
    gap: 11, padding: 14, marginTop: 12,
    backgroundColor: AZUL_PALE,
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(26, 115, 232, 0.25)',
  },
  resetDevInfo: { flex: 1 },
  resetDevTitulo: { color: AZUL_ESCURO, fontSize: 13, fontFamily: Fonte.corpoSemi },
  resetDevDescricao: { fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 15, marginTop: 4 },
  versao: { textAlign: 'center', fontFamily: Fonte.corpo, fontSize: 12, marginTop: 22 },
});