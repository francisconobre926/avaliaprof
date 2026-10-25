import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
import TopBar from '../../src/components/TopBar';
import { Typography, Spacing } from '../../src/theme/typography';
// ============================================================
// CORES GOHOME OFICIAIS (do logo)
// ============================================================
const AZUL_MARCA = '#0A6BC0';
const AZUL_ESCURO = '#08508F';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';
const LARANJA_PALE = 'rgba(232, 118, 10, 0.1)';
const VERDE = '#168A50';

const PERIODOS = [
  { id: '7d', label: '7 dias', fullLabel: 'Últimos 7 dias' },
  { id: '30d', label: '30 dias', fullLabel: 'Últimos 30 dias' },
  { id: 'month', label: 'Este mês', fullLabel: 'Este mês' },
  { id: '12m', label: '12 meses', fullLabel: 'Últimos 12 meses' },
  { id: 'year', label: 'Este ano', fullLabel: 'Este ano' },
  { id: 'all', label: 'Desde o início', fullLabel: 'Desde o início' },
] as const;
type PeriodoId = typeof PERIODOS[number]['id'];

export default function DashboardAnunciante() {
  const router = useRouter();
  const cores = useCores();
  const usuario = useUserStore(state => state.usuario);
  const [periodo, setPeriodo] = useState<PeriodoId>('30d');
  const [seletorPeriodoVisivel, setSeletorPeriodoVisivel] = useState(false);
  const periodoSelecionado = PERIODOS.find(item => item.id === periodo) ?? PERIODOS[1];
  // Ligar esta lista ao histórico real de eventos da API. Não inserir datas fictícias.
  const diasComAtividade: string[] = [];
  const diasSemAtividade = useMemo(() => {
    // A contagem só pode ser calculada com a data oficial de início e os eventos reais.
    // Mantém-se indisponível enquanto esses dados não forem ligados ao backend.
    return null as number | null;
  }, [periodo, diasComAtividade.length]);

  const nomeUtilizador = usuario?.nome?.trim() || 'Anunciante';
  const primeiroNome = nomeUtilizador.split(/\s+/)[0] || 'Anunciante';
  const horaActual = new Date().getHours();
  const saudacao =
    horaActual < 12 ? 'Bom dia' : horaActual < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar temNotificacoes />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título + período */}
        <View style={styles.cabecalho}>
          <Text numberOfLines={1} style={[styles.titulo, { color: cores.textoPrincipal }]}>
            {`${saudacao}, ${primeiroNome}`}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Período seleccionado: ${periodoSelecionado.fullLabel}. Alterar período`}
            accessibilityHint="Abre o calendário e as opções de período do desempenho da conta"
            onPress={() => setSeletorPeriodoVisivel(true)}
            activeOpacity={0.75}
            style={[styles.periodoChip, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
          >
            <Ionicons name="calendar-outline" size={15} color={cores.textoSecundario} />
            <Text numberOfLines={1} style={[styles.periodoChipTexto, { color: cores.textoPrincipal }]}>
              {periodoSelecionado.fullLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={cores.textoSecundario} />
          </TouchableOpacity>
        </View>

        {/* Resumo principal */}
        <View style={[styles.revenueCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
          <View style={styles.revenueIcon}>
            <Ionicons name="stats-chart-outline" size={22} color={LARANJA_MARCA} />
          </View>
          <View style={styles.revenueMain}>
            <Text style={[styles.revenueLabel, { color: cores.textoSecundario }]}>Receita este mês</Text>
            <Text style={[styles.revenueValue, { color: cores.textoPrincipal }]}>12.450 MT</Text>
          </View>
          <View style={styles.growthPill}>
            <Ionicons name="trending-up" size={15} color={VERDE} />
            <Text style={styles.growthText}>+23%</Text>
          </View>
          <View style={[styles.revenueFooter, { borderTopColor: cores.bordaSubtil }]}>
            <View style={styles.revenueMeta}>
              <Ionicons name="home-outline" size={16} color={cores.textoSecundario} />
              <Text style={[styles.revenueMetaText, { color: cores.textoSecundario }]}>7 publicações</Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: cores.bordaSubtil }]} />
            <View style={styles.revenueMeta}>
              <Ionicons name="people-outline" size={16} color={cores.textoSecundario} />
              <Text style={[styles.revenueMetaText, { color: cores.textoSecundario }]}>34 desbloqueios</Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.quickActions}>
          <QuickAction
            title={'Publicar\nanúncio'}
            icon="add-circle-outline"
            primary
            onPress={() => router.push('/(anunciante)/publicar')}
          />
          <QuickAction
            title={'Meus\nanúncios'}
            icon="list-outline"
            onPress={() => router.push('/(anunciante)/anuncios')}
          />
          <QuickAction
            title="Estatísticas"
            icon="bar-chart-outline"
            onPress={() => router.push('/(anunciante)/anuncios')}
          />
        </View>

        {/* STATS GRID */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: cores.textoPrincipal }]}>
                Estatísticas rápidas
              </Text>
              <Text style={[styles.sectionSubtitle, { color: cores.textoSecundario }]}>
                {`Desempenho: ${periodoSelecionado.fullLabel.toLowerCase()}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.textLink} activeOpacity={0.8}>
              <Text style={styles.textLinkLabel}>Ver detalhes</Text>
              <Ionicons name="chevron-forward" size={16} color={LARANJA_MARCA} />
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="eye-outline" color={AZUL_MARCA} tint="rgba(10, 107, 192, 0.08)"
              value="1.847" label="Visualizações" trend="+15%" cores={cores}
            />
            <StatCard
              icon="bookmark-outline" color={LARANJA_MARCA} tint={LARANJA_PALE}
              value="234" label="Favoritos" trend="+8%" cores={cores}
            />
            <StatCard
              icon="lock-open-outline" color={VERDE} tint="#E8F8F0"
              value="34" label="Desbloqueios" trend="+23%" cores={cores}
            />
            <StatCard
              icon="chatbubble-ellipses-outline" color={AZUL_ESCURO} tint="rgba(0, 97, 166, 0.08)"
              value="19" label="Mensagens" trend="+12%" cores={cores}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: cores.textoPrincipal }]}>Dias sem actividade</Text>
              <Text style={[styles.sectionSubtitle, { color: cores.textoSecundario }]}>Período: {periodoSelecionado.fullLabel}</Text>
            </View>
            <View style={styles.inactiveBadge}><Ionicons name="calendar-outline" size={14} color={AZUL_ESCURO} /><Text style={styles.inactiveBadgeText}>Histórico</Text></View>
          </View>
          <View style={styles.inactiveCard}>
            <View style={styles.inactiveIcon}><Ionicons name="time-outline" size={23} color={AZUL_MARCA} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inactiveTitle}>{diasSemAtividade === null ? 'Histórico de actividade por ligar' : `${diasSemAtividade} dias sem actividade`}</Text>
              <Text style={styles.inactiveDescription}>Serão apresentados aqui os dias em que não houve publicações, contactos ou outras acções. O histórico começa na data oficial de início da GoHome.</Text>
            </View>
          </View>
        </View>

        {/* MEUS ANÚNCIOS RECENTES */}
        <View style={[styles.section, styles.listingsSection]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: cores.textoPrincipal }]}>
                Meus anúncios recentes
              </Text>
              <Text style={[styles.sectionSubtitle, { color: cores.textoSecundario }]}>
                Acompanha as tuas publicações
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(anunciante)/anuncios')}
              style={styles.textLink}
              activeOpacity={0.8}
            >
              <Text style={styles.textLinkLabel}>Ver todos</Text>
              <Ionicons name="chevron-forward" size={16} color={LARANJA_MARCA} />
            </TouchableOpacity>
          </View>
          <View style={styles.listingsList}>
            <ListingCard title="Apartamento T2" location="Beira, Macúti" price="8.500 MT/mês" status="Activo" statusType="active" cores={cores} />
            <ListingCard title="Quarto perto da UZ" location="Beira, Munhava" price="3.000 MT/mês" status="Pendente" statusType="pending" cores={cores} />
            <ListingCard title="Casa T3 com quintal" location="Beira, Matacuane" price="35.000 MT/mês" status="Em revisão" statusType="review" cores={cores} />
          </View>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal
        visible={seletorPeriodoVisivel}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSeletorPeriodoVisivel(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSeletorPeriodoVisivel(false)} />
          <View style={styles.periodModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalEyebrow}>ANÁLISE DE ACTIVIDADE</Text>
                <Text style={styles.modalTitle}>Escolher período</Text>
                <Text style={styles.modalSubtitle}>Selecciona um período para consultar os dias.</Text>
              </View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Fechar" onPress={() => setSeletorPeriodoVisivel(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={AZUL_ESCURO} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalPeriodGrid}>
              {PERIODOS.map(item => {
                const ativo = periodo === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativo }}
                    onPress={() => setPeriodo(item.id)}
                    activeOpacity={0.8}
                    style={[styles.modalPeriodOption, ativo && styles.modalPeriodOptionActive]}
                  >
                    <Text style={[styles.modalPeriodLabel, ativo && styles.modalPeriodLabelActive]}>{item.fullLabel}</Text>
                    <Ionicons name={ativo ? 'radio-button-on' : 'radio-button-off'} size={19} color={ativo ? AZUL_MARCA : '#9AA8B8'} />
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.daysPanel}>
              <View style={styles.daysPanelHeader}>
                <View style={styles.daysPanelIcon}><Ionicons name="calendar-clear-outline" size={18} color={AZUL_MARCA} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.daysPanelTitle}>{periodoSelecionado.fullLabel}</Text>
                  <Text style={styles.daysPanelSubtitle}>Dias disponíveis no histórico</Text>
                </View>
              </View>
              <View style={styles.daysEmptyState}>
                <Ionicons name="time-outline" size={23} color="#8A9AAF" />
                <Text style={styles.daysEmptyTitle}>Histórico por ligar</Text>
                <Text style={styles.daysEmptyText}>Quando o histórico real da GoHome estiver ligado, os dias deste período aparecerão aqui. Só serão incluídos dias desde o início oficial da operação.</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalDoneButton} onPress={() => setSeletorPeriodoVisivel(false)} activeOpacity={0.85}>
              <Text style={styles.modalDoneText}>Aplicar período</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// SUB COMPONENTES
