/**
 * Mensagens — lista de conversas (protótipo, página 6).
 * Avatar com miniatura do anúncio, estado da conversa (pílula), pré-visualização
 * e contador de não lidas.
 */
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { Typography } from '../../src/theme/typography';
import { Colors } from '../../src/theme/colors';

type Estado = 'confirmada' | 'visita' | 'pedido' | 'consulta' | 'concluida';
type Filtro = 'todas' | 'naoLidas' | 'anfitriao';

interface Conversa {
  id: string;
  nome: string;
  anuncio: string;
  contexto?: string;
  estado: Estado;
  ultimaMensagem: string;
  hora: string;
  naoLidas: number;
  verificado: boolean;
}

const conversas: Conversa[] = [
  { id: '1', nome: 'Maria Chissano', anuncio: 'Quarto individual perto da UZ', estado: 'confirmada', ultimaMensagem: 'Sim, ainda está disponível. Quando queres visitar?', hora: '14:30', naoLidas: 2, verificado: true },
  { id: '2', nome: 'Imobiliária Costa Sol', anuncio: 'Apartamento T2 Ponta-Gêa', estado: 'visita', ultimaMensagem: 'Podemos marcar visita esta semana.', hora: '11:45', naoLidas: 1, verificado: true },
  { id: '3', nome: 'João Nhamirre', anuncio: 'Casa T3 com quintal', estado: 'pedido', ultimaMensagem: 'Você: A casa tem 3 quartos e 2 casas de banho?', hora: 'Ontem', naoLidas: 0, verificado: false },
  { id: '4', nome: 'Ana Muchanga', anuncio: 'Quarto partilhado Manga', estado: 'concluida', ultimaMensagem: 'Perfeito, aguardo a tua visita amanhã às 10h', hora: 'Segunda', naoLidas: 0, verificado: false },
];

const ESTADOS: Record<Estado, { rotulo: string; cor: 'sucesso' | 'aviso' | 'principal' | 'neutro' }> = {
  confirmada: { rotulo: 'Confirmada', cor: 'sucesso' },
  visita: { rotulo: 'Visita pendente', cor: 'aviso' },
  pedido: { rotulo: 'Pedido enviado', cor: 'principal' },
  consulta: { rotulo: 'Consulta', cor: 'neutro' },
  concluida: { rotulo: 'Concluída', cor: 'neutro' },
};

const iniciais = (nome: string) => nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

