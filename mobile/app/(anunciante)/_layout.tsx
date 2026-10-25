import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useCores } from '../../src/store/themeStore';

import { Fonte } from '../../src/theme/fonts';
// ============================================================
// CORES GOHOME OFICIAIS
// ============================================================
const LARANJA_MARCA = '#E8760A';

export default function AnuncianteLayout() {
  const cores = useCores();

  return (
    <Tabs
      screenOptions={{
        // Anunciante: cor activa é laranja GoHome (identidade do papel)
        tabBarActiveTintColor: LARANJA_MARCA,
        tabBarInactiveTintColor: cores.textoTerciario,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonte.corpoSemi,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: cores.fundoElevado,
          borderTopColor: cores.bordaSubtil,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="publicar"
        options={{
          title: 'Publicar',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="anuncios"
        options={{
          title: 'Meus Anúncios',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}