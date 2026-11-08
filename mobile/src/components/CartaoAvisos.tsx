/**
 * src/components/CartaoAvisos.tsx
 *
 * Componente adaptativo que mostra o estado de moderação do utilizador:
 * - Suspensão activa → card vermelho destacado com contador
 * - Avisos não vistos → card laranja destacado
 * - Tudo normal → linha simples de menu
 *
 * Uso:
 *   import CartaoAvisos from '../../src/components/CartaoAvisos';
 *   <CartaoAvisos />
 *
 * Variantes (opcional):
 *   <CartaoAvisos variante="completo" />  // Default — adaptativo
 *   <CartaoAvisos variante="linha" />     // Força linha simples (menu)
 */

import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useModeracaoStore } from '../store/moderacaoStore';

import { Fonte } from '../theme/fonts';
import Icone from './Icone';
import { Colors } from '../theme/colors';
interface Props {
  variante?: 'completo' | 'linha';
}

export default function CartaoAvisos({ variante = 'completo' }: Props) {
  const router = useRouter();

  const avisos = useModeracaoStore(s => s.avisos);
  const suspensao = useModeracaoStore(s => s.suspensao);
  const carregado = useModeracaoStore(s => s.carregado);
  const carregar = useModeracaoStore(s => s.carregarModeracao);

  useEffect(() => {
    if (!carregado) carregar();
  }, [carregado]);

  const avisosNaoVistos = useMemo(
    () => avisos.filter(a => !a.visto).length,
    [avisos]
  );

  const tempoRestanteSuspensao = useMemo(() => {
    if (!suspensao || suspensao.estado !== 'activa') return null;
    const fim = new Date(suspensao.dataFim).getTime();
    const diff = fim - Date.now();
    if (diff <= 0) return null;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}min`;
  }, [suspensao]);

  const ir = () => router.push('/avisos' as any);

  // ============ CASO 1: SUSPENSÃO ACTIVA (prioridade máxima) ============
  if (suspensao && suspensao.estado === 'activa' && variante === 'completo') {
    return (
      <TouchableOpacity style={styles.cardSuspensao} onPress={ir} activeOpacity={0.9}>
        <LinearGradient
          colors={[Colors.erro, Colors.erro]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardSuspensaoConteudo}>
          <View style={styles.cardSuspensaoIcone}>
            <Icone name="cancel" size={24} color={Colors.branco} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardSuspensaoTitulo}>Conta suspensa</Text>
            <Text style={styles.cardSuspensaoTexto}>
              {tempoRestanteSuspensao
                ? `Expira em ${tempoRestanteSuspensao} · Toca para contestar`
                : 'Toca para ver detalhes'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.branco} />
        </View>
      </TouchableOpacity>
    );
  }

  // ============ CASO 2: CONTESTAÇÃO EM ANÁLISE ============
  if (suspensao && suspensao.estado === 'contestada' && variante === 'completo') {
    return (
      <TouchableOpacity style={styles.cardAnalise} onPress={ir} activeOpacity={0.9}>
        <View style={styles.cardAnaliseIcone}>
          <Icone name="clock-outline" size={22} color={Colors.azul} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAnaliseTitulo}>Contestação em análise</Text>
          <Text style={styles.cardAnaliseTexto}>
            Decisão em até 24h
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.azul} />
      </TouchableOpacity>
    );
  }

  // ============ CASO 3: AVISOS NÃO VISTOS ============
  if (avisosNaoVistos > 0 && variante === 'completo') {
    return (
      <TouchableOpacity style={styles.cardAvisos} onPress={ir} activeOpacity={0.9}>
        <View style={styles.cardAvisosIcone}>
          <Icone name="shield-alert" size={22} color={Colors.azul} />
          <View style={styles.cardAvisosDot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAvisosTitulo}>
            {`${avisosNaoVistos} ${avisosNaoVistos === 1 ? 'novo aviso' : 'novos avisos'}`}
          </Text>
          <Text style={styles.cardAvisosTexto}>
            Toca para ver os detalhes
          </Text>
        </View>
        <View style={styles.cardAvisosBadge}>
          <Text style={styles.cardAvisosBadgeTexto}>
            {avisosNaoVistos > 9 ? '9+' : avisosNaoVistos}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ============ CASO 4: LINHA DE MENU (DEFAULT NORMAL) ============
  return (
    <TouchableOpacity style={styles.linhaMenu} onPress={ir} activeOpacity={0.7}>
      <View style={styles.linhaMenuIcone}>
        <Icone name="shield-check-outline" size={22} color={Colors.carvao} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaMenuLabel}>Avisos e denúncias</Text>
        <Text style={styles.linhaMenuDescricao}>
          {avisos.length === 0
            ? 'Nada por aqui'
            : `${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textoTerciario} />
    </TouchableOpacity>
  );
}

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  // Card de suspensão (vermelho)
  cardSuspensao: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardSuspensaoConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardSuspensaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSuspensaoTitulo: {
    color: Colors.branco,
    fontSize: 15,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  cardSuspensaoTexto: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: Fonte.corpoSemi,
  },

  // Card de contestação em análise (laranja claro)
  cardAnalise: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.azulSuave,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.azul,
  },
  cardAnaliseIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.branco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAnaliseTitulo: {
    color: Colors.azulTexto,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  cardAnaliseTexto: {
    color: Colors.azulTexto,
    fontFamily: Fonte.corpo, fontSize: 12,
  },

  // Card de avisos não vistos (laranja destacado)
  cardAvisos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.azulSuave,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.azul,
  },
  cardAvisosIcone: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Colors.azulSuave,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardAvisosDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.azul,
    borderWidth: 2,
    borderColor: Colors.azulSuave,
  },
  cardAvisosTitulo: {
    color: Colors.carvao,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  cardAvisosTexto: {
    color: Colors.textoSecundario,
    fontFamily: Fonte.corpo, fontSize: 12,
  },
  cardAvisosBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: Colors.azul,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvisosBadgeTexto: {
    color: Colors.branco,
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },

  // Linha de menu (default normal)
  linhaMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.branco,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borda,
  },
  linhaMenuIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.fundoSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linhaMenuLabel: {
    color: Colors.carvao,
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  linhaMenuDescricao: {
    color: Colors.textoSecundario,
    fontFamily: Fonte.corpo, fontSize: 12,
  },
});