// ============================================================
function QuickAction({ title, icon, primary, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title.replace('\n', ' ')}
      activeOpacity={0.78}
      style={[styles.actionCard, primary && styles.actionCardPrimary]}
    >
      <View style={[styles.actionIcon, primary && styles.actionIconPrimary]}>
        <Ionicons name={icon} size={27} color={primary ? '#FFFFFF' : LARANJA_MARCA} />
      </View>
      <View style={styles.actionBottom}>
        <Text style={[styles.actionTitle, primary && styles.actionTitlePrimary]}>{title}</Text>
        <Ionicons name="chevron-forward" size={16} color={primary ? '#FFFFFF' : AZUL_ESCURO} />
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ icon, color, tint, value, label, trend, cores }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color: cores.textoPrincipal }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: cores.textoSecundario }]}>{label}</Text>
      </View>
      <View style={styles.statTrend}>
        <Ionicons name="trending-up" size={12} color={VERDE} />
        <Text style={styles.statTrendText}>{trend}</Text>
      </View>
    </View>
  );
}

function ListingCard({ title, location, price, status, statusType, cores }: any) {
  const statusStyle =
    statusType === 'active' ? styles.statusActive :
    statusType === 'pending' ? styles.statusPending :
    styles.statusReview;
  const statusTextStyle =
    statusType === 'active' ? styles.statusTextActive :
    statusType === 'pending' ? styles.statusTextPending :
    styles.statusTextReview;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${location}, ${price}, estado ${status}`}
      activeOpacity={0.78}
      style={[styles.listingCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
    >
      <View style={styles.listingThumb}>
        <Icone name="home-city-outline" size={32} color={LARANJA_ESCURO} />
      </View>
      <View style={styles.listingInfo}>
        <Text style={[styles.listingTitle, { color: cores.textoPrincipal }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.listingLocationRow}>
          <Ionicons name="location-outline" size={14} color={LARANJA_MARCA} />
          <Text style={[styles.listingLocation, { color: cores.textoSecundario }]} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <Text style={[styles.listingPrice, { color: cores.textoPrincipal }]}>{price}</Text>
      </View>
      <View style={styles.listingRight}>
        <TouchableOpacity accessibilityLabel="Mais opções do anúncio" style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={18} color={cores.textoSecundario} />
        </TouchableOpacity>
        <View style={[styles.statusPill, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>{status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cabecalho: { paddingHorizontal: Spacing.lg, marginTop: 16 },
  titulo: { ...Typography.h1 },
  periodoChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5,
    marginTop: 10, paddingVertical: 6, paddingHorizontal: 11,
    borderRadius: 999, borderWidth: 1,
  },
  periodoChipTexto: { fontSize: 13, fontFamily: Fonte.corpoMedio, flexShrink: 1 },

  revenueCard: {
    marginHorizontal: 18, marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap',
  },
  revenueIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: LARANJA_PALE,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  revenueLabel: { fontSize: 12, fontFamily: Fonte.corpoMedio },
  revenueValue: { fontSize: 26, fontFamily: Fonte.tituloSemi, letterSpacing: -0.7, marginTop: 2 },
  revenueFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  revenueMetaText: { fontSize: 12, fontFamily: Fonte.corpoMedio },
  metaDivider: { width: 1, height: 16 },
  container: { flex: 1, backgroundColor: '#F6F8FB' },
  scrollContent: { paddingBottom: 28, width: '100%', maxWidth: 1100, alignSelf: 'center' },

  inactiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  inactiveBadgeText: { color: AZUL_ESCURO, fontSize: 10, fontFamily: Fonte.corpoSemi },
  inactiveCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: '#E4EAF2', backgroundColor: '#FFFFFF' },
  inactiveIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EAF2FA', alignItems: 'center', justifyContent: 'center' },
  inactiveTitle: { color: AZUL_ESCURO, fontSize: 13, fontFamily: Fonte.corpoSemi, marginBottom: 5 },
  inactiveDescription: { color: '#64748B', fontFamily: Fonte.corpo, fontSize: 11, lineHeight: 16 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'stretch' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(13, 31, 51, 0.48)' },
  periodModal: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: '#102A43', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 20 },
  modalHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 3, backgroundColor: '#D8E0E9', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  modalTitleGroup: { flex: 1, paddingRight: 12 },
  modalEyebrow: { color: LARANJA_ESCURO, fontSize: 9, letterSpacing: 1.3, fontFamily: Fonte.corpoBold, marginBottom: 6 },
  modalTitle: { color: AZUL_ESCURO, fontSize: 23, fontFamily: Fonte.tituloBold, letterSpacing: -0.5 },
  modalSubtitle: { color: '#687A90', fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 17, marginTop: 5 },
  modalClose: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F6FA' },
  modalPeriodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  modalPeriodOption: { width: '48%', minHeight: 48, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E4EAF1', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  modalPeriodOptionActive: { borderColor: AZUL_MARCA, backgroundColor: '#F0F8FF' },
  modalPeriodLabel: { flex: 1, color: '#42556B', fontSize: 11, fontFamily: Fonte.corpoSemi },
  modalPeriodLabelActive: { color: AZUL_ESCURO },
  daysPanel: { borderWidth: 1, borderColor: '#E5EBF2', backgroundColor: '#F8FAFD', borderRadius: 18, padding: 13, marginBottom: 16 },
  daysPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  daysPanelIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E8F4FE', alignItems: 'center', justifyContent: 'center' },
  daysPanelTitle: { color: AZUL_ESCURO, fontSize: 13, fontFamily: Fonte.corpoSemi },
  daysPanelSubtitle: { color: '#718197', fontFamily: Fonte.corpo, fontSize: 10, marginTop: 3 },
  daysEmptyState: { alignItems: 'center', paddingHorizontal: 12, paddingTop: 18, paddingBottom: 10 },
  daysEmptyTitle: { color: AZUL_ESCURO, fontSize: 12, fontFamily: Fonte.corpoSemi, marginTop: 8 },
  daysEmptyText: { color: '#687A90', fontFamily: Fonte.corpo, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  modalDoneButton: { minHeight: 50, backgroundColor: AZUL_MARCA, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  modalDoneText: { color: '#FFFFFF', fontSize: 13, fontFamily: Fonte.corpoSemi },

  revenueMain: { flex: 1, paddingTop: 2 },
  growthPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E5F7EA',
    paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12,
  },
  growthText: { color: VERDE, fontSize: 12, fontFamily: Fonte.corpoSemi },
  revenueMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  quickActions: { flexDirection: 'row', paddingHorizontal: 18, gap: 10, marginTop: 18, marginBottom: 26 },
  actionCard: {
    flex: 1, minHeight: 112, padding: 12, borderRadius: 21,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7ECF2',
    justifyContent: 'space-between',
    shadowColor: AZUL_ESCURO, shadowOpacity: 0.045, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  actionCardPrimary: { backgroundColor: LARANJA_MARCA, borderColor: LARANJA_MARCA },
  actionIcon: {
    width: 42, height: 42, borderRadius: 15,
    backgroundColor: LARANJA_PALE,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIconPrimary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  actionBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, marginTop: 10 },
  actionTitle: { flex: 1, color: AZUL_ESCURO, fontSize: 12, lineHeight: 16, fontFamily: Fonte.corpoSemi },
  actionTitlePrimary: { color: '#FFFFFF' },

  section: { paddingHorizontal: 18, marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13, gap: 8 },
  sectionTitle: { fontSize: 18, fontFamily: Fonte.corpoSemi, letterSpacing: -0.35 },
  sectionSubtitle: { fontFamily: Fonte.corpo, fontSize: 11, marginTop: 4 },
  textLink: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  textLinkLabel: { color: LARANJA_MARCA, fontSize: 12, fontFamily: Fonte.corpoSemi },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%', minHeight: 108,
    borderWidth: 1, borderRadius: 20, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 9,
    shadowColor: AZUL_ESCURO, shadowOpacity: 0.04, shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  statIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1, minWidth: 0 },
  statValue: { fontSize: 20, fontFamily: Fonte.tituloSemi },
  statLabel: { fontFamily: Fonte.corpo, fontSize: 10, lineHeight: 14, marginTop: 2 },
  statTrend: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: '#ECF8EF',
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 3,
  },
  statTrendText: { color: VERDE, fontSize: 9, fontFamily: Fonte.corpoSemi },

  listingsSection: { marginBottom: 12 },
  listingsList: { gap: 10 },
  listingCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 20, padding: 10, gap: 11,
    shadowColor: AZUL_ESCURO, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1,
  },
  listingThumb: {
    width: 72, height: 74, borderRadius: 16,
    backgroundColor: '#FFF0E3',
    alignItems: 'center', justifyContent: 'center',
  },
  listingInfo: { flex: 1, minWidth: 0 },
  listingTitle: { fontSize: 13, fontFamily: Fonte.corpoSemi },
  listingLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  listingLocation: { fontFamily: Fonte.corpo, fontSize: 10, flexShrink: 1 },
  listingPrice: { fontSize: 12, fontFamily: Fonte.corpoSemi, marginTop: 6 },
  listingRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 1 },
  moreButton: { padding: 2 },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  statusActive: { backgroundColor: '#E4F7E9' },
  statusPending: { backgroundColor: 'rgba(10, 107, 192, 0.1)' },
  statusReview: { backgroundColor: 'rgba(232, 118, 10, 0.12)' },
  statusText: { fontSize: 9, fontFamily: Fonte.corpoSemi },
  statusTextActive: { color: VERDE },
  statusTextPending: { color: AZUL_MARCA },
  statusTextReview: { color: LARANJA_ESCURO },
});