// IMPORTANTE: i18n tem que ser importado ANTES de qualquer outra coisa
// que dependa dele (hooks, componentes, ecrãs).
import '../src/i18n';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useThemeStore } from '../src/store/themeStore';
import { useUserStore } from '../src/store/userStore';
import { useWalletStore } from '../src/store/walletStore';
import { useReferralStore } from '../src/store/referralStore';
import { useModeracaoStore } from '../src/store/moderacaoStore';
import { useLinguaStore } from '../src/store/linguaStore';
import ModalAuthGate from '../src/components/ModalAuthGate';

export default function RootLayout() {
  const carregarTema = useThemeStore(state => state.carregarTema);
  const carregarUsuario = useUserStore(state => state.carregarUsuario);
  const carregarCarteira = useWalletStore(state => state.carregarCarteira);
  const carregarReferencia = useReferralStore(state => state.carregarReferencia);
  const carregarModeracao = useModeracaoStore(state => state.carregarModeracao);
  const carregarLingua = useLinguaStore(state => state.carregarLingua);
  const gerarMeuCodigo = useReferralStore(state => state.gerarMeuCodigo);
  const meuCodigo = useReferralStore(state => state.meuCodigo);
  const usuario = useUserStore(state => state.usuario);
  const modo = useThemeStore(state => state.modo);

  useEffect(() => {
    carregarTema();
    carregarUsuario();
    carregarCarteira();
    carregarReferencia();
    carregarModeracao();
    carregarLingua();
  }, []);

  useEffect(() => {
    if (usuario?.nome && !meuCodigo) {
      gerarMeuCodigo(usuario.nome);
    }
  }, [usuario?.nome, meuCodigo]);

  return (
    <>
      <StatusBar style={modo === 'escuro' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding/lingua" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/escolha-papel" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(procurador)" />
        <Stack.Screen name="(anunciante)" />
        <Stack.Screen name="anuncio/[id]" />
        <Stack.Screen name="imovel/[id]" />
        <Stack.Screen name="pagamento" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="editar-perfil" />
        <Stack.Screen name="aparencia" />
        <Stack.Screen name="carteira" />
        <Stack.Screen name="referencia" />
        <Stack.Screen name="avisos" />
        <Stack.Screen name="denunciar/[id]" />
        <Stack.Screen name="anuncio-detalhes/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="pagamento-publicacao" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="confirmacao-publicacao"
          options={{ gestureEnabled: false }}
        />
      </Stack>

      {/* Modal global do Auth Gate — tem de estar fora do Stack */}
      <ModalAuthGate />
    </>
  );
}