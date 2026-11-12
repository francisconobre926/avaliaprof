// i18n tem de ser importado antes de qualquer ecrã que o use.
import '../src/i18n';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { FONTES_A_CARREGAR } from '../src/theme/fonts';
import { useThemeStore } from '../src/store/themeStore';
import { useUserStore } from '../src/store/userStore';
import { useLinguaStore } from '../src/store/linguaStore';
import { iniciarMotor } from '../src/offline/rede';
import { useSinoNotificacoes } from '../src/hooks/useSinoNotificacoes';
import { ToastProvider } from '../src/components/ui';

export default function RootLayout() {
  const carregarTema = useThemeStore(s => s.carregarTema);
  const carregarSessao = useUserStore(s => s.carregarSessao);
  const carregarLingua = useLinguaStore(s => s.carregarLingua);
  const estudanteId = useUserStore(s => (s.utilizador?.papel === 'estudante' ? s.utilizador.id : null));
  const comSessao = useUserStore(s => !!s.utilizador);
  const modo = useThemeStore(s => s.modo);
  const [fontesCarregadas, erroFontes] = useFonts(FONTES_A_CARREGAR);

  useEffect(() => {
    carregarTema();
    carregarSessao();
    carregarLingua();
  }, []);

  // Modo offline (só estudantes): fila de avaliações e sincronização, ligados à sessão.
  useEffect(() => (estudanteId ? iniciarMotor(estudanteId) : undefined), [estudanteId]);

  // Sino de notificações: contador actualizado enquanto houver sessão.
  useSinoNotificacoes(comSessao);

  // Sem as fontes o primeiro frame "salta"; em caso de erro seguimos com a fonte de sistema.
  if (!fontesCarregadas && !erroFontes) return null;

  return (
    <ToastProvider>
      <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(estudante)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="gestao/estudante" />
        <Stack.Screen name="gestao/turma" />
        <Stack.Screen name="gestao/turma-detalhe" />
        <Stack.Screen name="gestao/turma-adicionar" />
        <Stack.Screen name="gestao/importar" />
        <Stack.Screen name="professor/[id]" />
        <Stack.Screen name="editar-perfil" />
        <Stack.Screen name="minhas-cadeiras" />
        <Stack.Screen name="avaliar" />
        <Stack.Screen name="minhas-avaliacoes" />
        <Stack.Screen name="aparencia" />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="alterar-senha" />
      </Stack>
    </ToastProvider>
  );
}
