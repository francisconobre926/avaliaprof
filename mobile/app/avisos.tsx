/**
 * app/avisos.tsx
 *
 * Página de moderação para o anunciante:
 * - Lista de avisos recebidos
 * - Banner de suspensão (se activa)
 * - Formulário de contestação
 * - Lista de denúncias feitas pelo utilizador (como denunciante)
 */

import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import TopBar from '../src/components/TopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';
import { useModeracaoStore } from '../src/store/moderacaoStore';
import {
  Aviso,
  MotivoDenuncia,
  obterMotivoPorId,
  labelEstadoDenuncia,
  corEstadoDenuncia,
} from '../src/types';

import { Fonte } from '../src/theme/fonts';
import Icone from '../src/components/Icone';
type Tab = 'avisos' | 'minhas-denuncias';

export default function AvisosScreen() {
  const router = useRouter();

  const avisos = useModeracaoStore(s => s.avisos);
  const suspensao = useModeracaoStore(s => s.suspensao);
  const minhasDenuncias = useModeracaoStore(s => s.minhasDenuncias());
  const carregadoMod = useModeracaoStore(s => s.carregado);
  const carregarModeracao = useModeracaoStore(s => s.carregarModeracao);
  const marcarAvisoVisto = useModeracaoStore(s => s.marcarAvisoVisto);
  const contestarSuspensao = useModeracaoStore(s => s.contestarSuspensao);

  useEffect(() => {
    if (!carregadoMod) carregarModeracao();
  }, [carregadoMod]);

  const [tab, setTab] = useState<Tab>('avisos');
  const [modalContestarVisivel, setModalContestarVisivel] = useState(false);
  const [descricaoContestacao, setDescricaoContestacao] = useState('');
  const [provaContestacaoUri, setProvaContestacaoUri] = useState<string | null>(null);
  const [enviandoContestacao, setEnviandoContestacao] = useState(false);
  const [modalAguardandoVisivel, setModalAguardandoVisivel] = useState(false);
  const [modalSucessoVisivel, setModalSucessoVisivel] = useState(false);

  // Contagem de avisos não vistos
  const avisosNaoVistos = avisos.filter(a => !a.visto).length;

  // Tempo restante de suspensão
  const tempoRestante = useMemo(() => {
    if (!suspensao || suspensao.estado !== 'activa') return null;
    const fim = new Date(suspensao.dataFim).getTime();
    const agora = Date.now();
    const diff = fim - agora;
    if (diff <= 0) return '0h 0min';
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}min`;
  }, [suspensao]);

  // ============ HANDLERS ============
  const abrirContestar = () => {
    setDescricaoContestacao('');
    setProvaContestacaoUri(null);
    setModalContestarVisivel(true);
  };

  const carregarProvaContestacao = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Permite o acesso à galeria.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProvaContestacaoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar a imagem.');
    }
  };

  const enviarContestacao = async () => {
    if (descricaoContestacao.trim().length < 20) {
      Alert.alert('Explicação curta', 'Para contestar, precisas de uma explicação com pelo menos 20 caracteres.');
      return;
    }
    setEnviandoContestacao(true);
    try {
      await contestarSuspensao({
        descricao: descricaoContestacao.trim(),
        provaUri: provaContestacaoUri || undefined,
      });

      setEnviandoContestacao(false);
      setModalContestarVisivel(false);
      setModalAguardandoVisivel(true);

      // Simulação de análise após 3s
      setTimeout(() => {
        setModalAguardandoVisivel(false);
        setTimeout(() => setModalSucessoVisivel(true), 300);
      }, 3200);

    } catch (err) {
      setEnviandoContestacao(false);
      Alert.alert('Erro', 'Não foi possível enviar a contestação. Tenta novamente.');
    }
  };

  const abrirAviso = async (aviso: Aviso) => {
    if (!aviso.visto) {
      await marcarAvisoVisto(aviso.id);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar titulo="Avisos e denúncias" onVoltar={() => router.back()} acoes={<></>} />
      <View style={styles.safeHeader}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === 'avisos' && styles.tabActiva]}
            onPress={() => setTab('avisos')}
          >
            <Text style={[styles.tabTexto, tab === 'avisos' && styles.tabTextoActiva]}>
              Meus avisos
            </Text>
            {avisos.length > 0 && (
              <View style={[styles.tabBadge, tab === 'avisos' && styles.tabBadgeActiva]}>
                <Text style={[styles.tabBadgeTexto, tab === 'avisos' && styles.tabBadgeTextoActiva]}>
                  {avisos.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'minhas-denuncias' && styles.tabActiva]}
            onPress={() => setTab('minhas-denuncias')}
          >
            <Text style={[styles.tabTexto, tab === 'minhas-denuncias' && styles.tabTextoActiva]}>
              Minhas denúncias
            </Text>
            {minhasDenuncias.length > 0 && (
              <View style={[styles.tabBadge, tab === 'minhas-denuncias' && styles.tabBadgeActiva]}>
                <Text style={[styles.tabBadgeTexto, tab === 'minhas-denuncias' && styles.tabBadgeTextoActiva]}>
                  {minhasDenuncias.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ============ BANNER DE SUSPENSÃO ============ */}
        {suspensao && suspensao.estado === 'activa' && tab === 'avisos' && (
          <View style={styles.bannerSuspensao}>
            <LinearGradient
              colors={[Colors.erro, Colors.erro]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.bannerSuspensaoConteudo}>
              <View style={styles.bannerSuspensaoHeader}>
                <View style={styles.bannerSuspensaoIcone}>
                  <Icone name="cancel" size={28} color={Colors.branco} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerSuspensaoTitulo}>Conta suspensa</Text>
                  <Text style={styles.bannerSuspensaoSubtitulo}>
                    Recebeste 3 avisos nos últimos 30 dias.
                  </Text>
                </View>
              </View>

              <View style={styles.bannerSuspensaoInfo}>
                <View style={styles.bannerSuspensaoInfoItem}>
                  <Icone name="clock-outline" size={14} color={Colors.erroBorda} />
                  <Text style={styles.bannerSuspensaoInfoTexto}>
                    {`Expira em ${tempoRestante}`}
                  </Text>
                </View>
                <View style={styles.bannerSuspensaoInfoItem}>
                  <Icone name="block-helper" size={14} color={Colors.erroBorda} />
                  <Text style={styles.bannerSuspensaoInfoTexto}>
                    Não podes publicar novos anúncios
                  </Text>
                </View>
                <View style={styles.bannerSuspensaoInfoItem}>
                  <Icone name="check-circle-outline" size={14} color={Colors.verdeSuave} />
                  <Text style={styles.bannerSuspensaoInfoTexto}>
                    Anúncios existentes continuam activos
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.bannerSuspensaoBtn}
                onPress={abrirContestar}
                activeOpacity={0.85}
              >
                <Icone name="gavel" size={16} color={Colors.erro} />
                <Text style={styles.bannerSuspensaoBtnTexto}>Contestar suspensão</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============ BANNER DE CONTESTAÇÃO EM ANÁLISE ============ */}
        {suspensao && suspensao.estado === 'contestada' && tab === 'avisos' && (
          <View style={styles.bannerAnalise}>
            <View style={styles.bannerAnaliseIcone}>
              <ActivityIndicator color={Colors.azul} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerAnaliseTitulo}>Contestação em análise</Text>
              <Text style={styles.bannerAnaliseTexto}>
                A nossa equipa está a rever a tua explicação. Resposta em até 24h.
              </Text>
            </View>
          </View>
        )}

        {/* ============ BANNER DE SUSPENSÃO LEVANTADA ============ */}
        {suspensao && suspensao.estado === 'levantada' && tab === 'avisos' && (
          <View style={styles.bannerLevantada}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.verdeTexto} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerLevantadaTitulo}>Suspensão levantada</Text>
              <Text style={styles.bannerLevantadaTexto}>
                A tua contestação foi aceite. Podes voltar a usar a GoHome normalmente.
              </Text>
            </View>
          </View>
        )}

        {/* ============ TAB: MEUS AVISOS ============ */}
        {tab === 'avisos' && (
          <View style={styles.listaContainer}>
            {avisos.length === 0 ? (
              <View style={styles.vazioContainer}>
                <Icone name="shield-check" size={60} color={Colors.borda} />
                <Text style={styles.vazioTitulo}>Nenhum aviso recebido</Text>
                <Text style={styles.vazioTexto}>
                  Continua a seguir as regras da GoHome para manter a tua conta em bom estado.
                </Text>
              </View>
            ) : (
              avisos.map(aviso => (
                <AvisoCard
                  key={aviso.id}
                  aviso={aviso}
                  onPress={() => abrirAviso(aviso)}
                />
              ))
            )}
          </View>
        )}

        {/* ============ TAB: MINHAS DENÚNCIAS ============ */}
        {tab === 'minhas-denuncias' && (
          <View style={styles.listaContainer}>
            {minhasDenuncias.length === 0 ? (
              <View style={styles.vazioContainer}>
                <Icone name="flag-outline" size={60} color={Colors.borda} />
                <Text style={styles.vazioTitulo}>Nenhuma denúncia feita</Text>
                <Text style={styles.vazioTexto}>
                  Quando denunciares um anúncio, ele aparece aqui com o estado.
                </Text>
              </View>
            ) : (
              minhasDenuncias.map(denuncia => (
                <DenunciaCard key={denuncia.id} denuncia={denuncia} />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ============ MODAL CONTESTAR ============ */}
      <Modal
        visible={modalContestarVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalContestarVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalContestarVisivel(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.contestarHeader}>
                <View style={styles.contestarHeaderIcone}>
                  <Icone name="gavel" size={30} color={Colors.azul} />
                </View>
                <Text style={styles.contestarHeaderTitulo}>Contestar suspensão</Text>
                <Text style={styles.contestarHeaderSubtitulo}>
                  Explica porque consideras que a suspensão é injusta. A nossa equipa vai rever todas as denúncias.
                </Text>
              </View>

              <View style={{ paddingHorizontal: 20 }}>
                <Text style={styles.contestarLabel}>Explicação *</Text>
                <TextInput
                  style={styles.contestarInput}
                  placeholder="Explica em detalhe porque consideras a suspensão injusta (mínimo 20 caracteres)..."
                  placeholderTextColor={Colors.textoTerciario}
                  value={descricaoContestacao}
                  onChangeText={setDescricaoContestacao}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={styles.contestarContador}>{`${descricaoContestacao.length}/500`}</Text>

                <Text style={styles.contestarLabel}>Prova (opcional)</Text>
                {provaContestacaoUri ? (
                  <View style={styles.contestarProvaWrap}>
                    <Image source={{ uri: provaContestacaoUri }} style={styles.contestarProvaImg} />
                    <TouchableOpacity
                      style={styles.contestarProvaRemover}
                      onPress={() => setProvaContestacaoUri(null)}
                    >
                      <Ionicons name="close" size={16} color={Colors.branco} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.contestarProvaBtn}
                    onPress={carregarProvaContestacao}
                  >
                    <Icone name="camera-plus" size={20} color={Colors.azul} />
                    <Text style={styles.contestarProvaBtnTexto}>Carregar imagem</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.contestarFooter}>
                <TouchableOpacity
                  style={styles.contestarBtnCancelar}
                  onPress={() => setModalContestarVisivel(false)}
                >
                  <Text style={styles.contestarBtnCancelarTexto}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contestarBtnEnviar}
                  onPress={enviarContestacao}
                  disabled={enviandoContestacao}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[Colors.azul, Colors.azul]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  {enviandoContestacao ? (
                    <ActivityIndicator color={Colors.branco} />
                  ) : (
                    <Text style={styles.contestarBtnEnviarTexto}>Enviar contestação</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL AGUARDANDO ============ */}
      <Modal
        visible={modalAguardandoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalCentroOverlay}>
          <View style={styles.modalCentroBox}>
            <ActivityIndicator size="large" color={Colors.azul} />
            <Text style={styles.aguardandoTitulo}>A analisar a tua contestação</Text>
            <Text style={styles.aguardandoTexto}>
              A nossa equipa está a rever os detalhes.
            </Text>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL SUCESSO CONTESTAÇÃO ============ */}
      <Modal
        visible={modalSucessoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSucessoVisivel(false)}
      >
        <View style={styles.modalCentroOverlay}>
          <View style={styles.modalCentroBox}>
            <View style={styles.sucessoIcone}>
              <Ionicons name="checkmark" size={44} color={Colors.branco} />
            </View>
            <Text style={styles.sucessoTitulo}>Suspensão levantada!</Text>
            <Text style={styles.sucessoSubtitulo}>
              A tua contestação foi aceite. Já podes voltar a publicar anúncios normalmente.
            </Text>
            <TouchableOpacity
              style={styles.sucessoBtn}
              onPress={() => setModalSucessoVisivel(false)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.verdeTexto, Colors.verdeTexto]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.sucessoBtnTexto}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// CARDS
// ============================================================

function AvisoCard({ aviso, onPress }: { aviso: Aviso; onPress: () => void }) {
  const dataFormatada = new Date(aviso.dataCriacao).toLocaleDateString('pt-PT');
  return (
    <TouchableOpacity
      style={[styles.avisoCard, !aviso.visto && styles.avisoCardNovo]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {!aviso.visto && <View style={styles.avisoDotNovo} />}
      <View style={styles.avisoHeader}>
        <View style={styles.avisoNumeroWrap}>
          <Text style={styles.avisoNumero}>{aviso.numeroAviso}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.avisoTitulo}>
            {`${aviso.numeroAviso}º aviso recebido`}
          </Text>
          <Text style={styles.avisoData}>{dataFormatada}</Text>
        </View>
      </View>
      <View style={styles.avisoDivider} />
      <Text style={styles.avisoLabel}>Anúncio denunciado</Text>
      <Text style={styles.avisoAnuncio} numberOfLines={2}>
        {aviso.tituloAnuncio}
      </Text>
      <Text style={[styles.avisoLabel, { marginTop: 10 }]}>Motivos</Text>
      <View style={styles.avisoMotivos}>
        {aviso.motivosDenunciados.map(id => {
          const motivo = obterMotivoPorId(id);
          if (!motivo) return null;
          return (
            <View key={id} style={styles.avisoMotivoChip}>
              <Icone name={motivo.icone as any} size={12} color={Colors.azul} />
              <Text style={styles.avisoMotivoTexto}>{motivo.label}</Text>
            </View>
          );
        })}
      </View>

      {aviso.numeroAviso >= 3 && (
        <View style={styles.avisoAlerta}>
          <Icone name="alert-circle" size={16} color={Colors.erro} />
          <Text style={styles.avisoAlertaTexto}>
            Este foi o teu 3º aviso. A tua conta foi suspensa por 24h.
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function DenunciaCard({ denuncia }: { denuncia: any }) {
  const dataFormatada = new Date(denuncia.dataCriacao).toLocaleDateString('pt-PT');
  const cor = corEstadoDenuncia(denuncia.estado);
  const label = labelEstadoDenuncia(denuncia.estado);

  return (
    <View style={styles.denunciaCard}>
      <View style={styles.denunciaHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.denunciaAnuncio} numberOfLines={2}>
            {denuncia.tituloAnuncio}
          </Text>
          <Text style={styles.denunciaData}>{dataFormatada}</Text>
        </View>
        <View style={[styles.denunciaEstadoBadge, { backgroundColor: `${cor}15` }]}>
          <View style={[styles.denunciaEstadoDot, { backgroundColor: cor }]} />
          <Text style={[styles.denunciaEstadoTexto, { color: cor }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.denunciaDivider} />
      <Text style={styles.denunciaLabelPequena}>Motivos reportados</Text>
      <View style={styles.denunciaMotivos}>
        {denuncia.motivos.map((id: MotivoDenuncia) => {
          const motivo = obterMotivoPorId(id);
          if (!motivo) return null;
          return (
            <View key={id} style={styles.denunciaMotivoChip}>
              <Text style={styles.denunciaMotivoTexto}>{motivo.label}</Text>
            </View>
          );
        })}
      </View>

      {denuncia.estado === 'aprovada' && denuncia.compensacaoRecebida && (
        <View style={styles.denunciaCredit}>
          <Icone name="gift" size={14} color={Colors.verdeTexto} />
          <Text style={styles.denunciaCreditTexto}>
            {`+${denuncia.compensacaoRecebida} MT creditados na tua carteira`}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.azulSuave },
  safeHeader: { backgroundColor: Colors.branco, paddingTop: 10 },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingBottom: 10, gap: 8,
  },
  tab: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 11,
    backgroundColor: Colors.fundoSuave, gap: 6,
  },
  tabActiva: { backgroundColor: Colors.carvao },
  tabTexto: {
    ...Typography.bodyBold, color: Colors.textoSecundario,
    fontSize: 13, fontFamily: Fonte.corpoSemi,
  },
  tabTextoActiva: { color: Colors.branco },
  tabBadge: {
    minWidth: 20, height: 20,
    paddingHorizontal: 6, borderRadius: 10,
    backgroundColor: Colors.borda,
    justifyContent: 'center', alignItems: 'center',
  },
  tabBadgeActiva: { backgroundColor: Colors.azul },
  tabBadgeTexto: {
    color: Colors.textoSecundario, fontSize: 12, fontFamily: Fonte.corpoSemi,
  },
  tabBadgeTextoActiva: { color: Colors.branco },

  // Banner suspensão
  bannerSuspensao: {
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 18, overflow: 'hidden',
  },
  bannerSuspensaoConteudo: { padding: 16 },
  bannerSuspensaoHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 14,
  },
  bannerSuspensaoIcone: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  bannerSuspensaoTitulo: {
    color: Colors.branco, fontSize: 18, fontFamily: Fonte.corpoSemi,
    marginBottom: 3,
  },
  bannerSuspensaoSubtitulo: {
    color: 'rgba(255,255,255,0.9)', fontFamily: Fonte.corpo, fontSize: 12,
  },
  bannerSuspensaoInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12, borderRadius: 11,
    marginBottom: 14, gap: 8,
  },
  bannerSuspensaoInfoItem: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
  },
  bannerSuspensaoInfoTexto: {
    color: Colors.branco, fontSize: 12, fontFamily: Fonte.corpoSemi,
  },
  bannerSuspensaoBtn: {
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 12, backgroundColor: Colors.branco,
    borderRadius: 11, gap: 7,
  },
  bannerSuspensaoBtnTexto: {
    color: Colors.erro, fontSize: 14, fontFamily: Fonte.corpoSemi,
  },

  // Banner análise contestação
  bannerAnalise: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.azulSuave,
    marginHorizontal: 16, marginTop: 14,
    padding: 14, borderRadius: 14, gap: 12,
    borderLeftWidth: 4, borderLeftColor: Colors.azul,
  },
  bannerAnaliseIcone: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.branco,
    justifyContent: 'center', alignItems: 'center',
  },
  bannerAnaliseTitulo: {
    ...Typography.bodyBold, color: Colors.azulTexto,
    fontFamily: Fonte.corpoSemi, fontSize: 14, marginBottom: 3,
  },
  bannerAnaliseTexto: {
    ...Typography.caption, color: Colors.azulTexto,
    fontSize: 12, lineHeight: 16,
  },

  // Banner levantada
  bannerLevantada: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.verdeSuave,
    marginHorizontal: 16, marginTop: 14,
    padding: 14, borderRadius: 14, gap: 10,
    borderLeftWidth: 4, borderLeftColor: Colors.verdeTexto,
  },
  bannerLevantadaTitulo: {
    ...Typography.bodyBold, color: Colors.verdeTexto,
    fontFamily: Fonte.corpoSemi, fontSize: 14, marginBottom: 3,
  },
  bannerLevantadaTexto: {
    ...Typography.caption, color: Colors.verdeTexto,
    fontSize: 12, lineHeight: 16,
  },

  // Listas
  listaContainer: {
    padding: 16, gap: 12,
  },
  vazioContainer: {
    alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 10,
  },
  vazioTitulo: {
    ...Typography.h4, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, textAlign: 'center',
    marginTop: 8, fontSize: 15,
  },
  vazioTexto: {
    ...Typography.body, color: Colors.textoSecundario,
    textAlign: 'center', fontSize: 13,
    lineHeight: 19, maxWidth: 300,
  },

  // Aviso card
  avisoCard: {
    backgroundColor: Colors.branco,
    padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.borda,
    position: 'relative',
  },
  avisoCardNovo: {
    borderColor: Colors.azul, borderWidth: 1.5,
    backgroundColor: Colors.azulSuave,
  },
  avisoDotNovo: {
    position: 'absolute', top: 10, right: 10,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.azul,
  },
  avisoHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 10,
  },
  avisoNumeroWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.erroFundo,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.erro,
  },
  avisoNumero: {
    color: Colors.erro, fontSize: 15, fontFamily: Fonte.corpoBold,
  },
  avisoTitulo: {
    ...Typography.bodyBold, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, fontSize: 14, marginBottom: 2,
  },
  avisoData: {
    ...Typography.caption, color: Colors.textoSecundario,
    fontSize: 12,
  },
  avisoDivider: {
    height: 1, backgroundColor: Colors.fundoSuave,
    marginBottom: 10,
  },
  avisoLabel: {
    ...Typography.caption, color: Colors.textoSecundario,
    fontSize: 11, fontFamily: Fonte.corpoSemi,
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: 5,
  },
  avisoAnuncio: {
    ...Typography.body, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, fontSize: 13,
    lineHeight: 17,
  },
  avisoMotivos: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginTop: 2,
  },
  avisoMotivoChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.azulSuave,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, gap: 4,
  },
  avisoMotivoTexto: {
    color: Colors.azulTexto, fontSize: 12, fontFamily: Fonte.corpoSemi,
  },
  avisoAlerta: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.erroFundo,
    padding: 10, borderRadius: 10, gap: 7,
    marginTop: 10,
  },
  avisoAlertaTexto: {
    color: Colors.erro, fontSize: 12, fontFamily: Fonte.corpoSemi,
    flex: 1,
  },

  // Denuncia card
  denunciaCard: {
    backgroundColor: Colors.branco,
    padding: 14, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.borda,
  },
  denunciaHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 10, marginBottom: 10,
  },
  denunciaAnuncio: {
    ...Typography.bodyBold, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, fontSize: 13,
    lineHeight: 17, marginBottom: 3,
  },
  denunciaData: {
    ...Typography.caption, color: Colors.textoSecundario,
    fontSize: 12,
  },
  denunciaEstadoBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, gap: 5,
  },
  denunciaEstadoDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  denunciaEstadoTexto: {
    fontSize: 12, fontFamily: Fonte.corpoSemi,
    letterSpacing: 0.3,
  },
  denunciaDivider: {
    height: 1, backgroundColor: Colors.fundoSuave,
    marginBottom: 10,
  },
  denunciaLabelPequena: {
    ...Typography.caption, color: Colors.textoSecundario,
    fontSize: 11, fontFamily: Fonte.corpoSemi,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 5,
  },
  denunciaMotivos: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 5,
  },
  denunciaMotivoChip: {
    backgroundColor: Colors.fundoSuave,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8,
  },
  denunciaMotivoTexto: {
    color: Colors.carvao, fontSize: 12, fontFamily: Fonte.corpoSemi,
  },
  denunciaCredit: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.verdeSuave,
    padding: 9, borderRadius: 9, gap: 6,
    marginTop: 10,
  },
  denunciaCreditTexto: {
    color: Colors.verdeTexto, fontSize: 12, fontFamily: Fonte.corpoSemi,
    flex: 1,
  },

  // Modal bottom sheet (contestar)
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Colors.branco,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 24, paddingTop: 10,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borda,
    alignSelf: 'center', marginBottom: 12,
  },

  contestarHeader: {
    paddingHorizontal: 20, paddingBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.fundoSuave,
    marginBottom: 16,
  },
  contestarHeaderIcone: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.azulSuave,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  contestarHeaderTitulo: {
    ...Typography.h3, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, fontSize: 18,
    textAlign: 'center', marginBottom: 6,
  },
  contestarHeaderSubtitulo: {
    ...Typography.body, color: Colors.textoSecundario,
    textAlign: 'center', fontSize: 13, lineHeight: 19,
  },

  contestarLabel: {
    ...Typography.bodyBold, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, fontSize: 13, marginBottom: 7,
    marginTop: 10,
  },
  contestarInput: {
    backgroundColor: Colors.fundoSuave,
    borderRadius: 12, padding: 12,
    minHeight: 110, textAlignVertical: 'top',
    ...Typography.body, color: Colors.carvao,
    borderWidth: 1, borderColor: Colors.borda,
    fontSize: 13,
  },
  contestarContador: {
    ...Typography.caption, color: Colors.textoTerciario,
    fontSize: 12, textAlign: 'right', marginTop: 5,
  },

  contestarProvaBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.azulSuave,
    borderWidth: 1, borderColor: Colors.azulSuave,
    gap: 8,
  },
  contestarProvaBtnTexto: {
    color: Colors.azulTexto, fontSize: 13, fontFamily: Fonte.corpoSemi,
  },
  contestarProvaWrap: {
    position: 'relative',
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borda,
  },
  contestarProvaImg: {
    width: '100%', height: 150,
    backgroundColor: Colors.borda,
  },
  contestarProvaRemover: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },

  contestarFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20, paddingTop: 16,
    gap: 10,
  },
  contestarBtnCancelar: {
    flex: 1, paddingVertical: 14,
    borderRadius: 13, backgroundColor: Colors.fundoSuave,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borda,
  },
  contestarBtnCancelarTexto: {
    color: Colors.carvao, fontSize: 14, fontFamily: Fonte.corpoSemi,
  },
  contestarBtnEnviar: {
    flex: 2, paddingVertical: 14, borderRadius: 13,
    overflow: 'hidden', alignItems: 'center',
    justifyContent: 'center',
  },
  contestarBtnEnviarTexto: {
    color: Colors.branco, fontSize: 14, fontFamily: Fonte.corpoSemi,
  },

  // Modal centro
  modalCentroOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    padding: 20,
  },
  modalCentroBox: {
    backgroundColor: Colors.branco,
    borderRadius: 24, padding: 28,
    width: '100%', maxWidth: 380,
    alignItems: 'center',
  },

  aguardandoTitulo: {
    ...Typography.h3, color: Colors.carvao,
    fontFamily: Fonte.corpoSemi, textAlign: 'center',
    fontSize: 18, marginTop: 16, marginBottom: 6,
  },
  aguardandoTexto: {
    ...Typography.body, color: Colors.textoSecundario,
    textAlign: 'center', fontSize: 13, lineHeight: 19,
  },

  sucessoIcone: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.verdeTexto,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 18,
    shadowColor: Colors.verdeTexto,
    shadowOpacity: 0.3, shadowRadius: 15, elevation: 8,
  },
  sucessoTitulo: {
    ...Typography.displayMD, color: Colors.carvao,
    fontFamily: Fonte.tituloBold, textAlign: 'center',
    marginBottom: 8, fontSize: 22,
  },
  sucessoSubtitulo: {
    ...Typography.body, color: Colors.textoSecundario,
    textAlign: 'center', fontSize: 13,
    marginBottom: 18, lineHeight: 19,
  },
  sucessoBtn: {
    width: '100%', paddingVertical: 15,
    borderRadius: 14, overflow: 'hidden',
    alignItems: 'center',
  },
  sucessoBtnTexto: {
    color: Colors.branco, fontSize: 15, fontFamily: Fonte.corpoSemi,
  },
});