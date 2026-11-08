/**
 * Separador Reservas — lista de reservas do procurador (protótipo: tab "Reservas").
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '../../src/components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { Reserva, EstadoReserva, useReservasStore } from '../../src/store/reservasStore';
import { cancelamentoGratis, formatarIntervalo, formatarMT } from '../../src/utils/reservas';
import { Colors } from '../../src/theme/colors';

type Filtro = 'ativas' | 'passadas';

const ROTULO: Record<EstadoReserva, string> = {
  confirmada: 'Confirmada', pendente: 'Pendente', cancelada: 'Cancelada', concluida: 'Concluída',
};

export default function ReservasScreen() {
  const cores = useCores();
  const router = useRouter();
  const { reservas, carregado, carregar, cancelar } = useReservasStore();
  const [filtro, setFiltro] = useState<Filtro>('ativas');

  useEffect(() => { if (!carregado) carregar(); }, [carregado, carregar]);

  const hoje = new Date().toISOString().slice(0, 10);
  const lista = useMemo(() => reservas.filter(r => {
    const ativa = (r.estado === 'confirmada' || r.estado === 'pendente') && r.saida >= hoje;
    return filtro === 'ativas' ? ativa : !ativa;
  }), [reservas, filtro, hoje]);

  const cor = (e: EstadoReserva) =>
    e === 'confirmada' ? cores.sucesso : e === 'pendente' ? cores.aviso : e === 'cancelada' ? cores.erro : cores.textoSecundario;

  const pedirCancelamento = (r: Reserva) => {
    const gratis = cancelamentoGratis(r.entrada);
    Alert.alert(
      'Cancelar reserva?',
      gratis
        ? `Cancelamento gratuito: ${formatarMT(r.total)} serão devolvidos para ${r.metodo === 'mpesa' ? 'M-Pesa' : 'e-Mola'}.`
        : 'Faltam menos de 48 h para a entrada, por isso o valor não será reembolsado.',
      [
        { text: 'Manter', style: 'cancel' },
        { text: 'Cancelar reserva', style: 'destructive', onPress: () => cancelar(r.id) },
      ],
    );
  };

  return (
    <View style={[s.flex, { backgroundColor: cores.fundo }]}>
      <TopBar />
      <Text style={[s.titulo, { color: cores.textoPrincipal }]}>Reservas</Text>
      <View style={s.abas}>
        {(['ativas', 'passadas'] as const).map(f => (
          <TouchableOpacity key={f} onPress={() => setFiltro(f)}
            style={[s.aba, { backgroundColor: filtro === f ? cores.textoPrincipal : cores.fundoSuave }]}>
            <Text style={{ fontFamily: Fonte.corpoSemi, color: filtro === f ? cores.fundo : cores.textoSecundario }}>
              {f === 'ativas' ? 'Ativas' : 'Passadas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {lista.length === 0 && (
          <View style={s.vazio}>
            <Ionicons name="calendar-outline" size={44} color={cores.textoTerciario} />
            <Text style={[s.vazioTitulo, { color: cores.textoPrincipal }]}>
              {filtro === 'ativas' ? 'Sem reservas ativas' : 'Sem reservas passadas'}
            </Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, textAlign: 'center' }}>
              Explore casas e salões e reserve com M-Pesa ou e-Mola.
            </Text>
            {filtro === 'ativas' && (
              <TouchableOpacity onPress={() => router.push('/(procurador)' as any)} style={[s.cta, { backgroundColor: cores.principal }]}>
                <Text style={{ color: Colors.branco, fontFamily: Fonte.corpoBold }}>Explorar espaços</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {lista.map(r => (
          <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => router.push(`/anuncio/${r.anuncioId}` as any)}
            style={[s.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
            <View style={[s.barra, { backgroundColor: cor(r.estado) }]} />
            <View style={{ flex: 1 }}>
              <View style={s.linha}>
                <Text style={[s.nome, { color: cores.textoPrincipal }]} numberOfLines={1}>{r.titulo}</Text>
                <Text style={{ color: cor(r.estado), fontFamily: Fonte.corpoSemi, fontSize: 12 }}>{ROTULO[r.estado]}</Text>
              </View>
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13, marginTop: 2 }}>
                {formatarIntervalo(r.entrada, r.saida)} · {r.codigo}
              </Text>
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>
                {r.noites} noite(s) · {r.hospedes} pessoa(s) · {formatarMT(r.total)}
              </Text>
              {r.estado === 'confirmada' && r.saida >= hoje && (
                <TouchableOpacity onPress={() => pedirCancelamento(r)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <Text style={{ color: cores.erro, fontFamily: Fonte.corpoSemi, fontSize: 13 }}>Cancelar reserva</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  titulo: { fontFamily: Fonte.tituloBold, fontSize: 28, paddingHorizontal: 16, paddingTop: 16 },
  abas: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  aba: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
  cartao: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 18, padding: 14 },
  barra: { width: 4, borderRadius: 2 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  nome: { flex: 1, fontFamily: Fonte.corpoBold, fontSize: 16 },
  vazio: { alignItems: 'center', gap: 8, paddingTop: 64, paddingHorizontal: 24 },
  vazioTitulo: { fontFamily: Fonte.corpoBold, fontSize: 18 },
  cta: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
});
