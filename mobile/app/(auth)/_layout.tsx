import { Redirect, Stack } from 'expo-router';
import { useUserStore } from '../../src/store/userStore';

export default function AuthGrupoLayout() {
  const utilizador = useUserStore(s => s.utilizador);
  // Com sessão, a entrada decide a área certa para o papel (estudante, docente ou admin).
  if (utilizador) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
