import { Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useCores } from '../store/themeStore';
import { Fonte } from '../theme/fonts';

/** Símbolo da AvaliaProf: uma estrela (avaliação) dentro de um quadrado arredondado na cor principal. */
export function Simbolo({ tamanho = 64 }: { tamanho?: number }) {
  const cores = useCores();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={0} y={0} width={64} height={64} rx={18} fill={cores.principal} />
      <Path
        d="M32 13.5l5.6 11.4 12.6 1.8-9.1 8.9 2.1 12.5L32 42.2l-11.2 5.9 2.1-12.5-9.1-8.9 12.6-1.8z"
        fill={cores.textoSobrePrincipal}
      />
    </Svg>
  );
}

/** Símbolo + nome, para os ecrãs sem sessão. `compacta` põe tudo numa linha. */
export function Marca({ compacta }: { compacta?: boolean }) {
  const cores = useCores();
  const nome = (
    <Text style={{ fontFamily: Fonte.tituloBold, fontSize: compacta ? 20 : 30, letterSpacing: -0.5 }} accessibilityRole="header" accessibilityLabel="AvaliaProf">
      <Text style={{ color: cores.textoPrincipal }}>Avalia</Text>
      <Text style={{ color: cores.principalTexto }}>Prof</Text>
    </Text>
  );
  return compacta ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Simbolo tamanho={32} />{nome}</View>
  ) : (
    <View style={{ alignItems: 'center', gap: 12 }}><Simbolo tamanho={72} />{nome}</View>
  );
}
