import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useUserStore } from '../../src/store/userStore';
import { useCores } from '../../src/store/themeStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useReferralStore } from '../../src/store/referralStore';


const formatarValor = (valor: number | null | undefined) =>
  `${(Number(valor) || 0).toLocaleString('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;

export default function PerfilProcurador() {
  const router = useRouter();
  const cores = useCores();

  // Zustand - utilizador
  const usuario = useUserStore(state => state.usuario);
  // O userStore actual guarda apenas os campos declarados em UsuarioPerfil.
  // Derivamos estes valores aqui para não chamar métodos inexistentes.
  const inicialAvatar = (usuario?.nome?.trim()?.[0] || 'U').toLocaleUpperCase('pt-MZ');
  const camposPerfil = [
    usuario?.nome?.trim(),
    usuario?.email?.trim(),
    usuario?.telefone?.trim(),
    usuario?.foto,
  ];
  const perfilCompleto = Math.round(
    (camposPerfil.filter(valor => Boolean(valor)).length / camposPerfil.length) * 100,
  );

  // Zustand - carteira
  const carteiraStore = useWalletStore(state => state.carteira);
  // Evita erro enquanto a carteira ainda não foi inicializada no store.
  const carteira = carteiraStore ?? {
    saldoDisponivel: 0,
    saldoCreditos: 0,
    saldoPendente: 0,
  };

  // Zustand - referência
  // Alguns estados de referência podem ainda não expor estes helpers.
  // Leitura defensiva evita que o perfil falhe durante a renderização.
  const referralState = useReferralStore() as any;
  const totalConvidados = typeof referralState.getTotalConvidados === 'function'
    ? Number(referralState.getTotalConvidados()) || 0
    : 0;
  const totalGanhoReferencia = typeof referralState.getTotalGanho === 'function'
    ? Number(referralState.getTotalGanho()) || 0
    : 0;

  const saldoTotal =
    (Number(carteira.saldoDisponivel) || 0) +
    (Number(carteira.saldoCreditos) || 0);

  // ========================================================
  // DEV: Reset total da app (apaga tudo do AsyncStorage)
  // Só aparece quando __DEV__ é true (desaparece em build de produção).
  // ========================================================
  const confirmarResetDev = () => {
    Alert.alert(
      '🧪 Reset total da app',
      'Isto apaga TUDO: língua escolhida, onboarding, utilizador, carteira, anúncios locais, referências. A app vai começar do zero no ecrã de escolha de língua.\n\nContinuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, apagar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                '✅ App limpa',
                'Fecha e reabre a app (ou abana o telemóvel → Reload no menu Dev do Expo).',
                [{ text: 'OK' }],
              );
            } catch (e) {
              Alert.alert('Erro', 'Não foi possível limpar o storage.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ============ HERO ============ */}
        <LinearGradient
          colors={['#FF7900', '#F15A24']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroTop}>
              <Text style={styles.heroTitulo}>O meu perfil</Text>
              <TouchableOpacity style={styles.heroBotao}>
                <Ionicons name="settings-outline" size={20} color={Colors.branco} />
              </TouchableOpacity>
            </View>

            <View style={styles.perfilInfo}>
              {/* Avatar */}
              <View style={styles.avatarWrapper}>
                {usuario?.foto ? (
                  <Image
                    source={{ uri: usuario.foto }}
                    style={styles.avatarFoto}
                  />
                ) : (
                  <View style={styles.avatarGrande}>
                    <Text style={styles.avatarGrandeLetra}>{inicialAvatar}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.editarFotoBadge}
                  onPress={() => router.push('/editar-perfil')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera" size={14} color={Colors.branco} />
                </TouchableOpacity>
              </View>

              <Text style={styles.nome}>{usuario?.nome || 'Sem nome'}</Text>

              <View style={styles.tipoContainer}>
                <MaterialCommunityIcons name="account-search" size={14} color={Colors.branco} />
                <Text style={styles.tipo}>Procurador</Text>
              </View>

              <Text style={styles.email}>{usuario?.email || 'sem email'}</Text>

              <View style={styles.localizacaoRow}>
                <Ionicons name="location" size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.localizacaoTexto}>
                  {'Beira, Sofala'}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ============ CARTEIRA DESTAQUE ============ */}
        <TouchableOpacity
          style={[styles.carteiraCard, { backgroundColor: cores.fundoElevado }]}
          onPress={() => router.push('/carteira' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.carteiraTop}>
            <View style={styles.carteiraLeft}>
              <View style={[styles.carteiraIcone, { backgroundColor: cores.principalClara }]}>
                <Ionicons name="wallet" size={20} color={cores.principal} />
              </View>
              <View>
                <Text style={[styles.carteiraLabel, { color: cores.textoSecundario }]}>
                  A MINHA CARTEIRA
                </Text>
                <Text style={[styles.carteiraSaldo, { color: cores.textoPrincipal }]}>
                  {formatarValor(saldoTotal)}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color={cores.textoTerciario} />
          </View>

          <View style={[styles.carteiraDetalhes, { borderTopColor: cores.bordaSubtil }]}>
            <View style={styles.carteiraDetalheItem}>
              <Text style={[styles.carteiraDetalheLabel, { color: cores.textoSecundario }]}>
                Disponível
              </Text>
              <Text style={[styles.carteiraDetalheValor, { color: cores.textoPrincipal }]}>
                {formatarValor(carteira.saldoDisponivel)}
              </Text>
            </View>
            <View style={[styles.carteiraDivisor, { backgroundColor: cores.bordaSubtil }]} />
            <View style={styles.carteiraDetalheItem}>
              <Text style={[styles.carteiraDetalheLabel, { color: cores.textoSecundario }]}>
                Pendente
              </Text>
              <Text style={[styles.carteiraDetalheValor, { color: Colors.aviso }]}>
                {formatarValor(carteira.saldoPendente)}
              </Text>
            </View>
            <View style={[styles.carteiraDivisor, { backgroundColor: cores.bordaSubtil }]} />
            <View style={styles.carteiraDetalheItem}>
              <Text style={[styles.carteiraDetalheLabel, { color: cores.textoSecundario }]}>
                Créditos
              </Text>
              <Text style={[styles.carteiraDetalheValor, { color: cores.principal }]}>
                {formatarValor(carteira.saldoCreditos)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ============ REFERÊNCIA CTA (NOVO) ============ */}
        <TouchableOpacity
          style={styles.referenciaCard}
          onPress={() => router.push('/referencia' as any)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#FF7900', '#F15A24']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.referenciaConteudo}>
            <View style={styles.referenciaIcone}>
              <MaterialCommunityIcons name="gift-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.referenciaTitulo}>Convida e ganha 10%</Text>
              <Text style={styles.referenciaSubtitulo}>
                {totalConvidados > 0
                  ? `${totalConvidados} convidado${totalConvidados === 1 ? '' : 's'} • ${formatarValor(totalGanhoReferencia)} ganho`
                  : 'Partilha o teu código e começa a ganhar'}
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* ============ PERFIL COMPLETO ============ */}
        <View style={[styles.perfilCompletoCard, { backgroundColor: cores.fundoElevado }]}>
          <View style={styles.perfilCompletoHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.perfilCompletoTitulo, { color: cores.textoPrincipal }]}>
                {`Perfil ${perfilCompleto}% completo`}
              </Text>
              <Text style={[styles.perfilCompletoSubtitulo, { color: cores.textoSecundario }]}>
                {perfilCompleto < 100
                  ? 'Completa para receber selo de verificado'
                  : 'Perfil completo! Recebe 5x mais contactos'}
              </Text>
            </View>
            {perfilCompleto < 100 && (
              <TouchableOpacity
                onPress={() => router.push('/editar-perfil')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward-circle" size={32} color={cores.principal} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.perfilCompletoBar, { backgroundColor: cores.fundoSuave }]}>
            <View style={[styles.perfilCompletoFill, { width: `${perfilCompleto}%` }]}>
              <LinearGradient
                colors={['#FF7900', '#F15A24']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>

        {/* ============ STATS ============ */}
        <View style={[styles.stats, { backgroundColor: cores.fundoElevado }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValor, { color: cores.textoPrincipal }]}>12</Text>
            <Text style={[styles.statLabel, { color: cores.textoSecundario }]}>Desbloqueados</Text>
          </View>
          <View style={[styles.statDivisor, { backgroundColor: cores.bordaSubtil }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValor, { color: cores.textoPrincipal }]}>3</Text>
            <Text style={[styles.statLabel, { color: cores.textoSecundario }]}>Favoritos</Text>
          </View>
          <View style={[styles.statDivisor, { backgroundColor: cores.bordaSubtil }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValor, { color: cores.textoPrincipal }]}>4</Text>
            <Text style={[styles.statLabel, { color: cores.textoSecundario }]}>Conversas</Text>
          </View>
        </View>

        {/* ============ MENU ============ */}
        <View style={styles.menu}>
          <Text style={[styles.menuSeccaoTitulo, { color: cores.textoSecundario }]}>CONTA</Text>
          <MenuItem
            icone="person"
            cor={cores.principal}
            titulo="Informações pessoais"
            descricao="Nome, email, telefone"
            onPress={() => router.push('/editar-perfil')}
            cores={cores}
          />
          <MenuItem
            icone="wallet"
            cor={Colors.verde}
            titulo="Carteira e saques"
            descricao={formatarValor(saldoTotal)}
            badge={carteira.saldoPendente > 0 ? `+${formatarValor(carteira.saldoPendente)}` : undefined}
            onPress={() => router.push('/carteira' as any)}
            cores={cores}
          />
          <MenuItem
            icone="notifications"
            cor={Colors.aviso}
            titulo="Notificações"
            descricao="Preferências"
            cores={cores}
          />
          <MenuItem
            icone="color-palette"
            cor={Colors.premium}
            titulo="Aparência"
            descricao="Tema e cores da app"
            onPress={() => router.push('/aparencia')}
            cores={cores}
          />
          <MenuItem
            icone="lock-closed"
            cor={cores.principal}
            titulo="Privacidade e segurança"
            descricao="Password, 2FA"
            onPress={() => router.push('/auth/nova-password')}
            cores={cores}
          />

          <Text style={[styles.menuSeccaoTitulo, { color: cores.textoSecundario }]}>ACTIVIDADE</Text>
          <MenuItem
            icone="time"
            cor={cores.principal}
            titulo="Histórico de desbloqueios"
            descricao="12 imóveis"
            cores={cores}
          />
          <MenuItem
            icone="people"
            cor={Colors.verde}
            titulo="Programa de referência"
            descricao={totalConvidados > 0 ? `${totalConvidados} convidado${totalConvidados === 1 ? '' : 's'}` : 'Ganha 10% com indicados'}
            badge={totalGanhoReferencia > 0 ? formatarValor(totalGanhoReferencia) : undefined}
            onPress={() => router.push('/referencia' as any)}
            cores={cores}
          />
          <MenuItem
            icone="search"
            cor={Colors.premium}
            titulo="Pesquisas guardadas"
            descricao="3 alertas activos"
            cores={cores}
          />
          <MenuItem
            icone="star"
            cor={Colors.destaque}
            titulo="Minhas avaliações"
            descricao="Avalia anunciantes"
            cores={cores}
          />

          <Text style={[styles.menuSeccaoTitulo, { color: cores.textoSecundario }]}>SOBRE</Text>
          <MenuItem
            icone="help-circle"
            cor={cores.textoSecundario}
            titulo="Centro de ajuda"
            descricao="FAQ e suporte"
            cores={cores}
          />
          <MenuItem
            icone="document-text"
            cor={cores.textoSecundario}
            titulo="Termos de uso"
            descricao="Políticas"
            cores={cores}
          />
          <MenuItem
            icone="information-circle"
            cor={cores.textoSecundario}
            titulo="Sobre o GoHome"
            descricao="v1.2"
            cores={cores}
          />

          <TouchableOpacity
            style={styles.logoutBotao}
            onPress={() => router.replace('/onboarding/escolha-papel')}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.erro} />
            <Text style={styles.logoutTexto}>Trocar de perfil</Text>
          </TouchableOpacity>

          {/* ⚠️ BOTÃO DEV — só visível em desenvolvimento (__DEV__ === true).
              Desaparece automaticamente em builds de produção. */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.devResetBotao}
              onPress={confirmarResetDev}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh-circle" size={20} color="#FFFFFF" />
              <Text style={styles.devResetTexto}>🧪 DEV — Reset total da app</Text>
            </TouchableOpacity>
          )}

          <View style={styles.versao}>
            <Text style={[styles.versaoTexto, { color: cores.textoTerciario }]}>
              GoHome v1.2 · Let's Go Tech
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icone, cor, titulo, descricao, badge, onPress, cores }: any) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={[styles.menuItemIcone, { backgroundColor: `${cor}15` }]}>
        <Ionicons name={icone} size={20} color={cor} />
      </View>
      <View style={styles.menuItemInfo}>
        <Text style={[styles.menuItemTitulo, { color: cores.textoPrincipal }]}>{titulo}</Text>
        <Text style={[styles.menuItemDescricao, { color: cores.textoSecundario }]}>{descricao}</Text>
      </View>
      {badge && (
        <View style={[styles.menuItemBadge, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
          <Text style={styles.menuItemBadgeTexto}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  hero: { paddingBottom: Spacing.xxl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  heroTitulo: { ...Typography.h2, color: Colors.branco },
  heroBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfilInfo: { alignItems: 'center', paddingVertical: Spacing.md },

  avatarWrapper: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatarGrande: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarFoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  avatarGrandeLetra: {
    ...Typography.displayLG,
    color: Colors.branco,
    fontWeight: '800',
  },
  editarFotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0B2E59',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.branco,
    ...Sombras.md,
  },
  nome: { ...Typography.h1, color: Colors.branco, marginBottom: 4, textAlign: 'center' },
  tipoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipo: { ...Typography.body, color: Colors.branco, opacity: 0.95 },
  verificadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 3,
    marginLeft: 4,
  },
  verificadoBadgeTexto: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 10,
  },
  email: { ...Typography.caption, color: Colors.branco, opacity: 0.85, marginBottom: 6 },
  localizacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  localizacaoTexto: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // ============ CARTEIRA CARD ============
  carteiraCard: {
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    padding: Spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(11,46,89,0.06)',
    ...Sombras.lg,
    marginBottom: Spacing.md,
  },
  carteiraTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
  },
  carteiraLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  carteiraIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carteiraLabel: {
    ...Typography.captionBold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  carteiraSaldo: {
    ...Typography.h1,
    fontWeight: '800',
  },
  carteiraDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  carteiraDetalheItem: {
    flex: 1,
    alignItems: 'center',
  },
  carteiraDetalheLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginBottom: 2,
  },
  carteiraDetalheValor: {
    ...Typography.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  carteiraDivisor: {
    width: 1,
    height: 24,
  },

  // ============ REFERÊNCIA CARD (NOVO) ============
  referenciaCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 22,
    overflow: 'hidden',
    ...Sombras.colorida('#FF7900'),
  },
  referenciaConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  referenciaIcone: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  referenciaTitulo: {
    ...Typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 2,
  },
  referenciaSubtitulo: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },

  // Perfil completo
  perfilCompletoCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    ...Sombras.md,
    marginBottom: Spacing.md,
  },
  perfilCompletoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  perfilCompletoTitulo: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  perfilCompletoSubtitulo: {
    ...Typography.caption,
    marginTop: 2,
  },
  perfilCompletoBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  perfilCompletoFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Stats
  stats: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    ...Sombras.md,
    marginBottom: Spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValor: { ...Typography.h1, fontWeight: '800' },
  statLabel: { ...Typography.caption, marginTop: 2 },
  statDivisor: { width: 1 },

  // Menu
  menu: { padding: Spacing.lg, gap: Spacing.xs },
  menuSeccaoTitulo: {
    ...Typography.captionBold,
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  menuItemIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemInfo: { flex: 1 },
  menuItemTitulo: { ...Typography.bodyBold },
  menuItemDescricao: { ...Typography.caption, marginTop: 2 },
  menuItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  menuItemBadgeTexto: {
    color: Colors.verde,
    fontSize: 10,
    fontWeight: '700',
  },
  logoutBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.2)',
  },
  logoutTexto: { ...Typography.button, color: Colors.erro },

  // ============ DEV RESET (só em __DEV__) ============
  devResetBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    ...Sombras.sm,
  },
  devResetTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  versao: { alignItems: 'center', paddingTop: Spacing.xl },
  versaoTexto: { ...Typography.caption },
});