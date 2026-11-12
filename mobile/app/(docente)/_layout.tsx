import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { useUserStore } from '../../src/store/userStore';

type Icone = keyof typeof Ionicons.glyphMap;

const SEPARADORES: { nome: string; titulo: string; ativo: Icone; inativo: Icone }[] = [
  { nome: 'index', titulo: 'Painel', ativo: 'stats-chart', inativo: 'stats-chart-outline' },
  { nome: 'comentarios', titulo: 'Comentários', ativo: 'chatbubbles', inativo: 'chatbubbles-outline' },
  { nome: 'qr', titulo: 'QR da aula', ativo: 'qr-code', inativo: 'qr-code-outline' },
  { nome: 'perfil', titulo: 'Perfil', ativo: 'person', inativo: 'person-outline' },
];

/** Área do docente. A protecção real está no servidor; aqui só se evita mostrar o ecrã a quem não é docente. */
export default function DocenteLayout() {
  const cores = useCores();
  const utilizador = useUserStore(s => s.utilizador);
  if (!utilizador) return <Redirect href="/(auth)/login" />;
  if (utilizador.papel !== 'docente') return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.principalTexto,
        tabBarInactiveTintColor: cores.textoTerciario,
        tabBarLabelStyle: { fontSize: 12, fontFamily: Fonte.corpoSemi },
        tabBarStyle: {
          backgroundColor: cores.fundoElevado,
          borderTopColor: cores.bordaSubtil,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
        },
      }}
    >
      {SEPARADORES.map(s => (
        <Tabs.Screen
          key={s.nome}
          name={s.nome}
          options={{
            title: s.titulo,
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? s.ativo : s.inativo} color={color as string} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
