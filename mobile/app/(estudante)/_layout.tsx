import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { useUserStore } from '../../src/store/userStore';

type Icone = keyof typeof Ionicons.glyphMap;

const SEPARADORES: { nome: string; chave: string; ativo: Icone; inativo: Icone }[] = [
  { nome: 'index', chave: 'tabs.inicio', ativo: 'home', inativo: 'home-outline' },
  { nome: 'professores', chave: 'tabs.professores', ativo: 'school', inativo: 'school-outline' },
  { nome: 'estatisticas', chave: 'tabs.estatisticas', ativo: 'stats-chart', inativo: 'stats-chart-outline' },
  { nome: 'perfil', chave: 'tabs.perfil', ativo: 'person', inativo: 'person-outline' },
];

export default function EstudanteLayout() {
  const cores = useCores();
  const { t } = useTranslation();
  const utilizador = useUserStore(s => s.utilizador);

  // Rota protegida: sem sessão volta ao login.
  if (!utilizador) return <Redirect href="/(auth)/login" />;
  // Só estudantes: docente e admin vão para a sua área (a entrada decide qual).
  if (utilizador.papel !== 'estudante') return <Redirect href="/" />;

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
            title: t(s.chave),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? s.ativo : s.inativo} color={color as string} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
