import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Sombras } from '../../src/theme/colors';
import { Spacing, Typography, Radius } from '../../src/theme/typography';
import { useUserStore } from '../../src/store/userStore';
import { useCores } from '../../src/store/themeStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useReferralStore } from '../../src/store/referralStore';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import TopBar, { TopBarBotao } from '../../src/components/TopBar';
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
      <TopBar
        acoes={
          <>
            <TopBarBotao icone="settings-outline" rotulo="Definições" />
            <TopBarBotao icone="notifications-outline" rotulo="Notificações" />
          </>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.titulo, { color: cores.textoPrincipal }]} accessibilityRole="header">
          O meu perfil
        </Text>

        {/* ============ CARTÃO DO PERFIL ============ */}
        <View style={[styles.perfilCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <View style={styles.avatarWrapper}>
            {usuario?.foto ? (
              <Image source={{ uri: usuario.foto }} style={styles.avatarFoto} />
            ) : (
              <View style={[styles.avatarFoto, styles.avatarVazio, { backgroundColor: cores.fundoSuave }]}>
                <Text style={[styles.avatarLetra, { color: cores.textoPrincipal }]}>{inicialAvatar}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.editarFotoBadge, { backgroundColor: cores.textoPrincipal, borderColor: cores.fundoElevado }]}
              onPress={() => router.push('/editar-perfil')}
              activeOpacity={0.85}
              accessibilityLabel="Editar foto"
            >
              <Ionicons name="camera" size={12} color={cores.fundo} />
            </TouchableOpacity>
          </View>

          <View style={styles.perfilInfo}>
            <Text style={[styles.nome, { color: cores.textoPrincipal }]} numberOfLines={1}>
              {usuario?.nome || 'Sem nome'}
            </Text>
            <Text style={[styles.email, { color: cores.textoSecundario }]} numberOfLines={1}>
              {usuario?.email || 'sem email'}
            </Text>
            <View style={styles.perfilMeta}>
              <View style={[styles.tipoChip, { backgroundColor: cores.fundoSuave }]}>
                <Icone name="account-search" size={12} color={cores.textoSecundario} />
                <Text style={[styles.tipoTexto, { color: cores.textoSecundario }]}>Procurador</Text>
              </View>
              <View style={styles.localizacaoRow}>
                <Ionicons name="location-outline" size={12} color={cores.textoTerciario} />
                <Text style={[styles.localizacaoTexto, { color: cores.textoTerciario }]}>Beira, Sofala</Text>
              </View>
            </View>
          </View>
        </View>

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
            colors={['#E8760A', '#F15A24']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.referenciaConteudo}>
            <View style={styles.referenciaIcone}>
              <Icone name="gift-outline" size={28} color="#FFFFFF" />
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
                colors={['#E8760A', '#F15A24']}
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
  titulo: { ...Typography.h1, paddingHorizontal: Spacing.lg, marginTop: 16 },

  // ============ CARTÃO DO PERFIL ============
  perfilCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: Spacing.lg,
    marginTop: 12,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarWrapper: { position: 'relative' },
  avatarFoto: { width: 64, height: 64, borderRadius: 32 },
  avatarVazio: { justifyContent: 'center', alignItems: 'center' },
  avatarLetra: { fontSize: 26, fontFamily: Fonte.tituloSemi },
  editarFotoBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  perfilInfo: { flex: 1, minWidth: 0 },
  nome: { ...Typography.h2 },
  email: { fontFamily: Fonte.corpo, fontSize: 13, marginTop: 2 },
  perfilMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  tipoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tipoTexto: { fontFamily: Fonte.corpoMedio, fontSize: 11 },
  localizacaoRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  localizacaoTexto: { fontFamily: Fonte.corpoMedio, fontSize: 11 },

  // ============ CARTEIRA CARD ============
  carteiraCard: {
    marginHorizontal: Spacing.lg,
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
    fontFamily: Fonte.tituloSemi,
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
    fontFamily: Fonte.corpoSemi,
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
    ...Sombras.colorida('#E8760A'),
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
  statValor: { ...Typography.h1, fontFamily: Fonte.tituloSemi },
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
    fontFamily: Fonte.corpoSemi,
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
    backgroundColor: '#C2412D',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
    ...Sombras.sm,
  },
  devResetTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 0.3,
  },

  versao: { alignItems: 'center', paddingTop: Spacing.xl },
  versaoTexto: { ...Typography.caption },
});