export default function MensagensScreen() {
  const router = useRouter();
  const cores = useCores();
  const [pesquisa, setPesquisa] = useState('');
  const [procurar, setProcurar] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const lista = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-PT');
    return conversas.filter(c => {
      const texto = !termo || [c.nome, c.anuncio, c.ultimaMensagem].some(v => v.toLocaleLowerCase('pt-PT').includes(termo));
      const f = filtro === 'todas' || (filtro === 'naoLidas' && c.naoLidas > 0) || (filtro === 'anfitriao' && c.verificado);
      return texto && f;
    });
  }, [pesquisa, filtro]);

  const cor = (k: 'sucesso' | 'aviso' | 'principal' | 'neutro') => {
    switch (k) {
      case 'sucesso': return { fundo: cores.sucesso + '1F', texto: cores.sucesso };
      case 'aviso': return { fundo: cores.aviso + '24', texto: cores.aviso };
      case 'principal': return { fundo: cores.principalClara, texto: cores.principal };
      default: return { fundo: cores.fundoSuave, texto: cores.textoSecundario };
    }
  };
  const tons = [cores.principalClara, cores.aviso + '24', cores.sucesso + '24', cores.fundoSuave];

  const Aba = ({ id, texto }: { id: Filtro; texto: string }) => {
    const ativo = filtro === id;
    return (
      <TouchableOpacity
        onPress={() => setFiltro(id)}
        accessibilityRole="tab"
        accessibilityState={{ selected: ativo }}
        style={[s.chip, ativo ? { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal } : { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
      >
        <Text style={{ color: ativo ? cores.fundo : cores.textoPrincipal, fontFamily: Fonte.corpoSemi, fontSize: 15 }}>{texto}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[s.flex, { backgroundColor: cores.fundo }]}>
      <View style={s.cabecalho}>
        <Text style={[s.titulo, { color: cores.textoPrincipal }]}>Mensagens</Text>
        <TouchableOpacity
          onPress={() => { setProcurar(v => !v); if (procurar) setPesquisa(''); }}
          style={[s.botaoCirculo, { borderColor: cores.bordaSubtil, backgroundColor: cores.fundoElevado }]}
          accessibilityLabel={procurar ? 'Fechar pesquisa' : 'Pesquisar conversas'}
        >
          <Ionicons name={procurar ? 'close' : 'search'} size={20} color={cores.textoPrincipal} />
        </TouchableOpacity>
      </View>

      {procurar && (
        <View style={[s.pesquisa, { backgroundColor: cores.fundoSuave }]}>
          <Ionicons name="search" size={18} color={cores.textoSecundario} />
          <TextInput
            autoFocus
            value={pesquisa}
            onChangeText={setPesquisa}
            placeholder="Pesquisar pessoas, anúncios…"
            placeholderTextColor={cores.textoTerciario}
            style={[s.pesquisaInput, { color: cores.textoPrincipal }]}
            returnKeyType="search"
          />
        </View>
      )}

      <View style={s.chips}>
        <Aba id="todas" texto="Todas" />
        <Aba id="naoLidas" texto="Não lidas" />
        <Aba id="anfitriao" texto="Anfitrião" />
      </View>

      <FlatList
        data={lista}
        keyExtractor={c => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={s.vazio}>
            <Ionicons name="chatbubbles-outline" size={44} color={cores.textoTerciario} />
            <Text style={[s.vazioTitulo, { color: cores.textoPrincipal }]}>Sem conversas</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, textAlign: 'center' }}>
              {pesquisa || filtro !== 'todas' ? 'Nenhuma conversa corresponde ao filtro.' : 'Contacte um anfitrião a partir de um anúncio.'}
            </Text>
          </View>
        }
        renderItem={({ item: c, index }) => {
          const e = ESTADOS[c.estado];
          const t = cor(e.cor);
          const naoLida = c.naoLidas > 0;
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push(`/chat/${c.id}` as any)}
              style={[s.linha, { borderBottomColor: cores.bordaSubtil }]}
              accessibilityRole="button"
              accessibilityLabel={`Conversa com ${c.nome}${naoLida ? `, ${c.naoLidas} por ler` : ''}`}
            >
              <View style={s.avatarCaixa}>
                <View style={[s.avatar, { backgroundColor: tons[index % tons.length] }]}>
                  <Text style={[s.avatarTexto, { color: cores.principalTexto }]}>{iniciais(c.nome)}</Text>
                </View>
                <View style={[s.miniatura, { backgroundColor: tons[(index + 1) % tons.length], borderColor: cores.fundo }]} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={s.topo}>
                  <Text style={[s.nome, { color: cores.textoPrincipal }]} numberOfLines={1}>{c.nome}</Text>
                  <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14 }}>{c.hora}</Text>
                </View>
                <View style={s.meio}>
                  <View style={[s.pilula, { backgroundColor: t.fundo }]}>
                    <Text style={[s.pilulaTexto, { color: t.texto }]}>{e.rotulo}</Text>
                  </View>
                  <Text style={{ flex: 1, color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14 }} numberOfLines={1}>{c.anuncio}</Text>
                </View>
                <View style={s.fundoLinha}>
                  <Text
                    style={{ flex: 1, color: naoLida ? cores.textoPrincipal : cores.textoSecundario, fontFamily: naoLida ? Fonte.corpoBold : Fonte.corpo, fontSize: 14 }}
                    numberOfLines={1}
                  >
                    {c.ultimaMensagem}
                  </Text>
                  {naoLida && (
                    <View style={[s.contador, { backgroundColor: cores.principal }]}>
                      <Text style={s.contadorTexto}>{c.naoLidas}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  titulo: { ...Typography.tituloPagina },
  botaoCirculo: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pesquisa: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 12, paddingHorizontal: 16, height: 46, borderRadius: 999 },
  pesquisaInput: { flex: 1, fontFamily: Fonte.corpo, fontSize: 16 },
  chips: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  chip: { paddingHorizontal: 20, height: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  linha: { flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarCaixa: { width: 64, height: 64 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { fontFamily: Fonte.tituloBold, fontSize: 20 },
  miniatura: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 9, borderWidth: 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  nome: { flex: 1, fontFamily: Fonte.corpoBold, fontSize: 16 },
  meio: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  pilula: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  pilulaTexto: { fontFamily: Fonte.corpoSemi, fontSize: 12 },
  fundoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  contador: { minWidth: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  contadorTexto: { color: Colors.branco, fontFamily: Fonte.corpoSemi, fontSize: 13 },
  vazio: { alignItems: 'center', gap: 8, paddingTop: 80, paddingHorizontal: 32 },
  vazioTitulo: { fontFamily: Fonte.corpoBold, fontSize: 18 },
});
