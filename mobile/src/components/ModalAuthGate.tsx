/**
 * src/components/ModalAuthGate.tsx
 * Modal global de autenticação do GoHome.
 */

import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthGateStore, CONFIG_MOTIVOS } from '../store/authGateStore';

import { Fonte } from '../theme/fonts';
import Icone from './Icone';
import { Colors } from '../theme/colors';
const LARANJA = Colors.azul;
const COR_ACENTO_ESCURO = Colors.azul;
const AZUL = Colors.carvao;
const AZUL_SUAVE = Colors.textoSecundario;

export default function ModalAuthGate() {
  const router = useRouter();
  const visivel = useAuthGateStore(s => s.visivel);
  const motivo = useAuthGateStore(s => s.motivo);
  const fechar = useAuthGateStore(s => s.fechar);

  const config = CONFIG_MOTIVOS[motivo];

  useEffect(() => {
    if (!visivel) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      fechar();
      return true;
    });
    return () => sub.remove();
  }, [visivel, fechar]);

  const irParaRegisto = () => {
    fechar();
    setTimeout(() => {
      router.push({
        pathname: '/auth/registo' as any,
        params: { origem: 'auth_gate', motivo },
      });
    }, 180);
  };

  const irParaLogin = () => {
    fechar();
    setTimeout(() => {
      router.push({
        pathname: '/auth/login' as any,
        params: { origem: 'auth_gate', motivo },
      });
    }, 180);
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={fechar}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar modal" />

        <View style={styles.sheet}>
          <View style={styles.topArea}>
            <View style={styles.handle} />
            <TouchableOpacity
              onPress={fechar}
              style={styles.closeButton}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={23} color={AZUL} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Icone name="home-city" size={27} color={Colors.branco} />
              </View>
              <View>
                <Text style={styles.brandName}>Go<Text style={styles.brandAccent}>Home</Text></Text>
                <Text style={styles.brandTagline}>Encontra. Publica. Conecta.</Text>
              </View>
            </View>

            <View style={styles.heroRow}>
              <View style={styles.heroTextArea}>
                <Text style={styles.eyebrow}>A TUA PRÓXIMA OPORTUNIDADE</Text>
                <Text style={styles.title}>{config.titulo}</Text>
                <Text style={styles.description}>{config.descricao}</Text>
              </View>
              <View style={styles.heroIllustration}>
                <View style={styles.heroCircle} />
                <Icone name="home-heart" size={60} color={LARANJA} />
                <View style={styles.heroBadge}>
                  <Ionicons name="checkmark" size={15} color={Colors.branco} />
                </View>
              </View>
            </View>

            <View style={styles.benefitsHeader}>
              <Text style={styles.benefitsTitle}>Com a tua conta podes</Text>
              <View style={styles.benefitsAccent} />
            </View>

            <View style={styles.benefitsGrid}>
              {config.beneficios.map((beneficio, idx) => {
                const icons: Array<string> = [
                  'heart-outline',
                  'chat-processing-outline',
                  'bell-badge-outline',
                  'shield-check-outline',
                ];
                return (
                  <View key={`${idx}-${beneficio}`} style={styles.benefitCard}>
                    <View style={styles.benefitIconWrap}>
                      <Icone
                        name={icons[idx % icons.length]}
                        size={23}
                        color={COR_ACENTO_ESCURO}
                      />
                    </View>
                    <Text style={styles.benefitText}>{beneficio}</Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={irParaRegisto}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[Colors.azul, Colors.azul, Colors.azul]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Icone name="account-plus-outline" size={22} color={Colors.branco} />
              <Text style={styles.primaryButtonText}>Criar conta grátis</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.branco} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={irParaLogin}
              activeOpacity={0.82}
              accessibilityRole="button"
            >
              <Ionicons name="log-in-outline" size={22} color={AZUL} />
              <Text style={styles.secondaryButtonText}>Já tenho conta</Text>
              <Ionicons name="arrow-forward" size={18} color={AZUL_SUAVE} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={fechar}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.continueText}>Continuar a explorar sem conta</Text>
            </TouchableOpacity>
            <Text style={styles.footerNote}>A tua experiência no GoHome começa aqui.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 33, 36, 0.64)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.branco,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '91%',
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 22,
  },
  topArea: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 10,
    backgroundColor: Colors.borda,
  },
  closeButton: {
    position: 'absolute',
    right: 18,
    top: 7,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.fundoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 5,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 22,
  },
  brandIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: LARANJA,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: AZUL,
    fontSize: 24,
    fontFamily: Fonte.tituloBold,
    letterSpacing: -0.4,
    lineHeight: 27,
  },
  brandAccent: {
    color: LARANJA,
  },
  brandTagline: {
    color: AZUL_SUAVE,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    marginTop: 1,
    letterSpacing: 0.15,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
  },
  heroTextArea: {
    flex: 1,
    paddingRight: 3,
  },
  eyebrow: {
    color: COR_ACENTO_ESCURO,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  title: {
    color: AZUL,
    fontSize: 28,
    lineHeight: 30,
    fontFamily: Fonte.tituloBold,
    letterSpacing: -0.4,
    marginBottom: 9,
  },
  description: {
    color: AZUL_SUAVE,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonte.corpoMedio,
  },
  heroIllustration: {
    width: 94,
    height: 106,
    marginLeft: 6,
    borderRadius: 27,
    backgroundColor: Colors.azulSuave,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.azulSuave,
    top: -54,
    right: -45,
  },
  heroBadge: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.verdeTexto,
    borderWidth: 2,
    borderColor: Colors.branco,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  benefitsTitle: {
    color: AZUL,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
  },
  benefitsAccent: {
    width: 24,
    height: 3,
    borderRadius: 3,
    backgroundColor: LARANJA,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  benefitCard: {
    width: '48%',
    flexGrow: 1,
    minHeight: 82,
    borderRadius: 16,
    backgroundColor: Colors.gelo,
    borderWidth: 1,
    borderColor: Colors.fundoSuave,
    paddingHorizontal: 11,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.azulSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    color: Colors.carvao,
    fontSize: 12,
    lineHeight: 15,
    fontFamily: Fonte.corpoSemi,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 17,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: COR_ACENTO_ESCURO,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.branco,
    fontSize: 15,
    fontFamily: Fonte.corpoBold,
    flex: 1,
  },
  secondaryButton: {
    minHeight: 53,
    borderRadius: 16,
    backgroundColor: Colors.fundoSuave,
    borderWidth: 1,
    borderColor: Colors.borda,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: AZUL,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    flex: 1,
  },
  continueButton: {
    alignItems: 'center',
    paddingTop: 17,
    paddingBottom: 5,
  },
  continueText: {
    color: Colors.textoSecundario,
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
    textDecorationLine: 'underline',
    textDecorationColor: Colors.borda,
  },
  footerNote: {
    color: Colors.textoTerciario,
    fontFamily: Fonte.corpo, fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});
