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
          colors={['#C2412D', '#9A0007']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.cardSuspensaoConteudo}>
          <View style={styles.cardSuspensaoIcone}>
            <Icone name="cancel" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardSuspensaoTitulo}>Conta suspensa</Text>
            <Text style={styles.cardSuspensaoTexto}>
              {tempoRestanteSuspensao
                ? `Expira em ${tempoRestanteSuspensao} · Toca para contestar`
                : 'Toca para ver detalhes'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  }

  // ============ CASO 2: CONTESTAÇÃO EM ANÁLISE ============
  if (suspensao && suspensao.estado === 'contestada' && variante === 'completo') {
    return (
      <TouchableOpacity style={styles.cardAnalise} onPress={ir} activeOpacity={0.9}>
        <View style={styles.cardAnaliseIcone}>
          <Icone name="clock-outline" size={22} color="#E8760A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardAnaliseTitulo}>Contestação em análise</Text>
          <Text style={styles.cardAnaliseTexto}>
            Decisão em até 24h
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#E8760A" />
      </TouchableOpacity>
    );
  }

  // ============ CASO 3: AVISOS NÃO VISTOS ============
  if (avisosNaoVistos > 0 && variante === 'completo') {
    return (
      <TouchableOpacity style={styles.cardAvisos} onPress={ir} activeOpacity={0.9}>
        <View style={styles.cardAvisosIcone}>
          <Icone name="shield-alert" size={22} color="#E8760A" />
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
        <Icone name="shield-check-outline" size={22} color="#16202E" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaMenuLabel}>Avisos e denúncias</Text>
        <Text style={styles.linhaMenuDescricao}>
          {avisos.length === 0
            ? 'Nada por aqui'
            : `${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'}`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9A9EA5" />
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
    color: '#FFFFFF',
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
    backgroundColor: '#FBF0E3',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E8760A',
  },
  cardAnaliseIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAnaliseTitulo: {
    color: '#E65100',
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  cardAnaliseTexto: {
    color: '#8B5A2B',
    fontFamily: Fonte.corpo, fontSize: 12,
  },

  // Card de avisos não vistos (laranja destacado)
  cardAvisos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F1',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#FFD2A8',
  },
  cardAvisosIcone: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFE4CC',
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
    backgroundColor: '#E8760A',
    borderWidth: 2,
    borderColor: '#FFE4CC',
  },
  cardAvisosTitulo: {
    color: '#16202E',
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  cardAvisosTexto: {
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 12,
  },
  cardAvisosBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#E8760A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardAvisosBadgeTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: Fonte.corpoSemi,
  },

  // Linha de menu (default normal)
  linhaMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E7E5DF',
  },
  linhaMenuIcone: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F4F3EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linhaMenuLabel: {
    color: '#16202E',
    fontSize: 14,
    fontFamily: Fonte.corpoSemi,
    marginBottom: 2,
  },
  linhaMenuDescricao: {
    color: '#5B616B',
    fontFamily: Fonte.corpo, fontSize: 11,
  },
});