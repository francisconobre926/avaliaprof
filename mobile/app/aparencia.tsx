import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import TopBar from '../src/components/TopBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useThemeStore,
  useCores,
  CORES_DESTAQUE,
  CorDestaque,
} from '../src/store/themeStore';
import { Spacing, Typography, Radius } from '../src/theme/typography';

import { Fonte } from '../src/theme/fonts';
import Icone from '../src/components/Icone';
import { Colors } from '../src/theme/colors';
const { width } = Dimensions.get('window');

export default function AparenciaScreen() {
  const router = useRouter();
  const cores = useCores();

  const corDestaque = useThemeStore(state => state.corDestaque);
  const modo = useThemeStore(state => state.modo);
  const mudarCor = useThemeStore(state => state.mudarCor);
  const mudarModo = useThemeStore(state => state.mudarModo);
  const resetTema = useThemeStore(state => state.resetTema);

  const listaCores = Object.values(CORES_DESTAQUE);

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Aparência" onVoltar={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Preview */}
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil },
          ]}
        >
          <Text style={[styles.previewLabel, { color: cores.textoSecundario }]}>
            PRÉ-VISUALIZAÇÃO
          </Text>

          <View style={styles.previewCard}>
            <LinearGradient
              colors={cores.gradiente}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.previewCardConteudo}>
              <View style={styles.previewCardBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.branco} />
                <Text style={styles.previewCardBadgeText}>DESTAQUE</Text>
              </View>
              <Text style={styles.previewCardTitulo}>AvaliaProf</Text>
              <Text style={styles.previewCardSubtitulo}>Avalia, compara, decide</Text>
            </View>
          </View>

          <View style={styles.previewBotoes}>
            <TouchableOpacity
              style={[styles.previewBotao, { backgroundColor: cores.principal }]}
              activeOpacity={0.85}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text style={styles.previewBotaoTexto}>Botão principal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.previewBotao,
                {
                  backgroundColor: cores.principalClara,
                  borderWidth: 1,
                  borderColor: cores.principal,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.previewBotaoTextoSec, { color: cores.principalTexto }]}>
                Secundário
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modo Claro/Escuro */}
        <View style={styles.seccao}>
          <Text style={[styles.seccaoTitulo, { color: cores.textoSecundario }]}>MODO</Text>

          <View style={styles.modosContainer}>
            <TouchableOpacity
              style={[
                styles.modoCard,
                {
                  backgroundColor: cores.fundoElevado,
                  borderColor: modo === 'claro' ? cores.principal : cores.bordaSubtil,
                  borderWidth: modo === 'claro' ? 2 : 1,
                },
              ]}
              onPress={() => mudarModo('claro')}
              accessibilityRole="radio"
              accessibilityLabel="Tema claro"
              accessibilityState={{ selected: modo === 'claro' }}
              activeOpacity={0.85}
            >
              <View style={[styles.modoPreview, { backgroundColor: Colors.gelo }]}>
                <View style={[styles.modoPreviewCirculo, { backgroundColor: Colors.azul }]} />
                <View style={styles.modoPreviewLinhas}>
                  <View style={[styles.modoPreviewLinha, { backgroundColor: Colors.carvao }]} />
                  <View
                    style={[
                      styles.modoPreviewLinha,
                      { backgroundColor: Colors.textoSecundario, width: '60%' },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.modoInfo}>
                <View style={styles.modoInfoRow}>
                  <Ionicons name="sunny" size={16} color={cores.textoPrincipal} />
                  <Text style={[styles.modoLabel, { color: cores.textoPrincipal }]}>
                    Claro
                  </Text>
                </View>
                {modo === 'claro' && (
                  <View style={[styles.modoCheck, { backgroundColor: cores.principal }]}>
                    <Ionicons name="checkmark" size={12} color={Colors.branco} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modoCard,
                {
                  backgroundColor: cores.fundoElevado,
                  borderColor: modo === 'escuro' ? cores.principal : cores.bordaSubtil,
                  borderWidth: modo === 'escuro' ? 2 : 1,
                },
              ]}
              onPress={() => mudarModo('escuro')}
              accessibilityRole="radio"
              accessibilityLabel="Tema escuro"
              accessibilityState={{ selected: modo === 'escuro' }}
              activeOpacity={0.85}
            >
              <View style={[styles.modoPreview, { backgroundColor: Colors.carvao }]}>
                <View style={[styles.modoPreviewCirculo, { backgroundColor: Colors.textoSecundario }]} />
                <View style={styles.modoPreviewLinhas}>
                  <View style={[styles.modoPreviewLinha, { backgroundColor: Colors.fundoSuave }]} />
                  <View
                    style={[
                      styles.modoPreviewLinha,
                      { backgroundColor: Colors.textoTerciario, width: '60%' },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.modoInfo}>
                <View style={styles.modoInfoRow}>
                  <Ionicons name="moon" size={16} color={cores.textoPrincipal} />
                  <Text style={[styles.modoLabel, { color: cores.textoPrincipal }]}>
                    Escuro
                  </Text>
                </View>
                {modo === 'escuro' && (
                  <View style={[styles.modoCheck, { backgroundColor: cores.principal }]}>
                    <Ionicons name="checkmark" size={12} color={Colors.branco} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cores de Destaque */}
        <View style={styles.seccao}>
          <Text style={[styles.seccaoTitulo, { color: cores.textoSecundario }]}>
            COR DE DESTAQUE
          </Text>
          <Text style={[styles.seccaoDescricao, { color: cores.textoSecundario }]}>
            Escolhe a cor que mais gostas. Vai ser aplicada em botões, ícones e destaques.
          </Text>

          <View style={styles.coresGrid}>
            {listaCores.map((cor) => {
              const seleccionada = corDestaque === cor.id;
              return (
                <TouchableOpacity
                  key={cor.id}
                  style={[
                    styles.corCard,
                    {
                      backgroundColor: cores.fundoElevado,
                      borderColor: seleccionada ? cor.principal : cores.bordaSubtil,
                      borderWidth: seleccionada ? 2 : 1,
                    },
                  ]}
                  onPress={() => mudarCor(cor.id as CorDestaque)}
                  activeOpacity={0.85}
                  accessibilityRole="radio"
                  accessibilityLabel={`Cor ${cor.nome}`}
                  accessibilityState={{ selected: seleccionada }}
                >
                  <View style={styles.corCirculoContainer}>
                    <LinearGradient
                      colors={cor.gradiente}
                      style={styles.corCirculo}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {seleccionada && (
                        <Ionicons name="checkmark" size={22} color={Colors.branco} />
                      )}
                    </LinearGradient>
                  </View>
                  <Text style={[styles.corNome, { color: cores.textoPrincipal }]}>
                    {cor.nome}
                  </Text>
                  {seleccionada && (
                    <View style={[styles.corBadge, { backgroundColor: cor.claro }]}>
                      <Text style={[styles.corBadgeTexto, { color: cor.escuro }]}>
                        Activa
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Info */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: cores.principalClara,
              borderColor: cores.principal,
            },
          ]}
        >
          <View style={[styles.infoIcone, { backgroundColor: cores.principal }]}>
            <Ionicons name="information" size={16} color={Colors.branco} />
          </View>
          <View style={styles.infoConteudo}>
            <Text style={[styles.infoTitulo, { color: cores.principalTexto }]}>
              Aplicação em tempo real
            </Text>
            <Text style={[styles.infoTexto, { color: cores.textoPrincipal }]}>
              As alterações são guardadas automaticamente e aplicadas a toda a app.
            </Text>
          </View>
        </View>

        {/* Reset */}
        <TouchableOpacity
          style={[styles.botaoReset, { borderColor: cores.bordaSubtil }]}
          onPress={resetTema}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Restaurar predefinições"
        >
          <Icone name="restart" size={18} color={cores.textoSecundario} />
          <Text style={[styles.botaoResetTexto, { color: cores.textoSecundario }]}>
            Restaurar predefinições
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg },

  // Preview
  previewContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  previewLabel: {
    ...Typography.captionBold,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  previewCard: {
    height: 130,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  previewCardConteudo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  previewCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  previewCardBadgeText: {
    ...Typography.captionBold,
    color: Colors.branco,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  previewCardTitulo: {
    ...Typography.displayMD,
    color: Colors.branco,
    fontFamily: Fonte.tituloSemi,
  },
  previewCardSubtitulo: {
    ...Typography.body,
    color: Colors.branco,
    opacity: 0.95,
    marginTop: 2,
  },
  previewBotoes: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  previewBotao: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  previewBotaoTexto: {
    ...Typography.button,
    color: Colors.branco,
  },
  previewBotaoTextoSec: {
    ...Typography.button,
  },

  // Secções
  seccao: { marginBottom: Spacing.xl },
  seccaoTitulo: {
    ...Typography.captionBold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  seccaoDescricao: {
    ...Typography.bodySmall,
    marginBottom: Spacing.md,
  },

  // Modos
  modosContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modoCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  modoPreview: {
    height: 80,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    justifyContent: 'flex-end',
    marginBottom: Spacing.sm,
  },
  modoPreviewCirculo: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modoPreviewLinhas: { gap: 4 },
  modoPreviewLinha: {
    height: 4,
    borderRadius: 2,
    width: '80%',
  },
  modoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modoLabel: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
  modoCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cores grid
  coresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  corCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  corCirculoContainer: {
    marginBottom: Spacing.xs,
  },
  corCirculo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  corNome: {
    ...Typography.bodyBold,
    fontSize: 13,
    marginBottom: 4,
  },
  corBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  corBadgeTexto: {
    ...Typography.captionBold,
    fontSize: 12,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoIcone: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoConteudo: { flex: 1 },
  infoTitulo: {
    ...Typography.bodyBold,
    fontSize: 13,
    marginBottom: 2,
  },
  infoTexto: {
    ...Typography.caption,
    lineHeight: 16,
  },

  // Reset
  botaoReset: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  botaoResetTexto: {
    ...Typography.button,
    fontSize: 14,
  },
});