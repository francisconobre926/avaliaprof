/**
 * src/i18n/index.ts
 *
 * Setup do motor de internacionalização (i18next + react-i18next).
 *
 * Como funciona:
 * 1. Este ficheiro é importado uma vez no app/_layout.tsx (`import '../src/i18n'`)
 * 2. Inicializa i18next com PT como default
 * 3. O linguaStore chama `i18n.changeLanguage()` quando o utilizador escolhe
 *
 * Como usar nos componentes:
 *
 *   import { useTranslation } from 'react-i18next';
 *
 *   function MinhaScreen() {
 *     const { t } = useTranslation();
 *     return <Text>{t('comum.ola')}</Text>;
 *   }
 *
 * Ou via hook próprio:
 *
 *   import { useLingua } from '../hooks/useLingua';
 *
 *   const { t, lingua, alternar } = useLingua();
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './pt.json';
import en from './en.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',          // compat RN
    lng: 'pt',                        // default: Português Moçambicano
    fallbackLng: 'pt',                // se chave não existir, usa PT
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    interpolation: {
      escapeValue: false,             // React já escapa
    },
    react: {
      useSuspense: false,             // evita problemas de hydration em RN
    },
  });

export default i18n;