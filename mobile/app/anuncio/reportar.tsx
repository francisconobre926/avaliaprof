/**
 * app/anuncio/reportar.tsx — Reportar anúncio ou fraude
 *
 * Vectores de reporte alinhados com docs/ANTI_FRAUDE.md:
 *   V1 — Anúncio falso (fotos/dados fabricados)
 *   V2 — Imóvel já arrendado/vendido  → se confirmado: 25 MT crédito
 *   V3 — Anunciante pediu dinheiro para visitar
 *   V7 — Esquema internacional (caução antes de visitar)
 *   V10 — Mensagens / chat malicioso
 *   Outro
 *
 * Fluxo:
 *   anuncio/[id] → "Reportar" → este ecrã → envia reporte → confirmação
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Typography, Spacing, Radius } from '../../src/theme/typography';
import { Sombras } from '../../src/theme/colors';
import { useCores } from '../../src/store/themeStore';

import { Fonte } from '../../src/theme/fonts';
import Icone from '../../src/components/Icone';
// ============================================================
// CORES GOHOME
// ============================================================
const AZUL_HERO_INICIO = '#0A6BC0';   // Azul GoHome — o mesmo da "Promoção lançamento"
const AZUL_HERO_FIM = '#095FAA';
const LARANJA_MARCA = '#E8760A';
const LARANJA_ESCURO = '#B95A05';
const VERDE_SUCESSO = '#2F7A4F';
const VERMELHO_ERRO = '#C2412D';

type MotivoReporte =
  | 'ja_arrendado'
  | 'anuncio_falso'
  | 'cobrou_visita'
  | 'preco_diferente'
  | 'fotos_nao_batem'
  | 'esquema_internacional'
  | 'mensagem_maliciosa'
  | 'outro';

interface Motivo {
  id: MotivoReporte;
  titulo: string;
  descricao: string;
  icone: any;
  cor: string;
  compensacao?: number;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
}

const MOTIVOS: Motivo[] = [
  {
    id: 'ja_arrendado',
    titulo: 'Imóvel já estava arrendado/vendido',
    descricao: 'Desbloqueei o contacto e descobri que já não está disponível.',
    icone: 'home-remove-outline',
    cor: LARANJA_MARCA,
    compensacao: 25,
    gravidade: 'media',
  },
  {
    id: 'anuncio_falso',
    titulo: 'Anúncio falso ou fraudulento',
    descricao: 'As fotos ou os dados do anúncio parecem fabricados.',
    icone: 'alert-octagon',
    cor: VERMELHO_ERRO,
    gravidade: 'critica',
  },
  {
    id: 'cobrou_visita',
    titulo: 'Pediu dinheiro para visitar',
    descricao: 'O anunciante exigiu pagamento para me deixar ver o imóvel.',
    icone: 'cash-remove',
    cor: VERMELHO_ERRO,
    gravidade: 'alta',
  },
  {
    id: 'preco_diferente',
    titulo: 'Preço diferente do anunciado',
    descricao: 'No contacto, o anunciante pediu valor maior do que o publicado.',
    icone: 'currency-usd-off',
    cor: AZUL_HERO_FIM,
    gravidade: 'media',
  },
  {
    id: 'fotos_nao_batem',
    titulo: 'Fotos não correspondem à realidade',
    descricao: 'O imóvel visitado é muito diferente do que mostram as fotos.',
    icone: 'image-off',
    cor: AZUL_HERO_FIM,
    gravidade: 'media',
  },
  {
    id: 'esquema_internacional',
    titulo: 'Pediu transferência internacional',
    descricao: 'Pediu caução antes de visitar, via Western Union ou similar.',
    icone: 'bank-off',
    cor: VERMELHO_ERRO,
    gravidade: 'critica',
  },
  {
    id: 'mensagem_maliciosa',
    titulo: 'Mensagem suspeita ou link malicioso',
    descricao: 'Enviou-me links estranhos ou pediu dados pessoais.',
    icone: 'message-alert',
    cor: VERMELHO_ERRO,
    gravidade: 'alta',
  },
  {
    id: 'outro',
    titulo: 'Outro motivo',
    descricao: 'Explica abaixo o que aconteceu.',
    icone: 'help-circle',
    cor: '#8A96A6',
    gravidade: 'baixa',
  },
];

export default function ReportarAnuncio() {
  const router = useRouter();
  const cores = useCores();
  const { id, titulo } = useLocalSearchParams<{ id?: string; titulo?: string }>();

  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoReporte | null>(null);
  const [descricaoExtra, setDescricaoExtra] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const motivo = MOTIVOS.find(m => m.id === motivoSeleccionado);
  const requereDescricao = motivoSeleccionado === 'outro';
  const podeEnviar = !!motivoSeleccionado && (!requereDescricao || descricaoExtra.trim().length >= 10);

  const enviarReporte = () => {
    if (!podeEnviar || !motivo) return;
    setEnviando(true);

    // Simulação de envio (quando backend estiver pronto: POST /reportes)
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
    }, 1200);
  };

  // ============ ECRÃ DE CONFIRMAÇÃO (após envio) ============
  if (enviado && motivo) {
    return (
      <View style={[styles.container, { backgroundColor: cores.fundo }]}>
        <StatusBar barStyle="light-content" backgroundColor={VERDE_SUCESSO} />
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.confirmContainer}>
            <View style={styles.confirmCirculo}>
              <Ionicons name="checkmark" size={60} color="#FFFFFF" />
            </View>
            <Text style={[styles.confirmTitulo, { color: cores.textoPrincipal }]}>
              Reporte enviado
            </Text>
            <Text style={[styles.confirmSubtitulo, { color: cores.textoSecundario }]}>
              Obrigado por ajudares a manter o GoHome seguro.{'\n'}
              A nossa equipa vai analisar o teu reporte em até 48 horas.
            </Text>

            {motivo.compensacao && (
              <View style={[styles.confirmBonus, { backgroundColor: 'rgba(232, 118, 10, 0.08)', borderColor: LARANJA_MARCA }]}>
                <Icone name="gift-outline" size={28} color={LARANJA_MARCA} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.confirmBonusTitulo, { color: cores.textoPrincipal }]}>
                    Compensação pendente
                  </Text>
                  <Text style={[styles.confirmBonusTexto, { color: cores.textoSecundario }]}>
                    Se o anunciante confirmar que o imóvel já estava arrendado, recebes{' '}
                    <Text style={{ fontFamily: Fonte.corpoSemi, color: LARANJA_MARCA }}>
                      {motivo.compensacao} MT em crédito interno
                    </Text>
                    .
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.confirmNota, { backgroundColor: cores.fundoSuave }]}>
              <Ionicons name="information-circle-outline" size={16} color={cores.textoSecundario} />
              <Text style={[styles.confirmNotaTexto, { color: cores.textoSecundario }]}>
                Em caso de fraude confirmada, a conta do anunciante pode ser suspensa ou banida permanentemente.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmBotao}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[LARANJA_MARCA, LARANJA_ESCURO]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.confirmBotaoTexto}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ============ ECRÃ PRINCIPAL ============
  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle="light-content" backgroundColor={AZUL_HERO_INICIO} />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <LinearGradient
          colors={[AZUL_HERO_INICIO, AZUL_HERO_FIM]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.headerBotao}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>SEGURANÇA</Text>
              <Text style={styles.headerTitulo}>Reportar anúncio</Text>
            </View>
            <View style={styles.headerBotao} />
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.heroIconeBg}>
              <Icone name="shield-alert" size={34} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitulo}>Ajuda-nos a proteger a comunidade</Text>
              <Text style={styles.heroSubtitulo}>
                Reportes anónimos. Analisados em até 48h.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {titulo && (
            <View style={[styles.anuncioInfo, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <View style={[styles.anuncioInfoIcone, { backgroundColor: cores.principalClara }]}>
                <Ionicons name="document-text" size={18} color={cores.principal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.anuncioInfoLabel, { color: cores.textoSecundario }]}>
                  A REPORTAR
                </Text>
                <Text style={[styles.anuncioInfoTitulo, { color: cores.textoPrincipal }]} numberOfLines={2}>
                  {titulo}
                </Text>
              </View>
            </View>
          )}

          <Text style={[styles.seccaoTitulo, { color: cores.textoPrincipal }]}>
            O que aconteceu?
          </Text>
          <Text style={[styles.seccaoSubtitulo, { color: cores.textoSecundario }]}>
            Escolhe o motivo que melhor descreve a situação
          </Text>

          <View style={styles.motivosLista}>
            {MOTIVOS.map((m) => {
              const seleccionado = motivoSeleccionado === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.motivoCard,
                    {
                      backgroundColor: cores.fundoElevado,
                      borderColor: seleccionado ? m.cor : cores.bordaSubtil,
                      borderWidth: seleccionado ? 2 : 1,
                    },
                  ]}
                  onPress={() => setMotivoSeleccionado(m.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.motivoIcone, { backgroundColor: `${m.cor}15` }]}>
                    <Icone name={m.icone} size={22} color={m.cor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.motivoCabecalho}>
                      <Text style={[styles.motivoTitulo, { color: cores.textoPrincipal }]}>
                        {m.titulo}
                      </Text>
                      {m.compensacao && (
                        <View style={[styles.compensacaoBadge, { backgroundColor: `${LARANJA_MARCA}20` }]}>
                          <Icone name="gift-outline" size={11} color={LARANJA_MARCA} />
                          <Text style={[styles.compensacaoTexto, { color: LARANJA_MARCA }]}>
                            +{m.compensacao} MT crédito
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.motivoDesc, { color: cores.textoSecundario }]}>
                      {m.descricao}
                    </Text>
                  </View>
                  {seleccionado && (
                    <Ionicons name="checkmark-circle" size={22} color={m.cor} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Campo de descrição extra */}
          {motivoSeleccionado && (
            <View style={[styles.descCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
              <Text style={[styles.descLabel, { color: cores.textoPrincipal }]}>
                {requereDescricao ? 'Descreve o que aconteceu' : 'Mais detalhes (opcional)'}
              </Text>
              <TextInput
                style={[
                  styles.descInput,
                  {
                    backgroundColor: cores.fundoSuave,
                    borderColor: cores.bordaSubtil,
                    color: cores.textoPrincipal,
                  },
                ]}
                placeholder={
                  requereDescricao
                    ? 'Explica em detalhe o que aconteceu (mínimo 10 caracteres)...'
                    : 'Adiciona contexto para ajudar a investigação...'
                }
                placeholderTextColor={cores.textoTerciario}
                multiline
                numberOfLines={5}
                maxLength={500}
                value={descricaoExtra}
                onChangeText={setDescricaoExtra}
                textAlignVertical="top"
              />
              <Text style={[styles.descContador, { color: cores.textoTerciario }]}>
                {descricaoExtra.length}/500
              </Text>
            </View>
          )}

          {/* Aviso privacidade */}
          <View style={[styles.privacidadeBox, { backgroundColor: 'rgba(10, 107, 192, 0.06)', borderColor: 'rgba(10, 107, 192, 0.2)' }]}>
            <Ionicons name="lock-closed" size={16} color={cores.principal} />
            <Text style={[styles.privacidadeTexto, { color: cores.textoSecundario }]}>
              O teu reporte é confidencial. O anunciante não vê quem o reportou.
            </Text>
          </View>

          {/* Botão enviar */}
          <TouchableOpacity
            style={[styles.botaoEnviar, !podeEnviar && { opacity: 0.5 }]}
            onPress={enviarReporte}
            disabled={!podeEnviar || enviando}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[LARANJA_MARCA, LARANJA_ESCURO]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {enviando ? (
              <>
                <Icone name="loading" size={20} color="#FFFFFF" />
                <Text style={styles.botaoEnviarTexto}>A enviar...</Text>
              </>
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
                <Text style={styles.botaoEnviarTexto}>Enviar reporte</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { backgroundColor: AZUL_HERO_INICIO },

  // Header
  header: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerBotao: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  headerLabel: {
    color: 'rgba(255,255,255,0.75)', fontSize: 10, letterSpacing: 1.5,
    fontFamily: Fonte.corpoSemi, marginBottom: 2,
  },
  headerTitulo: { color: '#FFFFFF', fontSize: 18, fontFamily: Fonte.corpoSemi },

  heroInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: Spacing.md, padding: 14, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  heroIconeBg: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: 'rgba(232, 118, 10, 0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitulo: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonte.corpoSemi, marginBottom: 3 },
  heroSubtitulo: { color: 'rgba(255,255,255,0.85)', fontFamily: Fonte.corpo, fontSize: 12 },

  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  // Anuncio info card
  anuncioInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  anuncioInfoIcone: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  anuncioInfoLabel: { fontSize: 10, fontFamily: Fonte.corpoSemi, letterSpacing: 0.8, marginBottom: 3 },
  anuncioInfoTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi },

  // Secção
  seccaoTitulo: { ...Typography.h2, marginBottom: 4 },
  seccaoSubtitulo: { ...Typography.body, marginBottom: Spacing.md, fontSize: 13 },

  // Motivos
  motivosLista: { gap: Spacing.sm, marginBottom: Spacing.lg },
  motivoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 16,
  },
  motivoIcone: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  motivoCabecalho: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  motivoTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, flex: 1, minWidth: '60%' },
  motivoDesc: { fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 17 },

  compensacaoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  compensacaoTexto: { fontSize: 10, fontFamily: Fonte.corpoSemi },

  // Descrição
  descCard: {
    borderRadius: 16, padding: 14, borderWidth: 1,
    marginBottom: Spacing.md,
  },
  descLabel: { fontSize: 14, fontFamily: Fonte.corpoSemi, marginBottom: 10 },
  descInput: {
    borderRadius: 12, borderWidth: 1,
    padding: 12, minHeight: 100,
    fontFamily: Fonte.corpo, fontSize: 14, lineHeight: 20,
  },
  descContador: {
    fontFamily: Fonte.corpo, fontSize: 11, textAlign: 'right', marginTop: 6,
  },

  // Privacidade
  privacidadeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
    marginBottom: Spacing.md,
  },
  privacidadeTexto: { flex: 1, fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 17 },

  // Botão enviar
  botaoEnviar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 16, overflow: 'hidden', gap: 10,
    ...Sombras.colorida(LARANJA_MARCA),
  },
  botaoEnviarTexto: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonte.corpoSemi },

  // ============ Confirmação ============
  confirmContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing.xl,
  },
  confirmCirculo: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: VERDE_SUCESSO,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: VERDE_SUCESSO, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  confirmTitulo: {
    ...Typography.h1, textAlign: 'center',
    marginBottom: 12, fontFamily: Fonte.tituloBold, fontSize: 26,
  },
  confirmSubtitulo: {
    ...Typography.body, textAlign: 'center',
    marginBottom: 24, lineHeight: 21, maxWidth: 310,
  },
  confirmBonus: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1.5,
    width: '100%', marginBottom: 16,
  },
  confirmBonusTitulo: { fontSize: 14, fontFamily: Fonte.corpoSemi, marginBottom: 4 },
  confirmBonusTexto: { fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 17 },
  confirmNota: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 12, marginBottom: 24, width: '100%',
  },
  confirmNotaTexto: { flex: 1, fontFamily: Fonte.corpo, fontSize: 11, lineHeight: 16 },
  confirmBotao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16,
    overflow: 'hidden',
    ...Sombras.colorida(LARANJA_MARCA),
  },
  confirmBotaoTexto: { color: '#FFFFFF', fontSize: 15, fontFamily: Fonte.corpoSemi },
});