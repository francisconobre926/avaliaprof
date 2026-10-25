/**
 * Modal visual da verificação OCR das imagens.
 *
 * Estados:
 * - processando: mostra progresso foto a foto
 * - resultado_limpo: todas as fotos passaram
 * - resultado_suspeito: 1+ fotos com dúvidas (média confiança)
 * - resultado_bloqueado: 1+ fotos com contactos detectados
 */

import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  verificarImagensOCR,
  ResultadoVerificacaoOCR,
  ResultadoFotoOCR,
  EtapaProcessamento,
  ETAPAS_OCR,
  ModoSimulacao,
  contarPorEstado,
} from '../utils/verificarImagensOCR';
import {
  labelTipoDeteccao,
  iconeTipoDeteccao,
  corTipoDeteccao,
} from '../utils/detectarContactos';
import { Typography } from '../theme/typography';

import { Fonte } from '../theme/fonts';
import Icone from './Icone';
type EstadoModal = 'processando' | 'limpo' | 'suspeito' | 'bloqueado';

interface Props {
  visivel: boolean;
  fotos: string[];
  modoSimulacao: ModoSimulacao;
  onFechar: () => void;
  onSucesso: () => void;              // Chamado quando tudo OK → vai para pagamento
  onRemoverFoto: (indice: number) => void;  // Remove foto do publicar.tsx
}

