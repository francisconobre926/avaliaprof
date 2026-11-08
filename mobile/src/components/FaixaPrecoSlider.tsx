/**
 * Slider de intervalo de preço com histograma — protótipo "Pesquisa" (página 4).
 */
import { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import { useCores } from '../store/themeStore';

interface Props {
  min: number;
  max: number;
  valorMin: number;
  valorMax: number;
  precos: number[];
  passo?: number;
  onChange: (min: number, max: number) => void;
}

const POLEGAR = 28;
const BARRAS = 8;

export default function FaixaPrecoSlider({ min, max, valorMin, valorMax, precos, passo = 500, onChange }: Props) {
  const cores = useCores();
  const [largura, setLargura] = useState(0);
  const estado = useRef({ valorMin, valorMax, largura, inicio: 0, onChange });
  estado.current.onChange = onChange;
  estado.current.valorMin = valorMin;
  estado.current.valorMax = valorMax;
  estado.current.largura = largura;

  const util = Math.max(1, largura - POLEGAR);
  const paraX = (v: number) => ((v - min) / (max - min)) * util;
  const arredondar = (v: number) => Math.round(v / passo) * passo;

  const mover = (qual: 'min' | 'max') =>
    useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { estado.current.inicio = qual === 'min' ? estado.current.valorMin : estado.current.valorMax; },
      onPanResponderMove: (_, g) => {
        const u = Math.max(1, estado.current.largura - POLEGAR);
        const novo = estado.current.inicio + (g.dx / u) * (max - min);
        if (qual === 'min') {
          estado.current.onChange(Math.max(min, Math.min(arredondar(novo), estado.current.valorMax - passo)), estado.current.valorMax);
        } else {
          estado.current.onChange(estado.current.valorMin, Math.min(max, Math.max(arredondar(novo), estado.current.valorMin + passo)));
        }
      },
    }), []);
  const panMin = mover('min');
  const panMax = mover('max');

  const barras = useMemo(() => {
    const c = Array(BARRAS).fill(0);
    precos.forEach(p => { c[Math.min(BARRAS - 1, Math.max(0, Math.floor(((p - min) / (max - min)) * BARRAS)))]++; });
    const topo = Math.max(1, ...c);
    return c.map(v => v / topo);
  }, [precos, min, max]);

  const x1 = paraX(valorMin);
  const x2 = paraX(valorMax);

  return (
    <View onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)} style={s.caixa}>
      <View style={s.histograma}>
        {barras.map((h, i) => {
          const centro = min + ((i + 0.5) / BARRAS) * (max - min);
          const dentro = centro >= valorMin && centro <= valorMax;
          return <View key={i} style={[s.barra, { height: 8 + h * 44, backgroundColor: dentro ? cores.principalClara : cores.fundoSuave, opacity: dentro ? 1 : 0.9 }]} />;
        })}
      </View>
      <View style={s.pista}>
        <View style={[s.pistaBase, { backgroundColor: cores.bordaSubtil }]} />
        <View style={[s.pistaAtiva, { left: x1 + POLEGAR / 2, width: Math.max(0, x2 - x1), backgroundColor: cores.principal }]} />
        <View {...panMin.panHandlers} accessibilityRole="adjustable" accessibilityLabel="Preço mínimo"
          style={[s.polegar, { left: x1, backgroundColor: cores.fundoElevado, borderColor: cores.bordaMedia }]} />
        <View {...panMax.panHandlers} accessibilityRole="adjustable" accessibilityLabel="Preço máximo"
          style={[s.polegar, { left: x2, backgroundColor: cores.fundoElevado, borderColor: cores.bordaMedia }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  caixa: { paddingTop: 8 },
  histograma: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 56, paddingHorizontal: POLEGAR / 2 },
  barra: { flex: 1, borderRadius: 4 },
  pista: { height: POLEGAR, justifyContent: 'center', marginTop: 6 },
  pistaBase: { position: 'absolute', left: POLEGAR / 2, right: POLEGAR / 2, height: 3, borderRadius: 2 },
  pistaAtiva: { position: 'absolute', height: 3, borderRadius: 2 },
  polegar: { position: 'absolute', width: POLEGAR, height: POLEGAR, borderRadius: POLEGAR / 2, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
});
