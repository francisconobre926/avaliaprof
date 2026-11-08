/**
 * Salvos — anúncios guardados pelo procurador (protótipo: tab "Salvos").
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import TopBar from '../../src/components/TopBar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { Typography } from '../../src/theme/typography';
import { Anuncio } from '../../src/types';
import { carregarCatalogo } from '../../src/data/catalogo';
import { useFavoritosStore } from '../../src/store/favoritosStore';
import CartaoEspaco from '../../src/components/CartaoEspaco';
import { Colors } from '../../src/theme/colors';

export default function FavoritosScreen() {
  const router = useRouter();
  const cores = useCores();
  const { ids, carregar, alternar } = useFavoritosStore();
  const [catalogo, setCatalogo] = useState<Anuncio[]>([]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregar();
      carregarCatalogo().then(l => { if (ativo) setCatalogo(l); });
      return () => { ativo = false; };
    }, [carregar]),
  );

  const salvos = ids.map(id => catalogo.find(a => a.id === id)).filter(Boolean) as Anuncio[];

  return (
    <View style={[s.flex, { backgroundColor: cores.fundo }]}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.conteudo}>
        <Text style={[s.titulo, { color: cores.textoPrincipal }]} accessibilityRole="header">Salvos</Text>
        <Text style={[s.sub, { color: cores.textoSecundario }]}>
          {salvos.length} {salvos.length === 1 ? 'espaço guardado' : 'espaços guardados'}
        </Text>

        {salvos.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            {salvos.map(a => (
              <CartaoEspaco
                key={a.id}
                anuncio={a}
                favoritado
                onFavoritar={() => alternar(a.id)}
                onPress={() => router.push(`/anuncio/${a.id}` as any)}
              />
            ))}
          </View>
        ) : (
          <View style={s.vazio}>
            <View style={[s.vazioIcone, { backgroundColor: cores.principalClara }]}>
              <Ionicons name="heart-outline" size={40} color={cores.principal} />
            </View>
            <Text style={[s.vazioTitulo, { color: cores.textoPrincipal }]}>Ainda não tem espaços salvos</Text>
            <Text style={[s.vazioTexto, { color: cores.textoSecundario }]}>
              Toque no coração de um anúncio para o guardar aqui e consultá-lo mais tarde.
            </Text>
            <TouchableOpacity onPress={() => router.push('/(procurador)' as any)} style={[s.cta, { backgroundColor: cores.principal }]}>
              <Text style={{ color: Colors.branco, fontFamily: Fonte.corpoBold, fontSize: 16 }}>Explorar espaços</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  titulo: { ...Typography.tituloPagina },
  sub: { fontFamily: Fonte.corpo, fontSize: 15, marginTop: 2 },
  vazio: { alignItems: 'center', paddingTop: 72, paddingHorizontal: 12, gap: 10 },
  vazioIcone: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  vazioTitulo: { fontFamily: Fonte.tituloBold, fontSize: 20, textAlign: 'center' },
  vazioTexto: { fontFamily: Fonte.corpo, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  cta: { marginTop: 12, paddingHorizontal: 28, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
