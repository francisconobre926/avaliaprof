// ============================================================
// Famílias tipográficas AvaliaProf
//
//   Sora    → títulos de página, cabeçalhos de secção, preços e destaques.
//             Geométrica, ampla e com personalidade; só em tamanhos ≥ 15.
//   Manrope → texto corrido, formulários, botões, navegação, labels e cards.
//             Legível em tamanhos pequenos, com bom ritmo em listas.
//
// Ambas incluem o conjunto Latin Extended: acentos e cedilha do português
// (á é í ó ú â ê ô ã õ ç) são desenhados nativamente, sem fallback.
//
// Em React Native o fontWeight não seleciona o corte de uma fonte custom
// (sobretudo em Android), por isso cada peso é uma família. Usa sempre
// estas constantes — nunca fontFamily/fontWeight literais.
//
// Pesos: 400 · 500 · 600 · 700 · 800. O 800 é reservado a títulos grandes
// e números de destaque; texto pequeno nunca passa de 700.
// ============================================================
export const Fonte = {
  // Sora — títulos
  titulo: 'Sora_500Medium',
  tituloSemi: 'Sora_600SemiBold',
  tituloBold: 'Sora_700Bold',
  tituloExtra: 'Sora_800ExtraBold',

  // Manrope — texto e interface
  corpo: 'Manrope_400Regular',
  corpoMedio: 'Manrope_500Medium',
  corpoSemi: 'Manrope_600SemiBold',
  corpoBold: 'Manrope_700Bold',
  corpoExtra: 'Manrope_800ExtraBold',
} as const;

/**
 * Mapa passado ao useFonts() no layout raiz.
 * Cada ficheiro é requerido diretamente (e não pelo índice do pacote
 * @expo-google-fonts) para o Metro empacotar só os 9 cortes usados.
 */
export const FONTES_A_CARREGAR = {
  Sora_500Medium: require('@expo-google-fonts/sora/500Medium/Sora_500Medium.ttf'),
  Sora_600SemiBold: require('@expo-google-fonts/sora/600SemiBold/Sora_600SemiBold.ttf'),
  Sora_700Bold: require('@expo-google-fonts/sora/700Bold/Sora_700Bold.ttf'),
  Sora_800ExtraBold: require('@expo-google-fonts/sora/800ExtraBold/Sora_800ExtraBold.ttf'),
  Manrope_400Regular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
  Manrope_500Medium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
  Manrope_800ExtraBold: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
};