export default function ModalVerificacaoOCR({
  visivel,
  fotos,
  modoSimulacao,
  onFechar,
  onSucesso,
  onRemoverFoto,
}: Props) {
  const [estado, setEstado] = useState<EstadoModal>('processando');
  const [fotoActualIndice, setFotoActualIndice] = useState(0);
  const [etapaActualIndice, setEtapaActualIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoFotoOCR[]>([]);
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoVerificacaoOCR | null>(null);

  const spinValue = useRef(new Animated.Value(0)).current;
  const progressoAnim = useRef(new Animated.Value(0)).current;

  // ============ ANIMAÇÃO DE ROTAÇÃO ============
  useEffect(() => {
    if (estado === 'processando') {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [estado]);

  // ============ ANIMAÇÃO DO PROGRESSO POR ETAPA ============
  useEffect(() => {
    if (estado !== 'processando') return;

    const etapa = ETAPAS_OCR[etapaActualIndice];
    if (!etapa) return;

    progressoAnim.setValue(0);
    Animated.timing(progressoAnim, {
      toValue: 1,
      duration: etapa.duracaoMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      setEtapaActualIndice(prev => {
        if (prev < ETAPAS_OCR.length - 1) {
          return prev + 1;
        }
        return 0;
      });
    }, etapa.duracaoMs);

    return () => clearTimeout(timer);
  }, [estado, etapaActualIndice, fotoActualIndice]);

  // ============ INICIAR VERIFICAÇÃO QUANDO O MODAL ABRE ============
  useEffect(() => {
    if (!visivel) {
      // Reset ao fechar
      setEstado('processando');
      setFotoActualIndice(0);
      setEtapaActualIndice(0);
      setResultados([]);
      setResultadoFinal(null);
      return;
    }

    if (fotos.length === 0) {
      onSucesso();
      return;
    }

    executarVerificacao();
  }, [visivel]);

  const executarVerificacao = async () => {
    try {
      const resultado = await verificarImagensOCR(
        fotos,
        modoSimulacao,
        (indice, total, resultadoFoto) => {
          setFotoActualIndice(indice);
          setEtapaActualIndice(0);
          setResultados(prev => [...prev, resultadoFoto]);
        }
      );

      setResultadoFinal(resultado);

      // Decidir estado final
      if (resultado.temBloqueadas) {
        setEstado('bloqueado');
      } else if (resultado.temSuspeitas) {
        setEstado('suspeito');
      } else {
        setEstado('limpo');
        // Pequeno delay para o utilizador ver o resultado antes de avançar
        setTimeout(() => {
          onSucesso();
        }, 1200);
      }
    } catch (err) {
      // Em caso de erro, deixa passar (fail-open por agora)
      onSucesso();
    }
  };

  const handleRemoverFotoBloqueada = (indice: number) => {
    onRemoverFoto(indice);
    onFechar();
  };

  const handleConfirmarSuspeita = () => {
    onFechar();
    onSucesso();
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressoFotos = fotos.length > 0 ? (fotoActualIndice / fotos.length) * 100 : 0;
  const etapa = ETAPAS_OCR[etapaActualIndice];

  // Lista de fotos com problemas
  const fotosProblema = resultadoFinal
    ? resultadoFinal.fotos.filter(f => f.estado !== 'limpa')
    : [];

  const contagem = resultadoFinal ? contarPorEstado(resultadoFinal) : null;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Impedir fechar durante processamento
        if (estado !== 'processando') onFechar();
      }}
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (estado !== 'processando') onFechar();
          }}
        />

        <View style={styles.container}>
          {/* ============ ESTADO: PROCESSANDO ============ */}
          {estado === 'processando' && (
            <View style={styles.processandoContainer}>
              <View style={styles.processandoCabecalho}>
                <Animated.View style={[styles.loadingIcone, { transform: [{ rotate: spin }] }]}>
                  <LinearGradient
                    colors={['#FF9A00', '#FF5A00']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Icone name="eye-check" size={32} color="#FFFFFF" />
                </Animated.View>

                <Text style={styles.processandoTitulo}>A verificar as tuas fotos</Text>
                <Text style={styles.processandoSubtitulo}>
                  Estamos a analisar cada foto para detectar contactos escondidos
                </Text>
              </View>

              {/* Foto actual */}
              {fotoActualIndice > 0 && fotos[fotoActualIndice - 1] && (
                <View style={styles.fotoActualContainer}>
                  <Image
                    source={{ uri: fotos[fotoActualIndice - 1] }}
                    style={styles.fotoActual}
                  />
                  <View style={styles.fotoActualOverlay}>
                    <Text style={styles.fotoActualContador}>
                      {`Foto ${fotoActualIndice} de ${fotos.length}`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Etapas */}
              <View style={styles.etapasContainer}>
                <Text style={styles.etapaActualTexto}>{etapa?.nome || 'A iniciar...'}</Text>
                <View style={styles.progressoEtapaTrack}>
                  <Animated.View
                    style={[
                      styles.progressoEtapaFill,
                      {
                        width: progressoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Progresso global */}
              <View style={styles.progressoGlobal}>
                <View style={styles.progressoGlobalLinha}>
                  <Text style={styles.progressoGlobalLabel}>Progresso total</Text>
                  <Text style={styles.progressoGlobalValor}>
                    {`${fotoActualIndice} / ${fotos.length}`}
                  </Text>
                </View>
                <View style={styles.progressoGlobalTrack}>
                  <View style={[styles.progressoGlobalFill, { width: `${progressoFotos}%` }]} />
                </View>
              </View>

              {/* Resultados parciais */}
              {resultados.length > 0 && (
                <View style={styles.parciaisContainer}>
                  <View style={styles.parciaisLinha}>
                    {resultados.map((r, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.parcialDot,
                          r.estado === 'limpa' && { backgroundColor: '#2F7A4F' },
                          r.estado === 'suspeita' && { backgroundColor: '#E8760A' },
                          r.estado === 'bloqueada' && { backgroundColor: '#C2412D' },
                        ]}
                      >
                        {r.estado === 'limpa' && (
                          <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                        )}
                        {r.estado === 'suspeita' && (
                          <Ionicons name="warning" size={10} color="#FFFFFF" />
                        )}
                        {r.estado === 'bloqueada' && (
                          <Ionicons name="close" size={10} color="#FFFFFF" />
                        )}
                      </View>
                    ))}
                    {fotos.slice(resultados.length).map((_, idx) => (
                      <View key={`pendente-${idx}`} style={styles.parcialDotPendente} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ============ ESTADO: LIMPO (sucesso) ============ */}
          {estado === 'limpo' && (
            <View style={styles.sucessoContainer}>
              <View style={styles.sucessoIcone}>
                <Ionicons name="checkmark" size={54} color="#FFFFFF" />
              </View>
              <Text style={styles.sucessoTitulo}>Fotos aprovadas!</Text>
              <Text style={styles.sucessoSubtitulo}>
                {`Todas as ${fotos.length} fotos passaram na verificação`}
              </Text>
              {contagem && (
                <View style={styles.sucessoStats}>
                  <View style={styles.sucessoStat}>
                    <Ionicons name="checkmark-circle" size={16} color="#2F7A4F" />
                    <Text style={styles.sucessoStatTexto}>
                      {`${contagem.limpas} ${contagem.limpas === 1 ? 'foto limpa' : 'fotos limpas'}`}
                    </Text>
                  </View>
                </View>
              )}
              <Text style={styles.sucessoProximo}>A redireccionar para pagamento...</Text>
            </View>
          )}

          {/* ============ ESTADO: SUSPEITO (média confiança) ============ */}
          {estado === 'suspeito' && resultadoFinal && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.suspeitoCabecalho}>
                <View style={[styles.estadoIcone, { backgroundColor: '#FBF0E3' }]}>
                  <Icone name="eye-outline" size={32} color="#E8760A" />
                </View>
                <Text style={styles.estadoTitulo}>Verificação adicional necessária</Text>
                <Text style={styles.estadoSubtitulo}>
                  {`Detectámos possíveis contactos em ${fotosProblema.length} ${fotosProblema.length === 1 ? 'foto' : 'fotos'}. Confirma que não contêm informações pessoais.`}
                </Text>
              </View>

              <View style={styles.fotosProblemaLista}>
                {fotosProblema.map((f) => (
                  <View key={f.indice} style={styles.fotoProblemaCard}>
                    <View style={styles.fotoProblemaWrap}>
                      <Image source={{ uri: f.uri }} style={styles.fotoProblemaImg} />
                      <View style={styles.fotoProblemaOverlay}>
                        <View style={styles.fotoProblemaBadge}>
                          <Icone name="eye-outline" size={13} color="#FFFFFF" />
                          <Text style={styles.fotoProblemaBadgeTexto}>
                            {`Foto ${f.indice + 1}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.fotoProblemaInfo}>
                      <Text style={styles.fotoProblemaMotivo}>
                        Encontrámos texto que pode indicar partilha de contactos
                      </Text>
                      {f.deteccoes.length > 0 && (
                        <View style={styles.fotoProblemaDeteccoes}>
                          {f.deteccoes.slice(0, 2).map((d, idx) => (
                            <View key={idx} style={[
                              styles.deteccaoChip,
                              { backgroundColor: `${corTipoDeteccao(d.tipo)}15` },
                            ]}>
                              <Icone
                                name={iconeTipoDeteccao(d.tipo) as any}
                                size={11}
                                color={corTipoDeteccao(d.tipo)}
                              />
                              <Text style={[
                                styles.deteccaoChipTexto,
                                { color: corTipoDeteccao(d.tipo) },
                              ]}>
                                {labelTipoDeteccao(d.tipo)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.suspeitoBotoes}>
                <TouchableOpacity
                  style={styles.btnSecundario}
                  onPress={() => {
                    if (fotosProblema.length > 0) {
                      handleRemoverFotoBloqueada(fotosProblema[0].indice);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Icone name="image-remove" size={18} color="#C2412D" />
                  <Text style={styles.btnSecundarioTexto}>Substituir foto</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnPrincipal}
                  onPress={handleConfirmarSuspeita}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#FF9A00', '#FF5A00']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Icone name="shield-check" size={18} color="#FFFFFF" />
                  <Text style={styles.btnPrincipalTexto}>Confirmar e continuar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.btnCancelar} onPress={onFechar}>
                <Text style={styles.btnCancelarTexto}>Voltar e rever fotos</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ============ ESTADO: BLOQUEADO (alta confiança) ============ */}
          {estado === 'bloqueado' && resultadoFinal && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.bloqueadoCabecalho}>
                <View style={[styles.estadoIcone, { backgroundColor: '#FBECE9' }]}>
                  <Icone name="shield-alert" size={32} color="#C2412D" />
                </View>
                <Text style={styles.estadoTitulo}>Contactos detectados nas fotos</Text>
                <Text style={styles.estadoSubtitulo}>
                  {`Encontrámos informações de contacto em ${fotosProblema.length} ${fotosProblema.length === 1 ? 'foto' : 'fotos'}. Remove ${fotosProblema.length === 1 ? 'a' : 'as'} para continuar.`}
                </Text>
              </View>

              {/* Caixa explicativa */}
              <View style={styles.explicacaoBox}>
                <Icone name="information" size={16} color="#C2412D" />
                <Text style={styles.explicacaoTexto}>
                  Partilhar contactos nas fotos (telefones, WhatsApp, emails) viola as regras do GoHome.
                  Os procuradores desbloqueiam o teu contacto pela app.
                </Text>
              </View>

              {/* Fotos bloqueadas */}
              <View style={styles.fotosBloqueadasLista}>
                {fotosProblema.map((f) => (
                  <View key={f.indice} style={styles.fotoBloqueadaCard}>
                    <View style={styles.fotoBloqueadaWrap}>
                      <Image source={{ uri: f.uri }} style={styles.fotoBloqueadaImg} />
                      <View style={styles.fotoBloqueadaOverlay}>
                        <View style={styles.fotoBloqueadaBadge}>
                          <Icone name="close-circle" size={13} color="#FFFFFF" />
                          <Text style={styles.fotoBloqueadaBadgeTexto}>
                            {`Foto ${f.indice + 1} — Bloqueada`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.fotoBloqueadaInfo}>
                      <Text style={styles.fotoBloqueadaLabel}>Encontrámos:</Text>
                      <View style={styles.textoExtraidoBox}>
                        <Text style={styles.textoExtraidoTexto}>"{f.textoDetectado}"</Text>
                      </View>

                      {f.deteccoes.map((d, idx) => (
                        <View key={idx} style={styles.deteccaoDetalhe}>
                          <View style={[
                            styles.deteccaoDetalheIcone,
                            { backgroundColor: `${corTipoDeteccao(d.tipo)}15` },
                          ]}>
                            <Icone
                              name={iconeTipoDeteccao(d.tipo) as any}
                              size={14}
                              color={corTipoDeteccao(d.tipo)}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.deteccaoDetalheLabel}>
                              {labelTipoDeteccao(d.tipo)}
                            </Text>
                            <Text style={styles.deteccaoDetalheMotivo}>
                              {d.motivo}
                            </Text>
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity
                        style={styles.btnRemoverFoto}
                        onPress={() => handleRemoverFotoBloqueada(f.indice)}
                        activeOpacity={0.85}
                      >
                        <Icone name="trash-can" size={16} color="#FFFFFF" />
                        <Text style={styles.btnRemoverFotoTexto}>Remover esta foto</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Consequências */}
              <View style={styles.consequenciasBox}>
                <Icone name="alert" size={14} color="#8B1A1A" />
                <Text style={styles.consequenciasTexto}>
                  Se continuares a tentar publicar com contactos escondidos, a tua conta pode ser suspensa (DDR §42).
                </Text>
              </View>

              <TouchableOpacity style={styles.btnCancelar} onPress={onFechar}>
                <Text style={styles.btnCancelarTexto}>Voltar e remover eu próprio</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
  },

  // ============ Processando ============
  processandoContainer: {
    padding: 24,
    alignItems: 'center',
  },
  processandoCabecalho: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingIcone: {
    width: 72,
    height: 72,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  processandoTitulo: {
    ...Typography.h2,
    color: '#16202E',
    fontFamily: Fonte.tituloSemi,
    textAlign: 'center',
    marginBottom: 6,
  },
  processandoSubtitulo: {
    ...Typography.body,
    color: '#5B616B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 300,
  },
  fotoActualContainer: {
    width: 180,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
    position: 'relative',
    backgroundColor: '#E7E5DF',
  },
  fotoActual: {
    width: '100%',
    height: '100%',
  },
  fotoActualOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  fotoActualContador: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    textAlign: 'center',
  },
  etapasContainer: {
    width: '100%',
    marginBottom: 18,
  },
  etapaActualTexto: {
    ...Typography.bodyBold,
    color: '#16202E',
    fontFamily: Fonte.corpoSemi,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressoEtapaTrack: {
    height: 4,
    backgroundColor: '#E6EDF5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressoEtapaFill: {
    height: '100%',
    backgroundColor: '#E8760A',
    borderRadius: 2,
  },
  progressoGlobal: {
    width: '100%',
    marginBottom: 16,
  },
  progressoGlobalLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressoGlobalLabel: {
    ...Typography.caption,
    color: '#5B616B',
    fontSize: 11,
    fontFamily: Fonte.corpoSemi,
  },
  progressoGlobalValor: {
    ...Typography.bodyBold,
    color: '#E8760A',
    fontFamily: Fonte.corpoSemi,
    fontSize: 13,
  },
  progressoGlobalTrack: {
    height: 6,
    backgroundColor: '#F4F3EF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressoGlobalFill: {
    height: '100%',
    backgroundColor: '#16202E',
    borderRadius: 3,
  },

  // Dots parciais
  parciaisContainer: {
    width: '100%',
    paddingTop: 8,
  },
  parciaisLinha: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  parcialDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcialDotPendente: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E7E5DF',
    borderWidth: 2,
    borderColor: '#E7E5DF',
    borderStyle: 'dashed',
  },

  // ============ Sucesso (limpo) ============
  sucessoContainer: {
    padding: 32,
    alignItems: 'center',
  },
  sucessoIcone: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2F7A4F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#2F7A4F',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  sucessoTitulo: {
    ...Typography.displayMD,
    color: '#2F7A4F',
    fontFamily: Fonte.tituloBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  sucessoSubtitulo: {
    ...Typography.body,
    color: '#5B616B',
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 13,
  },
  sucessoStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  sucessoStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF3EC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sucessoStatTexto: {
    ...Typography.caption,
    color: '#22593A',
    fontFamily: Fonte.corpoSemi,
    fontSize: 12,
  },
  sucessoProximo: {
    ...Typography.caption,
    color: '#5B616B',
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // ============ Suspeito / Bloqueado - cabeçalho comum ============
  suspeitoCabecalho: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F3EF',
  },
  bloqueadoCabecalho: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F3EF',
  },
  estadoIcone: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  estadoTitulo: {
    ...Typography.h2,
    color: '#16202E',
    fontFamily: Fonte.tituloSemi,
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 20,
  },
  estadoSubtitulo: {
    ...Typography.body,
    color: '#5B616B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },

  // ============ Explicação ============
  explicacaoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF4F4',
    padding: 13,
    borderRadius: 11,
    gap: 9,
    marginHorizontal: 20,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#C2412D',
  },
  explicacaoTexto: {
    ...Typography.caption,
    color: '#8B1A1A',
    flex: 1,
    lineHeight: 16,
    fontSize: 11,
  },

  // ============ Fotos com problema - lista comum ============
  fotosProblemaLista: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  fotosBloqueadasLista: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  fotoProblemaCard: {
    backgroundColor: '#FFF8F1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD2A8',
    overflow: 'hidden',
  },
  fotoProblemaWrap: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#E7E5DF',
  },
  fotoProblemaImg: {
    width: '100%',
    height: '100%',
  },
  fotoProblemaOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  fotoProblemaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8760A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  fotoProblemaBadgeTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonte.corpoSemi,
  },
  fotoProblemaInfo: {
    padding: 14,
  },
  fotoProblemaMotivo: {
    ...Typography.body,
    color: '#5D3317',
    fontSize: 13,
    marginBottom: 10,
  },
  fotoProblemaDeteccoes: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  deteccaoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  deteccaoChipTexto: {
    fontSize: 10,
    fontFamily: Fonte.corpoSemi,
  },

  // ============ Foto bloqueada (vermelho) ============
  fotoBloqueadaCard: {
    backgroundColor: '#FBECE9',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F2C9C1',
    overflow: 'hidden',
  },
  fotoBloqueadaWrap: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#E7E5DF',
  },
  fotoBloqueadaImg: {
    width: '100%',
    height: '100%',
  },
  fotoBloqueadaOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  fotoBloqueadaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C2412D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  fotoBloqueadaBadgeTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: Fonte.corpoSemi,
  },
  fotoBloqueadaInfo: {
    padding: 14,
  },
  fotoBloqueadaLabel: {
    ...Typography.caption,
    color: '#8B1A1A',
    fontSize: 11,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textoExtraidoBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F2C9C1',
  },
  textoExtraidoTexto: {
    ...Typography.body,
    color: '#C2412D',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
  },
  deteccaoDetalhe: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  deteccaoDetalheIcone: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deteccaoDetalheLabel: {
    ...Typography.bodyBold,
    color: '#16202E',
    fontFamily: Fonte.corpoSemi,
    fontSize: 12,
  },
  deteccaoDetalheMotivo: {
    ...Typography.caption,
    color: '#5B616B',
    fontSize: 11,
    marginTop: 2,
  },
  btnRemoverFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C2412D',
    paddingVertical: 11,
    borderRadius: 11,
    gap: 7,
    marginTop: 4,
  },
  btnRemoverFotoTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },

  // ============ Consequências ============
  consequenciasBox: {
    flexDirection: 'row',
    backgroundColor: '#FBECE9',
    padding: 12,
    borderRadius: 10,
    gap: 7,
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
  },
  consequenciasTexto: {
    ...Typography.caption,
    color: '#8B1A1A',
    flex: 1,
    lineHeight: 15,
    fontSize: 11,
  },

  // ============ Botões ============
  suspeitoBotoes: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  btnSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: '#FBECE9',
    borderWidth: 1,
    borderColor: '#F2C9C1',
    gap: 6,
    flex: 1,
  },
  btnSecundarioTexto: {
    color: '#C2412D',
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },
  btnPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 13,
    overflow: 'hidden',
    gap: 7,
    flex: 1.3,
  },
  btnPrincipalTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },
  btnCancelar: {
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 18,
    alignItems: 'center',
  },
  btnCancelarTexto: {
    color: '#5B616B',
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
    textDecorationLine: 'underline',
  },
});