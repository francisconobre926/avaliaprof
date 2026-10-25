import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Sombras } from '../src/theme/colors';
import { Spacing, Typography, Radius } from '../src/theme/typography';
import { useCores } from '../src/store/themeStore';
import {
  useWalletStore,
  labelTipoTransacao,
  iconeTipoTransacao,
  type Transacao,
} from '../src/store/walletStore';

function formatarValor(valor: number): string {
  return `${Number(valor || 0).toLocaleString('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MT`;
}

function tempoRelativo(dataISO: string): string {
  const data = new Date(dataISO);
  if (Number.isNaN(data.getTime())) return 'Data indisponível';
  const segundos = Math.max(0, Math.floor((Date.now() - data.getTime()) / 1000));
  if (segundos < 60) return 'Agora';
  if (segundos < 3600) return `Há ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `Há ${Math.floor(segundos / 3600)} h`;
  if (segundos < 604800) return `Há ${Math.floor(segundos / 86400)} dias`;
  return data.toLocaleDateString('pt-MZ');
}

type AbaActiva = 'tudo' | 'entradas' | 'saidas';

export default function CarteiraScreen() {
  const router = useRouter();
  const cores = useCores();

  const saldo = useWalletStore(state => state.saldo);
  const transaccoes = useWalletStore(state => state.transacoes ?? []);
  const carregado = useWalletStore(state => state.carregado);
  const carregarCarteira = useWalletStore(state => state.carregarCarteira);
  const sacar = useWalletStore(state => state.sacar);
  const podeSacar = saldo >= 100;

  const [modalSaqueVisivel, setModalSaqueVisivel] = useState(false);
  const [modalInfoVisivel, setModalInfoVisivel] = useState(false);
  const [valorSaque, setValorSaque] = useState('');
  const [numeroMPesa, setNumeroMPesa] = useState('');
  const [aProcessar, setAProcessar] = useState(false);
  const [abaActiva, setAbaActiva] = useState<AbaActiva>('tudo');

  useEffect(() => {
    if (!carregado) void carregarCarteira();
  }, [carregado, carregarCarteira]);

  // Filtrar transacções pela aba
  const transaccoesFiltradas = transaccoes.filter(t => {
    if (abaActiva === 'tudo') return true;
    if (abaActiva === 'entradas') return t.valor > 0;
    return t.valor < 0;
  });

  const handlePedirSaque = async () => {
    const valor = parseFloat(valorSaque);

    if (!valor || valor <= 0) {
      Alert.alert('Erro', 'Introduz um valor válido');
      return;
    }

    if (valor < 100) {
      Alert.alert('Saque mínimo', 'O saque mínimo é de 100 MT');
      return;
    }

    if (valor > saldo) {
      Alert.alert('Saldo insuficiente', `Tens apenas ${formatarValor(saldo)} disponível`);
      return;
    }

    if (!numeroMPesa || numeroMPesa.length < 9) {
      Alert.alert('Erro', 'Introduz um número M-Pesa válido (ex: 841234567)');
      return;
    }

    setAProcessar(true);
    try {
      const resultado = await sacar(valor);
      if (resultado.sucesso) {
        setModalSaqueVisivel(false);
        setValorSaque('');
        setNumeroMPesa('');
        Alert.alert(
          'Saque registado no protótipo',
          `${formatarValor(valor)} foi registado na carteira. O envio real para o número +258 ${numeroMPesa} ainda precisa de integração com a API M-Pesa.`
        );
      } else {
        Alert.alert('Não foi possível sacar', resultado.erro ?? 'Verifica o saldo e tenta novamente.');
      }
    } catch {
      Alert.alert('Erro', 'Ocorreu um problema ao processar o saque.');
    } finally {
      setAProcessar(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ============ HERO ============ */}
      <LinearGradient
        colors={cores.gradiente}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroHeader}>
            <TouchableOpacity
              style={styles.heroBotao}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.heroTitulo}>A minha carteira</Text>
            <TouchableOpacity
              style={styles.heroBotao}
              onPress={() => setModalInfoVisivel(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="help-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Saldo principal (Disponível) */}
          <View style={styles.saldoPrincipal}>
            <Text style={styles.saldoPrincipalLabel}>SALDO DISPONÍVEL</Text>
            <Text style={styles.saldoPrincipalValor}>
              {formatarValor(saldo)}
            </Text>
            <Text style={styles.saldoPrincipalSub}>
              {podeSacar
                ? 'Pronto para sacar via M-Pesa'
                : `Faltam ${formatarValor(100 - saldo)} para o saque mínimo`}
            </Text>
          </View>

          {/* Botão sacar */}
          <TouchableOpacity
            style={[styles.sacarBotao, !podeSacar && styles.sacarBotaoDesactivado]}
            onPress={() => setModalSaqueVisivel(true)}
            disabled={!podeSacar}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="bank-transfer-out"
              size={20}
              color={podeSacar ? cores.principal : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[
              styles.sacarBotaoTexto,
              { color: podeSacar ? cores.principal : 'rgba(255,255,255,0.5)' },
            ]}>
              Sacar para M-Pesa
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ============ CARDS DE SALDO ============ */}
        <View style={styles.saldosRow}>
          {/* Pendente */}
          <View style={[styles.saldoCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
            <View style={[styles.saldoCardIcone, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={Colors.aviso} />
            </View>
            <Text style={[styles.saldoCardLabel, { color: cores.textoSecundario }]}>Pendente</Text>
            <Text style={[styles.saldoCardValor, { color: cores.textoPrincipal }]}>
              {formatarValor(0)}
            </Text>
            <Text style={[styles.saldoCardSub, { color: cores.textoTerciario }]}>
              Não registado
            </Text>
          </View>

          {/* Créditos */}
          <View style={[styles.saldoCard, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
            <View style={[styles.saldoCardIcone, { backgroundColor: `${cores.principal}20` }]}>
              <MaterialCommunityIcons name="gift-outline" size={18} color={cores.principal} />
            </View>
            <Text style={[styles.saldoCardLabel, { color: cores.textoSecundario }]}>Créditos</Text>
            <Text style={[styles.saldoCardValor, { color: cores.textoPrincipal }]}>
              {formatarValor(0)}
            </Text>
            <Text style={[styles.saldoCardSub, { color: cores.textoTerciario }]}>
              Não registado
            </Text>
          </View>
        </View>

        {/* ============ HISTÓRICO ============ */}
        <View style={styles.historicoSeccao}>
          <Text style={[styles.historicoTitulo, { color: cores.textoPrincipal }]}>
            Histórico
          </Text>

          {/* Tabs */}
          <View style={[styles.tabsContainer, { backgroundColor: cores.fundoElevado }]}>
            <TabButton
              activa={abaActiva === 'tudo'}
              label="Tudo"
              count={transaccoes.length}
              onPress={() => setAbaActiva('tudo')}
              cores={cores}
            />
            <TabButton
              activa={abaActiva === 'entradas'}
              label="Entradas"
              count={transaccoes.filter(t => t.valor > 0).length}
              onPress={() => setAbaActiva('entradas')}
              cores={cores}
            />
            <TabButton
              activa={abaActiva === 'saidas'}
              label="Saídas"
              count={transaccoes.filter(t => t.valor < 0).length}
              onPress={() => setAbaActiva('saidas')}
              cores={cores}
            />
          </View>

          {/* Lista de transacções */}
          {transaccoesFiltradas.length > 0 ? (
            <View style={styles.transaccoesLista}>
              {transaccoesFiltradas.map((transaccao) => (
                <ItemTransaccao
                  key={transaccao.id}
                  transaccao={transaccao}
                  cores={cores}
                />
              ))}
            </View>
          ) : (
            <View style={styles.vazioContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color={cores.textoTerciario} />
              <Text style={[styles.vazioTexto, { color: cores.textoSecundario }]}>
                Sem {abaActiva === 'entradas' ? 'entradas' : abaActiva === 'saidas' ? 'saídas' : 'transacções'} ainda
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============ MODAL: SACAR ============ */}
      <Modal
        visible={modalSaqueVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalSaqueVisivel(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalSaqueVisivel(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: cores.fundoElevado }]}>
            <View style={[styles.modalHandle, { backgroundColor: cores.bordaMedia }]} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIcone, { backgroundColor: cores.principalClara }]}>
                <MaterialCommunityIcons name="bank-transfer-out" size={24} color={cores.principal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>
                  Sacar para M-Pesa
                </Text>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSecundario }]}>
                  Mínimo 100 MT · Saldo: {formatarValor(saldo)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalSaqueVisivel(false)}
                style={[styles.modalFechar, { backgroundColor: cores.fundoSuave }]}
              >
                <Ionicons name="close" size={20} color={cores.textoSecundario} />
              </TouchableOpacity>
            </View>

            {/* Input valor */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: cores.textoSecundario }]}>
                Valor a sacar
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
                <TextInput
                  value={valorSaque}
                  onChangeText={setValorSaque}
                  placeholder="100"
                  placeholderTextColor={cores.textoTerciario}
                  keyboardType="numeric"
                  style={[styles.input, { color: cores.textoPrincipal }]}
                />
                <Text style={[styles.inputSufixo, { color: cores.textoSecundario }]}>MT</Text>
              </View>

              {/* Valores rápidos */}
              <View style={styles.valoresRapidos}>
                {[100, 250, 500].map((valor) => (
                  <TouchableOpacity
                    key={valor}
                    style={[styles.valorRapidoBotao, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}
                    onPress={() => setValorSaque(String(valor))}
                    disabled={valor > saldo}
                  >
                    <Text style={[
                      styles.valorRapidoTexto,
                      { color: valor > saldo ? cores.textoTerciario : cores.textoPrincipal },
                    ]}>
                      {valor} MT
                    </Text>
                  </TouchableOpacity>
                ))}
                {saldo >= 100 && (
                  <TouchableOpacity
                    style={[styles.valorRapidoBotao, { backgroundColor: cores.principalClara, borderColor: cores.principal }]}
                    onPress={() => setValorSaque(String(Math.floor(saldo)))}
                  >
                    <Text style={[styles.valorRapidoTexto, { color: cores.principal, fontWeight: '700' }]}>
                      Tudo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Input M-Pesa */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: cores.textoSecundario }]}>
                Número M-Pesa
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: cores.fundoSuave, borderColor: cores.bordaSubtil }]}>
                <Text style={[styles.inputPrefixo, { color: cores.textoSecundario }]}>+258</Text>
                <TextInput
                  value={numeroMPesa}
                  onChangeText={setNumeroMPesa}
                  placeholder="841234567"
                  placeholderTextColor={cores.textoTerciario}
                  keyboardType="numeric"
                  maxLength={9}
                  style={[styles.input, { color: cores.textoPrincipal }]}
                />
              </View>
            </View>

            {/* Info */}
            <View style={[styles.infoBox, { backgroundColor: cores.principalClara }]}>
              <Ionicons name="information-circle" size={16} color={cores.principal} />
              <Text style={[styles.infoTexto, { color: cores.textoPrincipal }]}>
                O saque é processado em até 24 horas via M-Pesa B2C
              </Text>
            </View>

            {/* Botão confirmar */}
            <TouchableOpacity
              style={styles.confirmarBotao}
              onPress={handlePedirSaque}
              disabled={aProcessar}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={cores.gradiente}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              {aProcessar ? (
                <Text style={styles.confirmarBotaoTexto}>A processar...</Text>
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmarBotaoTexto}>Confirmar pedido</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============ MODAL: INFO SALDOS ============ */}
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
                <Ionicons name="wallet" size={24} color={cores.principal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: cores.textoPrincipal }]}>
                  Como funciona a carteira
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
              <InfoSaldoItem
                cor={cores.principal}
                corFundo={cores.principalClara}
                icone="wallet-outline"
                titulo="Saldo Disponível"
                descricao="Comissões já confirmadas. Podes sacar via M-Pesa (mínimo 100 MT, processamento em 24h)."
                cores={cores}
              />
              <InfoSaldoItem
                cor={Colors.aviso}
                corFundo="rgba(255, 152, 0, 0.15)"
                icone="clock-outline"
                titulo="Saldo Pendente"
                descricao="Comissões aguardando confirmação da transacção original. Depois movem para Disponível."
                cores={cores}
              />
              <InfoSaldoItem
                cor={cores.principal}
                corFundo={cores.principalClara}
                icone="gift-outline"
                titulo="Créditos (25 MT cada)"
                descricao='Recebes quando reportas "Já arrendado" ou denuncias contactos escondidos (DDR 1.2). Só podem ser usados para desbloquear outros anúncios.'
                cores={cores}
              />

              <View style={[styles.infoLegalBox, { backgroundColor: cores.fundoSuave }]}>
                <Text style={[styles.infoLegalTitulo, { color: cores.textoPrincipal }]}>
                  Programa de Referência
                </Text>
                <Text style={[styles.infoLegalTexto, { color: cores.textoSecundario }]}>
                  Ganhas 10% de cada publicação paga pelos teus referidos, sem limites. Procuradores que indicam outros procuradores ganham 5 MT por desbloqueio confirmado.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ========================================================
// COMPONENTES AUXILIARES
// ========================================================

function TabButton({ activa, label, count, onPress, cores }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activa && { backgroundColor: cores.principal },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[
        styles.tabButtonTexto,
        { color: activa ? '#FFFFFF' : cores.textoSecundario },
      ]}>
        {`${label} (${count})`}
      </Text>
    </TouchableOpacity>
  );
}

function ItemTransaccao({ transaccao, cores }: { transaccao: Transacao; cores: any }) {
  const positivo = transaccao.valor > 0;
  const pendente = transaccao.estado === 'pending';

  const cor = pendente ? Colors.aviso : positivo ? Colors.verde : cores.principal;
  const corFundo = pendente
    ? 'rgba(255, 152, 0, 0.1)'
    : positivo
    ? 'rgba(76, 175, 80, 0.1)'
    : cores.principalClara;

  return (
    <View style={[styles.transaccaoItem, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
      <View style={[styles.transaccaoIcone, { backgroundColor: corFundo }]}>
        <MaterialCommunityIcons
          name={iconeTipoTransacao(transaccao.tipo) as any}
          size={20}
          color={cor}
        />
      </View>

      <View style={styles.transaccaoInfo}>
        <Text style={[styles.transaccaoTipo, { color: cores.textoPrincipal }]} numberOfLines={1}>
          {labelTipoTransacao(transaccao.tipo)}
        </Text>
        <Text style={[styles.transaccaoDescricao, { color: cores.textoSecundario }]} numberOfLines={1}>
          {transaccao.descricao}
        </Text>
        <View style={styles.transaccaoMetaRow}>
          <Text style={[styles.transaccaoTempo, { color: cores.textoTerciario }]}>
            {tempoRelativo(transaccao.data)}
          </Text>
          {pendente && (
            <View style={styles.pendenteBadge}>
              <View style={styles.pendenteBadgeDot} />
              <Text style={styles.pendenteBadgeTexto}>Pendente</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.transaccaoValor}>
        <Text style={[styles.transaccaoValorTexto, { color: cor }]}>
          {`${positivo ? '+' : ''}${formatarValor(transaccao.valor)}`}
        </Text>
      </View>
    </View>
  );
}

function InfoSaldoItem({ cor, corFundo, icone, titulo, descricao, cores }: any) {
  return (
    <View style={[styles.infoSaldoItem, { borderBottomColor: cores.bordaSubtil }]}>
      <View style={[styles.infoSaldoIcone, { backgroundColor: corFundo }]}>
        <MaterialCommunityIcons name={icone as any} size={22} color={cor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoSaldoTitulo, { color: cores.textoPrincipal }]}>{titulo}</Text>
        <Text style={[styles.infoSaldoDescricao, { color: cores.textoSecundario }]}>{descricao}</Text>
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
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  heroBotao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitulo: { ...Typography.h2, color: '#FFFFFF' },

  saldoPrincipal: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  saldoPrincipalLabel: {
    ...Typography.captionBold,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  saldoPrincipalValor: {
    ...Typography.displayLG,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 4,
  },
  saldoPrincipalSub: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },

  sacarBotao: {
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    gap: Spacing.sm,
    ...Sombras.md,
  },
  sacarBotaoDesactivado: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sacarBotaoTexto: { ...Typography.button, fontSize: 15 },

  scrollContent: { paddingTop: Spacing.lg, paddingBottom: Spacing.xxxl },

  // Saldos row
  saldosRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  saldoCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Sombras.sm,
  },
  saldoCardIcone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  saldoCardLabel: {
    ...Typography.captionBold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  saldoCardValor: {
    ...Typography.h2,
    fontWeight: '800',
    marginBottom: 2,
  },
  saldoCardSub: {
    ...Typography.caption,
    fontSize: 10,
  },

  // Histórico
  historicoSeccao: { paddingHorizontal: Spacing.lg },
  historicoTitulo: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  tabButtonTexto: {
    ...Typography.bodyBold,
    fontSize: 13,
  },

  // Lista transacções
  transaccoesLista: { gap: Spacing.sm },
  transaccaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  transaccaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transaccaoInfo: { flex: 1, gap: 2 },
  transaccaoTipo: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  transaccaoDescricao: {
    ...Typography.caption,
    fontSize: 12,
  },
  transaccaoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  transaccaoTempo: {
    ...Typography.caption,
    fontSize: 11,
  },
  pendenteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  pendenteBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.aviso,
  },
  pendenteBadgeTexto: {
    color: Colors.aviso,
    fontSize: 10,
    fontWeight: '700',
  },
  transaccaoValor: { alignItems: 'flex-end' },
  transaccaoValorTexto: {
    ...Typography.bodyBold,
    fontWeight: '800',
    fontSize: 14,
  },

  // Vazio
  vazioContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  vazioTexto: {
    ...Typography.body,
    textAlign: 'center',
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

  // Inputs
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: {
    ...Typography.captionBold,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 16,
    padding: 0,
  },
  inputPrefixo: {
    ...Typography.body,
    fontWeight: '600',
  },
  inputSufixo: {
    ...Typography.body,
    fontWeight: '600',
  },

  // Valores rápidos
  valoresRapidos: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  valorRapidoBotao: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  valorRapidoTexto: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoTexto: {
    ...Typography.caption,
    flex: 1,
    fontSize: 12,
  },

  // Confirmar botão
  confirmarBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    overflow: 'hidden',
    gap: Spacing.sm,
    ...Sombras.colorida('#2196F3'),
  },
  confirmarBotaoTexto: {
    ...Typography.button,
    color: '#FFFFFF',
  },

  // Info saldos
  infoSaldoItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  infoSaldoIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSaldoTitulo: {
    ...Typography.bodyBold,
    marginBottom: 4,
  },
  infoSaldoDescricao: {
    ...Typography.caption,
    lineHeight: 18,
  },
  infoLegalBox: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
  },
  infoLegalTitulo: {
    ...Typography.bodyBold,
    marginBottom: 4,
  },
  infoLegalTexto: {
    ...Typography.caption,
    lineHeight: 18,
  },
});