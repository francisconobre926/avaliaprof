/**
 * src/hooks/useLingua.ts
 *
 * Hook unificado para i18n + preferência guardada.
 * Combina react-i18next (traduções) + linguaStore (preferência).
 *
 * Uso típico:
 *
 *   import { useLingua } from '../../src/hooks/useLingua';
 *
 *   const { t, lingua, alternar, mudar } = useLingua();
 *
 *   <Text>{t('home.titulo')}</Text>
 *   <Text>Língua actual: {lingua}</Text>
 *   <TouchableOpacity onPress={alternar}>Trocar</TouchableOpacity>
 *   <TouchableOpacity onPress={() => mudar('en')}>Inglês</TouchableOpacity>
 */

import { useTranslation } from 'react-i18next';
import { useLinguaStore, Lingua, LINGUAS_DISPONIVEIS } from '../store/linguaStore';

export function useLingua() {
  const { t } = useTranslation();
  const linguaEscolhida = useLinguaStore(s => s.linguaEscolhida);
  const escolherLingua = useLinguaStore(s => s.escolherLingua);
  const alternarLingua = useLinguaStore(s => s.alternarLingua);

  const lingua: Lingua = linguaEscolhida || 'pt';
  const definicao = LINGUAS_DISPONIVEIS[lingua];

  return {
    // Função de tradução
    t,

    // Estado actual
    lingua,
    bandeira: definicao.bandeira,
    nomeNativo: definicao.nomeNativo,
    completo: definicao.completo,

    // Acções
    mudar: escolherLingua,
    alternar: alternarLingua,

    // Verificações
    ehPortugues: lingua === 'pt',
    ehIngles: lingua === 'en',

    // Lista de línguas disponíveis
    linguasDisponiveis: Object.values(LINGUAS_DISPONIVEIS),
  };
}