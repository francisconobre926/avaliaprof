/**
 * src/theme/index.ts
 *
 * PONTO ÚNICO DE IMPORTAÇÃO do design system.
 * Qualquer ficheiro novo deve importar daqui, não dos ficheiros individuais.
 *
 * Exemplo de uso:
 *
 *   import { Colors, Typography, Spacing, Radius, Sombras, useCores, useTema } from '../../src/theme';
 *
 * Os ficheiros antigos (colors.ts, typography.ts, themeStore.ts) continuam
 * a funcionar — este index só re-exporta tudo de forma centralizada.
 */

// Cores estáticas (modo claro base)
export { Colors, Sombras } from './colors';

// Tipografia + espaçamento + raio
export { Typography, Spacing, Radius } from './typography';

// Theme dinâmico (dark mode, cores de destaque)
export {
  useThemeStore,
  useCores,
  CORES_DESTAQUE,
  PALETA_CLARO,
  PALETA_ESCURO,
} from '../store/themeStore';

export type {
  CorDestaque,
  ModoTema,
  DefinicaoCorDestaque,
  PaletaModo,
} from '../store/themeStore';

/**
 * Alias semântico de useCores — mais explícito que o nome actual.
 * Devolve a paleta activa (claro ou escuro) + cores de destaque.
 */
export { useCores as useTema } from '../store/themeStore';