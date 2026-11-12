import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useUserStore } from '../src/store/userStore';
import { useLinguaStore } from '../src/store/linguaStore';
import { useCores } from '../src/store/themeStore';

/** Ponto de entrada: espera o estado local e decide entre login e tabs. */
export default function Entrada() {
  const cores = useCores();
  const sessaoPronta = useUserStore(s => s.carregado);
  const linguaPronta = useLinguaStore(s => s.carregado);
  const utilizador = useUserStore(s => s.utilizador);

  if (!sessaoPronta || !linguaPronta) return <View style={{ flex: 1, backgroundColor: cores.fundo }} />;
  if (!utilizador) return <Redirect href="/(auth)/login" />;
  // Cada papel tem a sua área; o servidor valida as permissões em cada pedido.
  const destino = utilizador.papel === 'admin' ? '/(admin)/painel' : utilizador.papel === 'docente' ? '/(docente)' : '/(estudante)';
  return <Redirect href={destino} />;
}
