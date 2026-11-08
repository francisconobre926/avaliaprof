/**
 * Calendário de intervalo (entrada → saída) com datas ocupadas riscadas.
 * Toque 1 = entrada, toque 2 = saída. Intervalos que atravessam datas ocupadas são recusados.
 */
import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../store/themeStore';
import { Fonte } from '../theme/fonts';
import { MESES_LONGOS, deISO, paraISO, intervaloLivre } from '../utils/reservas';

interface Props {
  entrada: string | null;
  saida: string | null;
  ocupadas: string[];
  onChange: (entrada: string | null, saida: string | null) => void;
  onConflito?: () => void;
}

const DIAS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export default function CalendarioReserva({ entrada, saida, ocupadas, onChange, onConflito }: Props) {
  const cores = useCores();
  const hoje = useMemo(() => paraISO(new Date()), []);
  const [mes, setMes] = useState(() => {
    const b = entrada ? deISO(entrada) : new Date();
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });
  const setOcupadas = useMemo(() => new Set(ocupadas), [ocupadas]);

  // Semana começa à segunda (como no protótipo: S T Q Q S S D)
  const offset = (mes.getDay() + 6) % 7;
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celulas: (string | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => paraISO(new Date(mes.getFullYear(), mes.getMonth(), i + 1))),
  ];

  const mesAnteriorBloqueado =
    mes.getFullYear() === new Date().getFullYear() && mes.getMonth() <= new Date().getMonth();

  const tocar = (iso: string) => {
    if (iso < hoje || setOcupadas.has(iso)) return;
    if (!entrada || (entrada && saida) || iso <= entrada) {
      onChange(iso, null);
      return;
    }
    if (!intervaloLivre(entrada, iso, ocupadas)) {
      onConflito?.();
      onChange(iso, null);
      return;
    }
    onChange(entrada, iso);
  };

  return (
    <View>
      <View style={styles.cabecalho}>
        <TouchableOpacity
          disabled={mesAnteriorBloqueado}
          onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
          style={[styles.seta, { borderColor: cores.bordaMedia, opacity: mesAnteriorBloqueado ? 0.35 : 1 }]}
          accessibilityLabel="Mês anterior"
        >
          <Ionicons name="chevron-back" size={18} color={cores.textoPrincipal} />
        </TouchableOpacity>
        <Text style={[styles.mes, { color: cores.textoPrincipal }]}>
          {MESES_LONGOS[mes.getMonth()]} {mes.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
          style={[styles.seta, { borderColor: cores.bordaMedia }]}
          accessibilityLabel="Mês seguinte"
        >
          <Ionicons name="chevron-forward" size={18} color={cores.textoPrincipal} />
        </TouchableOpacity>
      </View>

      <View style={styles.linha}>
        {DIAS.map((d, i) => (
          <Text key={i} style={[styles.diaSemana, { color: cores.textoTerciario }]}>{d}</Text>
        ))}
      </View>

      <View style={styles.grelha}>
        {celulas.map((iso, i) => {
          if (!iso) return <View key={`v${i}`} style={styles.celula} />;
          const dia = deISO(iso).getDate();
          const passado = iso < hoje;
          const ocupado = setOcupadas.has(iso);
          const extremo = iso === entrada || iso === saida;
          const noPeriodo = !!entrada && !!saida && iso > entrada && iso < saida;
          return (
            <TouchableOpacity
              key={iso}
              disabled={passado || ocupado}
              onPress={() => tocar(iso)}
              activeOpacity={0.7}
              accessibilityLabel={`${dia} de ${MESES_LONGOS[mes.getMonth()]}${ocupado ? ', ocupado' : ''}`}
              style={styles.celula}
            >
              <View
                style={[
                  styles.dia,
                  ocupado && { backgroundColor: cores.fundoSuave },
                  noPeriodo && { backgroundColor: cores.principalClara },
                  extremo && { backgroundColor: cores.textoPrincipal },
                ]}
              >
                <Text
                  style={[
                    styles.diaTexto,
                    { color: passado ? cores.bordaMedia : cores.textoPrincipal },
                    ocupado && { color: cores.textoTerciario, textDecorationLine: 'line-through' },
                    noPeriodo && { color: cores.principalTexto },
                    extremo && { color: cores.fundoElevado },
                  ]}
                >
                  {dia}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legenda}>
        <Leg cor={cores.textoPrincipal} texto="Selecionado" cores={cores} />
        <Leg cor={cores.principalClara} texto="No período" cores={cores} />
        <Leg cor={cores.fundoSuave} texto="Ocupado" cores={cores} riscado />
      </View>
    </View>
  );
}

function Leg({ cor, texto, cores, riscado }: { cor: string; texto: string; cores: any; riscado?: boolean }) {
  return (
    <View style={styles.legItem}>
      <View style={[styles.legPonto, { backgroundColor: cor, borderColor: cores.bordaSubtil }]} />
      <Text style={[styles.legTexto, { color: cores.textoSecundario }, riscado && { textDecorationLine: 'line-through' }]}>
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  seta: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mes: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  linha: { flexDirection: 'row' },
  diaSemana: { flex: 1, textAlign: 'center', fontFamily: Fonte.corpoSemi, fontSize: 12, paddingBottom: 6 },
  grelha: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  dia: { flex: 1, width: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  diaTexto: { fontFamily: Fonte.corpoSemi, fontSize: 14 },
  legenda: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legPonto: { width: 12, height: 12, borderRadius: 6, borderWidth: 1 },
  legTexto: { fontFamily: Fonte.corpo, fontSize: 12 },
});
