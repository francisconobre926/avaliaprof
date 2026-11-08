import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  Pressable,
  Clipboard,
} from 'react-native';
import TopBar, { TopBarBotao } from '../src/components/TopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Sombras } from '../src/theme/colors';
import { Spacing, Typography, Radius } from '../src/theme/typography';
import { useCores } from '../src/store/themeStore';
import {
  useReferralStore,
  labelEstadoConvidado,
  corEstadoConvidado,
  tempoRelativo,
  Convidado,
  EstadoConvidado,
} from '../src/store/referralStore';
import { useWalletStore, formatarValor } from '../src/store/walletStore';
import { useUserStore } from '../src/store/userStore';

import { Fonte } from '../src/theme/fonts';
import Icone from '../src/components/Icone';
export default function ReferenciaScreen() {
  const router = useRouter();
  const cores = useCores();

  // Stores
  const meuCodigo = useReferralStore(state => state.meuCodigo);
  const meuLink = useReferralStore(state => state.meuLink);
  const convidados = useReferralStore(state => state.convidados);
  const marcarComoPago = useReferralStore(state => state.marcarComoPago);
  const confirmarPagamento = useReferralStore(state => state.confirmarPagamento);
  const getTotalGanho = useReferralStore(state => state.getTotalGanho);
  const getTotalPendente = useReferralStore(state => state.getTotalPendente);
  const getTotalConvidados = useReferralStore(state => state.getTotalConvidados);
  const getConvidadosQuePagaram = useReferralStore(state => state.getConvidadosQuePagaram);
  const getTaxaConversao = useReferralStore(state => state.getTaxaConversao);

  const adicionarComissaoPendente = useWalletStore(state => state.adicionarComissaoPendente);
  const confirmarComissao = useWalletStore(state => state.confirmarComissao);

  const usuario = useUserStore(state => state.usuario);

  const [modalInfoVisivel, setModalInfoVisivel] = useState(false);
  const [modalDemoVisivel, setModalDemoVisivel] = useState(false);
  const [convidadoSeleccionado, setConvidadoSeleccionado] = useState<Convidado | null>(null);

  const totalGanho = getTotalGanho();
  const totalPendente = getTotalPendente();
  const totalConvidados = getTotalConvidados();
  const convidadosPagaram = getConvidadosQuePagaram();
  const taxaConversao = getTaxaConversao();

  const copiarCodigo = () => {
    Clipboard.setString(meuCodigo);
    Alert.alert('Copiado', `Código ${meuCodigo} copiado para a área de transferência`);
  };

  const copiarLink = () => {
    Clipboard.setString(meuLink);
    Alert.alert('Copiado', 'Link copiado para a área de transferência');
  };

  const partilhar = async () => {
    try {
      const nome = usuario?.nome?.split(' ')[0] || 'Alguém';
      const mensagem = `Olá! ${nome} convida-te para o GoHome — a nova app de classificados em Moçambique.\n\nImóveis, veículos, espaços e mais, num só sítio.\n\nUsa o meu código ${meuCodigo} ou abre o link:\n${meuLink}\n\nBoas descobertas!`;

      await Share.share({
        message: mensagem,
        title: 'Convite GoHome',
      });
    } catch (e) {
      console.warn('Erro ao partilhar:', e);
    }
  };

  // Simular que um convidado pagou
  const simularPagamento = async (convidado: Convidado) => {
    // Valor típico: anunciante paga ~150 MT, procurador paga 25-50 MT
    const valorPago = convidado.papel === 'anunciante' ? 150 : 50;

    const resultado = await marcarComoPago(convidado.id, valorPago);

    if (resultado) {
      // Adiciona comissão em pendente na carteira
      await adicionarComissaoPendente(
        resultado.comissao,
        `Comissão — ${convidado.papel === 'anunciante' ? 'Publicação' : 'Desbloqueio'} de ${convidado.nome.split(' ')[0]}`
      );

      Alert.alert(
        'Pagamento simulado',
        `${convidado.nome} pagou ${valorPago} MT.\n\nComissão: ${formatarValor(resultado.comissao)} (pendente).\n\nVai à carteira para confirmar.`,
        [{ text: 'OK' }]
      );
    }
  };

  // Simular confirmação do pagamento (webhook M-Pesa)
  const simularConfirmacao = async (convidado: Convidado) => {
    const resultado = await confirmarPagamento(convidado.id);

    if (resultado) {
      // Encontra a transacção pendente e confirma na carteira
      const transaccoes = useWalletStore.getState().carteira.transaccoes;
      const transaccaoPendente = transaccoes.find(
        t => t.tipo === 'referencia' && t.estado === 'pending'
          && t.descricao.includes(convidado.nome.split(' ')[0])
      );

      if (transaccaoPendente) {
        await confirmarComissao(transaccaoPendente.id);
      }

      Alert.alert(
        'Pagamento confirmado',
        `${formatarValor(resultado.comissao)} movido de Pendente para Disponível na tua carteira.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar
        titulo="Convida e ganha"
        onVoltar={() => router.back()}
        acoes={<TopBarBotao icone="help-circle-outline" rotulo="Ajuda" onPress={() => setModalInfoVisivel(true)} />}
      />

      {/* ============ HERO ============ */}
      <LinearGradient
        colors={cores.gradiente}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View>
          {/* Chamada principal */}
          <View style={styles.heroCenter}>
            <View style={styles.heroIconeContainer}>
              <Icone name="gift-outline" size={36} color={Colors.branco} />
            </View>
            <Text style={styles.heroTexto}>
              Ganha <Text style={styles.heroTextoDestaque}>10%</Text> de tudo que os teus convidados paguem no GoHome
            </Text>
            <Text style={styles.heroSubtexto}>
              Sem limite de ganhos. Para sempre.
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ============ CÓDIGO E LINK ============ */}
        <View style={[styles.codigoCard, { backgroundColor: cores.fundoElevado }]}>
          <Text style={[styles.codigoLabel, { color: cores.textoSecundario }]}>O TEU CÓDIGO</Text>

          <View style={[styles.codigoWrapper, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
            <Text style={[styles.codigoTexto, { color: cores.textoPrincipal }]}>
              {meuCodigo || '...'}
            </Text>
            <TouchableOpacity
              style={[styles.copiarBotao, { backgroundColor: cores.principal }]}
              onPress={copiarCodigo}
              activeOpacity={0.85}
            >
              <Ionicons name="copy" size={14} color={Colors.branco} />
              <Text style={styles.copiarBotaoTexto}>Copiar</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.linkLabel, { color: cores.textoTerciario }]} numberOfLines={1}>
            {meuLink}
          </Text>

          <View style={styles.accoes}>
            <TouchableOpacity
              style={styles.partilharBotao}
              onPress={partilhar}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={cores.gradiente}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Icone name="share-variant" size={18} color={Colors.branco} />
              <Text style={styles.partilharBotaoTexto}>Partilhar convite</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.linkBotao, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}
              onPress={copiarLink}
              activeOpacity={0.85}
            >
              <Icone name="link-variant" size={18} color={cores.textoPrincipal} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ ESTATÍSTICAS ============ */}
        <View style={styles.statsSeccao}>
          <Text style={[styles.statsSeccaoTitulo, { color: cores.textoPrincipal }]}>
            Os teus ganhos
          </Text>

          <View style={styles.statsRow}>
            <StatCard
              icone="cash-check"
              cor={Colors.verdeTexto}
              corFundo="rgba(52, 168, 83, 0.1)"
              label="Confirmado"
              valor={formatarValor(totalGanho)}
              cores={cores}
            />
            <StatCard
              icone="clock-outline"
              cor={Colors.aviso}
              corFundo="rgba(26, 115, 232, 0.1)"
              label="Pendente"
              valor={formatarValor(totalPendente)}
              cores={cores}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              icone="account-multiple"
              cor={cores.principal}
              corFundo={cores.principalClara}
              label="Convidados"
              valor={String(totalConvidados)}
              cores={cores}
            />
            <StatCard
              icone="trending-up"
              cor={Colors.premium}
              corFundo="rgba(154, 84, 0, 0.1)"
              label="Taxa conversão"
              valor={`${taxaConversao}%`}
              cores={cores}
            />
          </View>
        </View>

        {/* ============ LISTA DE CONVIDADOS ============ */}
        <View style={styles.convidadosSeccao}>
          <View style={styles.convidadosHeader}>
            <Text style={[styles.convidadosTitulo, { color: cores.textoPrincipal }]}>
              Convidados
            </Text>
            <Text style={[styles.convidadosSubtitulo, { color: cores.textoSecundario }]}>
              {`${convidadosPagaram} de ${totalConvidados} pagaram`}
            </Text>
          </View>

          {convidados.length === 0 ? (
            <View style={styles.vazioContainer}>
              <Icone name="account-plus-outline" size={48} color={cores.textoTerciario} />
              <Text style={[styles.vazioTitulo, { color: cores.textoPrincipal }]}>
                Ainda sem convidados
              </Text>
              <Text style={[styles.vazioTexto, { color: cores.textoSecundario }]}>
                Partilha o teu código para começar a ganhar
              </Text>
            </View>
          ) : (
            <View style={styles.convidadosLista}>
              {convidados.map((convidado) => (
                <ConvidadoItem
                  key={convidado.id}
                  convidado={convidado}
                  cores={cores}
                  onPress={() => {
                    setConvidadoSeleccionado(convidado);
                    setModalDemoVisivel(true);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* ============ CTA FINAL ============ */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={partilhar}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={cores.gradiente}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.ctaConteudo}>
            <Icone name="rocket-launch" size={32} color={Colors.branco} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitulo}>Pronto para ganhar mais?</Text>
              <Text style={styles.ctaTexto}>Partilha agora com amigos</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color={Colors.branco} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============ MODAL: INFO ============ */}
      <Modal
        visible={modalInfoVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalInfoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalInfoVisivel(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: cores.fundoElevado }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIcone, { backgroundColor: cores.principalClara }]}>
                <Ionicons name="information-circle" size={24} color={cores.principal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>
                  Como funciona
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalInfoVisivel(false)}
                style={[styles.modalFechar, { backgroundColor: cores.fundoSuave }]}
              >
                <Ionicons name="close" size={20} color={cores.textoSecundario} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <PassoInfo
                numero="1"
                titulo="Partilha o teu código"
                descricao="Envia o teu link ou código para amigos via WhatsApp, SMS ou redes sociais."
                cores={cores}
              />
              <PassoInfo
                numero="2"
                titulo="Eles registam-se com o teu código"
                descricao="Ao criar conta, basta usarem o teu código ou abrirem o teu link. Zero custo para eles."
                cores={cores}
              />
              <PassoInfo
                numero="3"
                titulo="Ganhas 10% de tudo que paguem"
                descricao="Sempre que publicarem anúncios, destacarem, ou pagarem desbloqueios, recebes 10%."
                cores={cores}
              />
              <PassoInfo
                numero="4"
                titulo="Levanta via M-Pesa (mín. 100 MT)"
                descricao="Quando tiveres 100 MT ou mais em saldo disponível, podes sacar para o teu M-Pesa."
                cores={cores}
              />

              <View style={[styles.infoBox, { backgroundColor: cores.principalClara }]}>
                <Ionicons name="shield-checkmark" size={18} color={cores.principal} />
                <Text style={[styles.infoBoxTexto, { color: cores.textoPrincipal }]}>
                  Sem truques. Só ganhas quando o teu convidado paga. Se o pagamento for revertido, a comissão também é.
                </Text>
              </View>

              <View style={[styles.excepcaoBox, { backgroundColor: cores.fundoSuave }]}>
                <Text style={[styles.excepcaoTitulo, { color: cores.textoPrincipal }]}>
                  Procurador convida procurador
                </Text>
                <Text style={[styles.excepcaoTexto, { color: cores.textoSecundario }]}>
                  Ganhas 5 MT por cada desbloqueio (ou 2,50 MT durante a promoção). Para outros tipos de pagamento, é sempre 10%.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL: DEMO (simular pagamento) ============ */}
      <Modal
        visible={modalDemoVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalDemoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalDemoVisivel(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: cores.fundoElevado }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIcone, { backgroundColor: 'rgba(154, 84, 0, 0.15)' }]}>
                <Icone name="flask-outline" size={24} color={Colors.premium} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>
                  Simulação (DEMO)
                </Text>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSecundario }]}>
                  {convidadoSeleccionado?.nome || ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalDemoVisivel(false)}
                style={[styles.modalFechar, { backgroundColor: cores.fundoSuave }]}
              >
                <Ionicons name="close" size={20} color={cores.textoSecundario} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.demoTexto, { color: cores.textoSecundario }]}>
              Em produção, estes eventos vêm do backend/M-Pesa. Aqui simulamos para testar.
            </Text>

            {convidadoSeleccionado && (
              <View style={styles.demoBotoes}>
                {convidadoSeleccionado.estado === 'cadastrado' && (
                  <TouchableOpacity
                    style={[styles.demoBotao, { backgroundColor: Colors.aviso }]}
                    onPress={() => {
                      simularPagamento(convidadoSeleccionado);
                      setModalDemoVisivel(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Icone name="cash-plus" size={20} color={Colors.branco} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.demoBotaoTitulo}>Simular pagamento</Text>
                      <Text style={styles.demoBotaoSubtitulo}>
                        {convidadoSeleccionado.papel === 'anunciante'
                          ? 'Paga 150 MT → ganhas 15 MT'
                          : 'Paga 50 MT → ganhas 5 MT'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {convidadoSeleccionado.estado === 'pagou_pendente' && (
                  <TouchableOpacity
                    style={[styles.demoBotao, { backgroundColor: Colors.verdeTexto }]}
                    onPress={() => {
                      simularConfirmacao(convidadoSeleccionado);
                      setModalDemoVisivel(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Icone name="check-circle" size={20} color={Colors.branco} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.demoBotaoTitulo}>Confirmar pagamento</Text>
                      <Text style={styles.demoBotaoSubtitulo}>
                        Comissão move para Disponível
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {convidadoSeleccionado.estado === 'pagou_confirmado' && (
                  <View style={[styles.demoFeito, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
                    <Icone name="check-decagram" size={32} color={Colors.verdeTexto} />
                    <Text style={[styles.demoFeitoTexto, { color: Colors.verdeTexto }]}>
                      Comissão já recebida
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ========================================================
// COMPONENTES AUXILIARES
// ========================================================

function StatCard({ icone, cor, corFundo, label, valor, cores }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
      <View style={[styles.statIcone, { backgroundColor: corFundo }]}>
        <Icone name={icone} size={18} color={cor} />
      </View>
      <Text style={[styles.statLabel, { color: cores.textoSecundario }]}>{label}</Text>
      <Text style={[styles.statValor, { color: cores.textoPrincipal }]}>{valor}</Text>
    </View>
  );
}

function ConvidadoItem({ convidado, cores, onPress }: any) {
  const corEstado = corEstadoConvidado(convidado.estado);
  const coresMap: Record<string, string> = {
    cinza: cores.textoSecundario,
    laranja: Colors.aviso,
    verde: Colors.verdeTexto,
    vermelho: Colors.erro,
  };
  const corFinal = coresMap[corEstado];
  const inicial = convidado.nome.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.convidadoItem, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.convidadoAvatar, { backgroundColor: cores.principalClara }]}>
        <Text style={[styles.convidadoInicial, { color: cores.principalTexto }]}>{inicial}</Text>
      </View>

      <View style={styles.convidadoInfo}>
        <Text style={[styles.convidadoNome, { color: cores.textoPrincipal }]}>
          {convidado.nome}
        </Text>
        <View style={styles.convidadoMeta}>
          <View style={[styles.convidadoPapel, { backgroundColor: cores.fundoSuave }]}>
            <Icone
              name={convidado.papel === 'anunciante' ? 'bullhorn-outline' : 'account-search-outline'}
              size={10}
              color={cores.textoSecundario}
            />
            <Text style={[styles.convidadoPapelTexto, { color: cores.textoSecundario }]}>
              {convidado.papel === 'anunciante' ? 'Anunciante' : 'Procurador'}
            </Text>
          </View>
          <Text style={[styles.convidadoTempo, { color: cores.textoTerciario }]}>
            {tempoRelativo(convidado.cadastradoEm)}
          </Text>
        </View>
      </View>

      <View style={styles.convidadoRight}>
        <View style={[styles.estadoBadge, { backgroundColor: `${corFinal}15` }]}>
          <View style={[styles.estadoBadgeDot, { backgroundColor: corFinal }]} />
          <Text style={[styles.estadoBadgeTexto, { color: corFinal }]}>
            {labelEstadoConvidado(convidado.estado)}
          </Text>
        </View>
        {convidado.comissaoGerada > 0 && (
          <Text style={[styles.convidadoComissao, { color: Colors.verdeTexto }]}>
            {`+${formatarValor(convidado.comissaoGerada)}`}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PassoInfo({ numero, titulo, descricao, cores }: any) {
  return (
    <View style={[styles.passoItem, { borderBottomColor: cores.bordaSubtil }]}>
      <View style={[styles.passoNumero, { backgroundColor: cores.principal }]}>
        <Text style={styles.passoNumeroTexto}>{numero}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.passoTitulo, { color: cores.textoPrincipal }]}>{titulo}</Text>
        <Text style={[styles.passoDescricao, { color: cores.textoSecundario }]}>{descricao}</Text>
      </View>
    </View>
  );
}

// ========================================================
// STYLES
// ========================================================

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: { paddingBottom: Spacing.xl },
  heroCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  heroIconeContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTexto: {
    ...Typography.h3,
    color: Colors.branco,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
  },
  heroTextoDestaque: {
    fontFamily: Fonte.tituloSemi,
    fontSize: 22,
  },
  heroSubtexto: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  scrollContent: { paddingBottom: Spacing.xxxl },

  // Código card
  codigoCard: {
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    ...Sombras.lg,
    marginBottom: Spacing.lg,
  },
  codigoLabel: {
    ...Typography.captionBold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  codigoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
  },
  codigoTexto: {
    ...Typography.h2,
    fontFamily: Fonte.tituloSemi,
    letterSpacing: 2,
    flex: 1,
  },
  copiarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  copiarBotaoTexto: {
    color: Colors.branco,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },
  linkLabel: {
    ...Typography.caption,
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  accoes: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  partilharBotao: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    overflow: 'hidden',
    gap: 8,
    ...Sombras.colorida(Colors.azul),
  },
  partilharBotaoTexto: {
    ...Typography.button,
    color: Colors.branco,
  },
  linkBotao: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Stats
  statsSeccao: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsSeccaoTitulo: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Sombras.sm,
  },
  statIcone: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 12,
    marginBottom: 2,
  },
  statValor: {
    ...Typography.h2,
    fontFamily: Fonte.tituloSemi,
  },

  // Convidados
  convidadosSeccao: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  convidadosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  convidadosTitulo: {
    ...Typography.h3,
  },
  convidadosSubtitulo: {
    ...Typography.caption,
  },
  convidadosLista: {
    gap: Spacing.sm,
  },
  convidadoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  convidadoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convidadoInicial: {
    ...Typography.h3,
    fontFamily: Fonte.corpoSemi,
  },
  convidadoInfo: { flex: 1 },
  convidadoNome: {
    ...Typography.bodyBold,
    marginBottom: 4,
  },
  convidadoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  convidadoPapel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  convidadoPapelTexto: {
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },
  convidadoTempo: {
    ...Typography.caption,
    fontSize: 12,
  },
  convidadoRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    gap: 4,
  },
  estadoBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  estadoBadgeTexto: {
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },
  convidadoComissao: {
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },

  // Vazio
  vazioContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  vazioTitulo: {
    ...Typography.bodyBold,
  },
  vazioTexto: {
    ...Typography.caption,
    textAlign: 'center',
  },

  // CTA
  ctaCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Sombras.colorida(Colors.azul),
  },
  ctaConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  ctaTitulo: {
    ...Typography.bodyBold,
    color: Colors.branco,
    fontSize: 15,
    marginBottom: 2,
  },
  ctaTexto: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  modalIcone: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitulo: { ...Typography.h3 },
  modalSubtitulo: { ...Typography.caption, marginTop: 2 },
  modalFechar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Passos
  passoItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  passoNumero: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passoNumeroTexto: {
    color: Colors.branco,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
  },
  passoTitulo: {
    ...Typography.bodyBold,
    marginBottom: 2,
  },
  passoDescricao: {
    ...Typography.caption,
    lineHeight: 18,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  infoBoxTexto: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },

  excepcaoBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
  },
  excepcaoTitulo: {
    ...Typography.bodyBold,
    fontSize: 13,
    marginBottom: 4,
  },
  excepcaoTexto: {
    ...Typography.caption,
    lineHeight: 18,
  },

  // Demo
  demoTexto: {
    ...Typography.caption,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  demoBotoes: {
    gap: Spacing.sm,
  },
  demoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  demoBotaoTitulo: {
    ...Typography.bodyBold,
    color: Colors.branco,
    marginBottom: 2,
  },
  demoBotaoSubtitulo: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  demoFeito: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  demoFeitoTexto: {
    ...Typography.bodyBold,
  },
});