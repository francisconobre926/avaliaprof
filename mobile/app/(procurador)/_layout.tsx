import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useCores } from '../../src/store/themeStore';

import { Fonte } from '../../src/theme/fonts';
export default function ProcuradorLayout() {
  const cores = useCores();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: cores.principal,       // Azul GoHome #0A6BC0
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
          title: 'Início',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pesquisar"
        options={{
          title: 'Pesquisar',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mensagens"
        options={{
          title: 'Mensagens',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} color={color} size={size} />
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