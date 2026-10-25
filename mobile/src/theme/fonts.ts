// ============================================================
// Famílias tipográficas GoHome
//
// Títulos e preços → Bricolage Grotesque (grotesca com carácter,
//   cortes ópticos, dá personalidade sem perder legibilidade).
// Texto corrido, labels e UI → Instrument Sans (neutra, compacta,
//   excelente em tamanhos pequenos).
//
// Em React Native o fontWeight não selecciona o corte de uma fonte
// custom (sobretudo em Android), por isso cada peso é uma família.
// Usa sempre estas constantes em vez de fontWeight.
// ============================================================
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';

export const Fonte = {
  titulo: 'BricolageGrotesque_500Medium',
  tituloSemi: 'BricolageGrotesque_600SemiBold',
  tituloBold: 'BricolageGrotesque_700Bold',

  corpo: 'InstrumentSans_400Regular',
  corpoMedio: 'InstrumentSans_500Medium',
  corpoSemi: 'InstrumentSans_600SemiBold',
  corpoBold: 'InstrumentSans_700Bold',
} as const;

/** Mapa passado ao useFonts() no layout raiz. */
export const FONTES_A_CARREGAR = {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
};
