import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { useCores } from '../store/themeStore';
import { Typography, Spacing } from '../theme/typography';

interface Ponto { semestre: string; total: number; media: number | null }

const ALTURA = 150;
const MARGEM = { topo: 14, base: 28, esq: 26, dir: 12 };
const fmt = (n: number) => n.toFixed(1).replace('.', ',');

/**
 * Evolução da média por semestre (linha e pontos, escala 1 a 5). Os semestres sem amostra mínima não
 * têm média: aparecem só como contagem. Inclui uma versão em texto para leitores de ecrã.
 */
export function GraficoEvolucao({ pontos, largura }: { pontos: Ponto[]; largura: number }) {
  const cores = useCores();
  const area = { w: largura - MARGEM.esq - MARGEM.dir, h: ALTURA - MARGEM.topo - MARGEM.base };
  const x = (i: number) => MARGEM.esq + (pontos.length === 1 ? area.w / 2 : (i / (pontos.length - 1)) * area.w);
  const y = (v: number) => MARGEM.topo + area.h - ((v - 1) / 4) * area.h;
  const comMedia = pontos.map((p, i) => ({ ...p, i })).filter((p): p is Ponto & { i: number; media: number } => p.media != null);

  return (
    <View
      accessible
      accessibilityLabel={`Evolução da média por semestre: ${pontos.map(p => `${p.semestre}, ${p.media == null ? `${p.total} avaliações, sem média` : `média ${fmt(p.media)}`}`).join('; ')}`}
    >
      <Svg width={largura} height={ALTURA}>
        {[1, 2, 3, 4, 5].map(g => (
          <G key={g}>
            <Line x1={MARGEM.esq} x2={largura - MARGEM.dir} y1={y(g)} y2={y(g)} stroke={cores.bordaSubtil} strokeWidth={1} />
            <SvgText x={MARGEM.esq - 8} y={y(g) + 4} fontSize={10} fill={cores.textoTerciario} textAnchor="end">{g}</SvgText>
          </G>
        ))}
        {comMedia.length > 1 && (
          <Polyline points={comMedia.map(p => `${x(p.i)},${y(p.media)}`).join(' ')} fill="none" stroke={cores.principal} strokeWidth={2.5} />
        )}
        {comMedia.map(p => (
          <G key={p.semestre}>
            <Circle cx={x(p.i)} cy={y(p.media)} r={5} fill={cores.principal} />
            <SvgText x={x(p.i)} y={y(p.media) - 10} fontSize={11} fontWeight="bold" fill={cores.textoPrincipal} textAnchor="middle">{fmt(p.media)}</SvgText>
          </G>
        ))}
        {pontos.map((p, i) => (
          <SvgText key={p.semestre} x={x(i)} y={ALTURA - 8} fontSize={10} fill={cores.textoSecundario} textAnchor="middle">{p.semestre}</SvgText>
        ))}
      </Svg>
      {pontos.some(p => p.media == null) && (
        <Text style={[Typography.caption, { color: cores.textoTerciario, marginTop: Spacing.xs }]}>
          Semestres sem média têm menos avaliações do que o mínimo para proteger o anonimato.
        </Text>
      )}
    </View>
  );
}

