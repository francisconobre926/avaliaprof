/**
 * app/confirmacao-publicacao.tsx — Ecrã de sucesso pós-publicação do anunciante
 *
 * Paleta GoHome aplicada:
 *  • Hero gradient = cores.gradiente (azul→laranja da marca)
 *  • Sombras coloridas no laranja GoHome (não azul do tema anterior)
 *  • Dica em gradiente de marca
 */

import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Share,
  Linking,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../src/components/TopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Sombras } from '../src/theme/colors';
import { Spacing, Typography, Radius } from '../src/theme/typography';
import { useCores } from '../src/store/themeStore';
import { useUserStore } from '../src/store/userStore';
import { obterAnuncioLocal, guardarAnuncioLocal } from '../src/store/anunciosLocal';

import { Fonte } from '../src/theme/fonts';
import Icone from '../src/components/Icone';
// ============================================================
// CORES GOHOME OFICIAIS (do logo)
// ============================================================
const AZUL_MARCA = Colors.azul;
const COR_ACENTO = Colors.azul;
const VERDE_SUCESSO = Colors.verdeTexto;

export default function ConfirmacaoPublicacao() {
  const router = useRouter();
  const cores = useCores();

  const params = useLocalSearchParams<{
    anuncioId?: string;
    titulo?: string;
    categoria?: string;
    zona?: string;
    valorPago?: string;
    referencia?: string;
  }>();

  const usuario = useUserStore(state => state.usuario);

  // Após sucesso, actualiza o registo local para o anúncio continuar visível
  useEffect(() => {
    let activo = true;
    const activarRegistoLocal = async () => {
      const id = Array.isArray(params.anuncioId) ? params.anuncioId[0] : params.anuncioId;
      if (!id) return;
      const existente = await obterAnuncioLocal(String(id));
      if (!existente || !activo) return;
      await guardarAnuncioLocal({
        ...existente,
        estadoPagamento: 'confirmado',
        publicadoEm: new Date().toISOString(),
      });
    };
    void activarRegistoLocal();
    return () => { activo = false; };
  }, [params.anuncioId]);

  // Animações
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  const anuncioId = params.anuncioId || 'novo-anuncio';
  const titulo = params.titulo || 'Casa T2 em Matacuane';
  const categoria = params.categoria || 'Casa';
  const zona = params.zona || 'Matacuane, Beira';
  const valorPago = parseFloat(params.valorPago || '150');
  const valorNormal = valorPago * 2;
  const referencia = params.referencia || `MP${Date.now().toString().slice(-8)}`;

  const dataAgora = new Date();
  const dataExpiracao = new Date(dataAgora);
  dataExpiracao.setDate(dataExpiracao.getDate() + 30);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(ringAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]),
    ]).start();
  }, []);

  const formatarData = (data: Date) => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${data.getDate()} ${meses[data.getMonth()]} ${data.getFullYear()}`;
  };

  const linkAnuncio = `https://gohome.co.mz/anuncio/${anuncioId}`;
  const mensagemPartilha = `Confere o meu anúncio no GoHome!\n\n${titulo}\n${zona}\n\n${linkAnuncio}`;

  const partilharWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(mensagemPartilha)}`;
    try {
      const podeAbrir = await Linking.canOpenURL(url);
      if (podeAbrir) await Linking.openURL(url);
      else Alert.alert('WhatsApp', 'WhatsApp não está instalado neste dispositivo.');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    }
  };

  const partilharFacebook = async () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkAnuncio)}`;
    try { await Linking.openURL(url); }
    catch (e) { Alert.alert('Erro', 'Não foi possível abrir o Facebook'); }
  };

  const partilharSMS = async () => {
    const url = `sms:?body=${encodeURIComponent(mensagemPartilha)}`;
    try { await Linking.openURL(url); }
    catch (e) { Alert.alert('Erro', 'Não foi possível abrir SMS'); }
  };

  const copiarLink = () => {
    Clipboard.setString(linkAnuncio);
    Alert.alert('Copiado', 'Link do anúncio copiado para a área de transferência');
  };

  const partilhaNativa = async () => {
    try {
      await Share.share({ message: mensagemPartilha, title: titulo });
    } catch (e) {
      console.warn('Erro ao partilhar:', e);
    }
  };

  const verAnuncio = () => {
    router.replace({ pathname: '/anuncio/[id]' as any, params: { id: anuncioId, origem: 'publicacao' } });
  };

  const voltarPainel = () => {
    router.replace('/(anunciante)' as any);
  };

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Anúncio publicado" onVoltar={voltarPainel} acoes={<></>} />

      {/* ============ HERO ANIMADO (gradiente marca GoHome: azul→laranja) ============ */}
      <LinearGradient
        colors={cores.gradiente}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View>
          <View style={styles.heroCenter}>
            <View style={styles.iconeContainer}>
              <Animated.View
                style={[
                  styles.anelPulsante,
                  { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
              />
              <Animated.View
                style={[styles.iconeCirculo, { transform: [{ scale: scaleAnim }] }]}
              >
                <Ionicons name="checkmark" size={56} color={VERDE_SUCESSO} />
              </Animated.View>
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.heroTitulo}>Anúncio publicado!</Text>
              <Text style={styles.heroSubtitulo}>
                Está agora visível para procuradores em todo o país
              </Text>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PREVIEW DO ANÚNCIO */}
        <View style={[styles.previewCard, { backgroundColor: cores.fundoElevado }]}>
          <View style={styles.previewHeader}>
            <View style={[styles.previewBadge, { backgroundColor: 'rgba(52, 168, 83, 0.12)' }]}>
              <View style={styles.previewBadgeDot} />
              <Text style={[styles.previewBadgeTexto, { color: VERDE_SUCESSO }]}>
                ACTIVO
              </Text>
            </View>
            <Text style={[styles.previewTempo, { color: cores.textoTerciario }]}>
              publicado agora
            </Text>
          </View>

          <Text style={[styles.previewTitulo, { color: cores.textoPrincipal }]} numberOfLines={2}>
            {titulo}
          </Text>

          <View style={styles.previewMeta}>
            <View style={styles.previewMetaItem}>
              <Icone name="shape-outline" size={14} color={cores.textoSecundario} />
              <Text style={[styles.previewMetaTexto, { color: cores.textoSecundario }]}>
                {categoria}
              </Text>
            </View>
            <View style={[styles.previewMetaDivisor, { backgroundColor: cores.bordaSubtil }]} />
            <View style={styles.previewMetaItem}>
              <Ionicons name="location" size={14} color={cores.textoSecundario} />
              <Text style={[styles.previewMetaTexto, { color: cores.textoSecundario }]}>
                {zona}
              </Text>
            </View>
          </View>
        </View>

        {/* DETALHES DA TRANSACÇÃO */}
        <View style={[styles.detalhesCard, { backgroundColor: cores.fundoElevado }]}>
          <Text style={[styles.detalhesTitulo, { color: cores.textoPrincipal }]}>
            Detalhes da transacção
          </Text>

          <View style={styles.detalheItem}>
            <View style={[styles.detalheIcone, { backgroundColor: 'rgba(52, 168, 83, 0.15)' }]}>
              <Icone name="cash" size={18} color={VERDE_SUCESSO} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detalheLabel, { color: cores.textoSecundario }]}>
                Valor pago
              </Text>
              <View style={styles.detalheValoresLinha}>
                <Text style={[styles.detalheValor, { color: cores.textoPrincipal }]}>
                  {`${valorPago} MT`}
                </Text>
                <Text style={[styles.detalheValorRiscado, { color: cores.textoTerciario }]}>
                  {`${valorNormal} MT`}
                </Text>
                <View style={[styles.descontoBadge, { backgroundColor: VERDE_SUCESSO }]}>
                  <Text style={styles.descontoBadgeTexto}>-50%</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.detalheDivisor, { backgroundColor: cores.bordaSubtil }]} />

          <View style={styles.detalheItem}>
            <View style={[styles.detalheIcone, { backgroundColor: 'rgba(26, 115, 232, 0.12)' }]}>
              <Icone name="calendar-check" size={18} color={AZUL_MARCA} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detalheLabel, { color: cores.textoSecundario }]}>
                Válido até
              </Text>
              <Text style={[styles.detalheValor, { color: cores.textoPrincipal }]}>
                {formatarData(dataExpiracao)}
              </Text>
              <Text style={[styles.detalheSubtexto, { color: cores.textoTerciario }]}>
                30 dias — podes prolongar depois
              </Text>
            </View>
          </View>

          <View style={[styles.detalheDivisor, { backgroundColor: cores.bordaSubtil }]} />

          <View style={styles.detalheItem}>
            <View style={[styles.detalheIcone, { backgroundColor: 'rgba(154, 84, 0, 0.15)' }]}>
              <Icone name="receipt" size={18} color={Colors.premium} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detalheLabel, { color: cores.textoSecundario }]}>
                Referência
              </Text>
              <Text style={[styles.detalheValor, { color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi, fontVariant: ['tabular-nums'] }]}>
                {referencia}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.copiarRefBotao, { backgroundColor: cores.fundoSuave }]}
              onPress={() => {
                Clipboard.setString(referencia);
                Alert.alert('Copiado', 'Referência copiada');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={cores.textoSecundario} />
            </TouchableOpacity>
          </View>

          <View style={[styles.detalheDivisor, { backgroundColor: cores.bordaSubtil }]} />

          <View style={styles.detalheItem}>
            <View style={[styles.detalheIcone, { backgroundColor: 'rgba(26, 115, 232, 0.12)' }]}>
              <Icone name="account-outline" size={18} color={AZUL_MARCA} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detalheLabel, { color: cores.textoSecundario }]}>
                Anunciante
              </Text>
              <Text style={[styles.detalheValor, { color: cores.textoPrincipal }]}>
                {usuario?.nome || 'Sem nome'}
              </Text>
              <Text style={[styles.detalheSubtexto, { color: cores.textoTerciario }]}>
                {`+258 ${usuario?.telefone || '—'}`}
              </Text>
            </View>
          </View>
        </View>

        {/* PARTILHA */}
        <View style={[styles.partilhaCard, { backgroundColor: cores.fundoElevado }]}>
          <View style={styles.partilhaHeader}>
            <Icone name="share-variant" size={20} color={COR_ACENTO} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.partilhaTitulo, { color: cores.textoPrincipal }]}>
                Partilha para ser visto por mais pessoas
              </Text>
              <Text style={[styles.partilhaSubtitulo, { color: cores.textoSecundario }]}>
                Anúncios partilhados recebem 3x mais contactos
              </Text>
            </View>
          </View>

          <View style={styles.partilhaGrid}>
            <TouchableOpacity style={styles.partilhaBotao} onPress={partilharWhatsApp} activeOpacity={0.8}>
              <View style={[styles.partilhaIcone, { backgroundColor: '#25D366' }]}>
                <Icone name="whatsapp" size={22} color={Colors.branco} />
              </View>
              <Text style={[styles.partilhaLabel, { color: cores.textoPrincipal }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.partilhaBotao} onPress={partilharFacebook} activeOpacity={0.8}>
              <View style={[styles.partilhaIcone, { backgroundColor: '#1877F2' }]}>
                <Icone name="facebook" size={22} color={Colors.branco} />
              </View>
              <Text style={[styles.partilhaLabel, { color: cores.textoPrincipal }]}>
                Facebook
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.partilhaBotao} onPress={partilharSMS} activeOpacity={0.8}>
              <View style={[styles.partilhaIcone, { backgroundColor: AZUL_MARCA }]}>
                <Icone name="message-text" size={22} color={Colors.branco} />
              </View>
              <Text style={[styles.partilhaLabel, { color: cores.textoPrincipal }]}>
                SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.partilhaBotao} onPress={copiarLink} activeOpacity={0.8}>
              <View style={[styles.partilhaIcone, { backgroundColor: cores.textoSecundario }]}>
                <Icone name="link-variant" size={22} color={Colors.branco} />
              </View>
              <Text style={[styles.partilhaLabel, { color: cores.textoPrincipal }]}>
                Copiar
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.partilhaOutros, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}
            onPress={partilhaNativa}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal-circle-outline" size={18} color={cores.textoSecundario} />
            <Text style={[styles.partilhaOutrosTexto, { color: cores.textoSecundario }]}>
              Mais opções de partilha
            </Text>
          </TouchableOpacity>
        </View>

        {/* DICA (gradiente marca GoHome) */}
        <View style={styles.dicaCard}>
          <LinearGradient
            colors={cores.gradiente}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.dicaConteudo}>
            <Icone name="lightbulb-on" size={24} color={Colors.branco} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dicaTitulo}>Dica para mais contactos</Text>
              <Text style={styles.dicaTexto}>
                Anúncios com vídeo recebem 3x mais pedidos de contacto. Podes adicionar um ao editar.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER FIXO */}
      <SafeAreaView
        edges={['bottom']}
        style={[styles.footer, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}
      >
        <TouchableOpacity
          style={[styles.ctaSecundario, { borderColor: cores.bordaSubtil }]}
          onPress={voltarPainel}
          activeOpacity={0.7}
        >
          <Text style={[styles.ctaSecundarioTexto, { color: cores.textoPrincipal }]}>
            Painel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaPrincipal}
          onPress={verAnuncio}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={cores.gradiente}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Ionicons name="eye" size={18} color={Colors.branco} />
          <Text style={styles.ctaPrincipalTexto}>Ver meu anúncio</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: { paddingBottom: Spacing.xxl },
  heroCenter: { alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  iconeContainer: {
    width: 120, height: 120,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg, position: 'relative',
  },
  anelPulsante: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.branco,
  },
  iconeCirculo: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.branco,
    justifyContent: 'center', alignItems: 'center',
    ...Sombras.lg,
  },

  heroTitulo: {
    ...Typography.displayMD, color: Colors.branco,
    textAlign: 'center', marginBottom: 6, fontFamily: Fonte.tituloSemi,
  },
  heroSubtitulo: {
    ...Typography.body, color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center', maxWidth: 300, lineHeight: 20,
  },

  scrollContent: { paddingBottom: 100 },

  previewCard: {
    marginHorizontal: Spacing.lg, marginTop: -Spacing.lg,
    padding: Spacing.md, borderRadius: Radius.xl,
    ...Sombras.lg, marginBottom: Spacing.md,
  },
  previewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  previewBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.sm, gap: 5,
  },
  previewBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: VERDE_SUCESSO },
  previewBadgeTexto: { fontSize: 12, fontFamily: Fonte.corpoSemi, letterSpacing: 0.5 },
  previewTempo: { ...Typography.caption, fontSize: 12 },
  previewTitulo: { ...Typography.bodyBold, fontSize: 16, marginBottom: Spacing.sm, lineHeight: 22 },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  previewMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewMetaTexto: { ...Typography.caption },
  previewMetaDivisor: { width: 1, height: 12 },

  detalhesCard: {
    marginHorizontal: Spacing.lg, padding: Spacing.md,
    borderRadius: Radius.xl,
    ...Sombras.md, marginBottom: Spacing.md,
  },
  detalhesTitulo: { ...Typography.h3, marginBottom: Spacing.md },
  detalheItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, paddingVertical: Spacing.sm,
  },
  detalheIcone: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detalheLabel: { ...Typography.caption, fontSize: 12, marginBottom: 3 },
  detalheValor: { ...Typography.bodyBold, fontSize: 15 },
  detalheValoresLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detalheValorRiscado: { ...Typography.caption, fontSize: 12, textDecorationLine: 'line-through' },
  descontoBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  descontoBadgeTexto: { color: Colors.branco, fontSize: 12, fontFamily: Fonte.corpoSemi },
  detalheSubtexto: { ...Typography.caption, fontSize: 12, marginTop: 2 },
  detalheDivisor: { height: 1, marginVertical: Spacing.xs },
  copiarRefBotao: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },

  partilhaCard: {
    marginHorizontal: Spacing.lg, padding: Spacing.md,
    borderRadius: Radius.xl,
    ...Sombras.md, marginBottom: Spacing.md,
  },
  partilhaHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  partilhaTitulo: { ...Typography.bodyBold, fontSize: 14, marginBottom: 2 },
  partilhaSubtitulo: { ...Typography.caption, fontSize: 12 },
  partilhaGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  partilhaBotao: { flex: 1, alignItems: 'center', gap: 6 },
  partilhaIcone: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    ...Sombras.sm,
  },
  partilhaLabel: { ...Typography.caption, fontSize: 12, fontFamily: Fonte.corpoSemi },
  partilhaOutros: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderRadius: Radius.md,
    gap: 6, borderWidth: 1,
  },
  partilhaOutrosTexto: { ...Typography.caption, fontSize: 12, fontFamily: Fonte.corpoSemi },

  dicaCard: {
    marginHorizontal: Spacing.lg, borderRadius: Radius.xl, overflow: 'hidden',
    ...Sombras.colorida(COR_ACENTO),
  },
  dicaConteudo: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.sm,
  },
  dicaTitulo: { ...Typography.bodyBold, color: Colors.branco, fontSize: 14, marginBottom: 2 },
  dicaTexto: { ...Typography.caption, color: 'rgba(255, 255, 255, 0.95)', fontSize: 12, lineHeight: 16 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    gap: Spacing.sm, borderTopWidth: 1,
  },
  ctaSecundario: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.full, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  ctaSecundarioTexto: { ...Typography.button },
  ctaPrincipal: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: Radius.full,
    overflow: 'hidden', gap: 8,
    ...Sombras.colorida(COR_ACENTO),
  },
  ctaPrincipalTexto: { ...Typography.button, color: Colors.branco },
});