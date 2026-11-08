/**
 * Pesquisa — painel de filtros (protótipo, página 4).
 * Define os filtros partilhados (filtrosStore) e volta a "Explorar" com
 * o botão "Mostrar N espaços".
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { apenasDisponiveis } from '../../src/data/anuncios-mock';
import { carregarCatalogo } from '../../src/data/catalogo';
import { Anuncio } from '../../src/types';
import {
  useFiltrosStore, aplicarFiltros, PRECO_MIN, PRECO_MAX,
  Comodidade, TipoAluguer, TipoEspaco,
} from '../../src/store/filtrosStore';
import { formatarDataCurta, noitesEntre } from '../../src/utils/reservas';
import CalendarioReserva from '../../src/components/CalendarioReserva';
import TopBar from '../../src/components/TopBar';
import FaixaPrecoSlider from '../../src/components/FaixaPrecoSlider';
import { Colors } from '../../src/theme/colors';

const RECENTES = ['Polana', 'Matola', 'Beira'];
const TIPOS: { id: TipoEspaco; nome: string }[] = [
  { id: 'casa', nome: 'Casa' }, { id: 'apartamento', nome: 'Apartamento' }, { id: 'salao', nome: 'Salão' },
];
const ALUGUER: { id: TipoAluguer; nome: string }[] = [
  { id: 'diario', nome: 'Diário' }, { id: 'mensal', nome: 'Mensal' }, { id: 'evento', nome: 'Por evento' },
];
const PERTO = [
  { id: 'universidade', nome: 'Universidade' }, { id: 'trabalho', nome: 'Trabalho' },
  { id: 'praia', nome: 'Praia' }, { id: 'evento', nome: 'Local do evento' },
];
const DISTANCIAS = [1, 3, 5, 10];
const COMODIDADES: { id: Comodidade; nome: string }[] = [
  { id: 'wifi', nome: 'Wi‑Fi' }, { id: 'arCondicionado', nome: 'Ar condicionado' },
  { id: 'piscina', nome: 'Piscina' }, { id: 'gerador', nome: 'Gerador' }, { id: 'estacionamento', nome: 'Estacionamento' },
];

const mt = (n: number) => `${n.toLocaleString('pt-PT').replace(/\s/g, '.')}`;

export default function PesquisarScreen() {
  const router = useRouter();
  const cores = useCores();
  const filtros = useFiltrosStore(st => st.filtros);
  const definir = useFiltrosStore(st => st.definir);
  const limpar = useFiltrosStore(st => st.limpar);
  const [catalogo, setCatalogo] = useState<Anuncio[]>([]);
  const [calendario, setCalendario] = useState(false);
  const [rascEntrada, setRascEntrada] = useState<string | null>(filtros.entrada);
  const [rascSaida, setRascSaida] = useState<string | null>(filtros.saida);

  useEffect(() => { carregarCatalogo().then(l => setCatalogo(apenasDisponiveis(l))); }, []);

  const total = useMemo(() => aplicarFiltros(catalogo, filtros).length, [catalogo, filtros]);
  const noites = filtros.entrada && filtros.saida ? noitesEntre(filtros.entrada, filtros.saida) : 0;
  const alternar = <T,>(lista: T[], v: T) => (lista.includes(v) ? lista.filter(x => x !== v) : [...lista, v]);

  const Chip = ({ ativo, texto, onPress, escuro, marca }: { ativo: boolean; texto: string; onPress: () => void; escuro?: boolean; marca?: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[s.chip, ativo
        ? { backgroundColor: escuro ? cores.textoPrincipal : cores.principal, borderColor: 'transparent' }
        : { backgroundColor: escuro ? cores.fundoSuave : cores.fundoElevado, borderColor: escuro ? 'transparent' : cores.bordaSubtil }]}
    >
      <Text style={[s.chipTexto, { color: ativo ? Colors.branco : cores.textoPrincipal, fontFamily: ativo ? Fonte.corpoBold : Fonte.corpoMedio }]}>
        {ativo && marca ? <Ionicons name="checkmark" size={15} color={Colors.branco} /> : null}{ativo && marca ? ' ' : ''}{texto}
      </Text>
    </TouchableOpacity>
  );

  const Titulo = ({ children, direita }: { children: string; direita?: React.ReactNode }) => (
    <View style={s.tituloLinha}>
      <Text style={[s.titulo, { color: cores.textoPrincipal }]}>{children}</Text>
      {direita}
    </View>
  );

  return (
    <View style={[s.flex, { backgroundColor: cores.fundoElevado }]}>
      <TopBar
        titulo="Pesquisa"
        onVoltar={() => router.back()}
        acoes={
          <TouchableOpacity onPress={limpar} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar filtros">
            <Text style={s.limparTopo}>Limpar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[s.campo, { borderColor: cores.textoPrincipal }]}>
          <Ionicons name="search" size={20} color={cores.textoPrincipal} />
          <TextInput
            value={filtros.termo}
            onChangeText={t => definir({ termo: t })}
            placeholder="Onde? Bairro, cidade ou espaço"
            placeholderTextColor={cores.textoTerciario}
            style={[s.campoInput, { color: cores.textoPrincipal }]}
            returnKeyType="search"
            accessibilityLabel="Pesquisar"
          />
          {filtros.termo.length > 0 && (
            <TouchableOpacity onPress={() => definir({ termo: '' })} hitSlop={8} accessibilityLabel="Limpar pesquisa">
              <Ionicons name="close-circle" size={18} color={cores.textoTerciario} />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.recentes}>
          <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14 }}>Recentes:</Text>
          {RECENTES.map(r => (
            <TouchableOpacity key={r} onPress={() => definir({ termo: r })} style={[s.recente, { backgroundColor: cores.fundoSuave }]}>
              <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoMedio, fontSize: 14 }}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Titulo>Tipo de espaço</Titulo>
        <View style={s.linhaChips}>
          {TIPOS.map(t => (
            <Chip key={t.id} ativo={filtros.tipo === t.id} texto={t.nome} onPress={() => definir({ tipo: filtros.tipo === t.id ? null : t.id })} />
          ))}
        </View>

        <View style={[s.div, { backgroundColor: cores.bordaSubtil }]} />
        <TouchableOpacity style={s.linhaLink} onPress={() => { setRascEntrada(filtros.entrada); setRascSaida(filtros.saida); setCalendario(true); }} accessibilityRole="button">
          <View style={{ flex: 1 }}>
            <Text style={[s.titulo, { color: cores.textoPrincipal }]}>Datas</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 15, marginTop: 2 }}>
              {noites > 0
                ? `${formatarDataCurta(filtros.entrada!)} → ${formatarDataCurta(filtros.saida!)} · ${noites} ${noites === 1 ? 'noite' : 'noites'}`
                : 'Escolher entrada e saída'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={cores.textoSecundario} />
        </TouchableOpacity>
        <View style={[s.div, { backgroundColor: cores.bordaSubtil }]} />

        <View style={s.linhaLink}>
          <View style={{ flex: 1 }}>
            <Text style={[s.titulo, { color: cores.textoPrincipal }]}>Pessoas</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14 }}>Hóspedes ou convidados</Text>
          </View>
          <TouchableOpacity disabled={filtros.pessoas <= 1} onPress={() => definir({ pessoas: filtros.pessoas - 1 })} style={[s.passo, { borderColor: cores.bordaMedia, opacity: filtros.pessoas <= 1 ? 0.4 : 1 }]} accessibilityLabel="Menos uma pessoa">
            <Ionicons name="remove" size={18} color={cores.textoPrincipal} />
          </TouchableOpacity>
          <Text style={[s.contador, { color: cores.textoPrincipal }]}>{filtros.pessoas}</Text>
          <TouchableOpacity onPress={() => definir({ pessoas: filtros.pessoas + 1 })} style={[s.passo, { borderColor: cores.bordaMedia }]} accessibilityLabel="Mais uma pessoa">
            <Ionicons name="add" size={18} color={cores.textoPrincipal} />
          </TouchableOpacity>
        </View>

        <Titulo direita={<Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 15 }}>
          {mt(filtros.precoMin || 0)} – {mt(filtros.precoMax)}{filtros.precoMax >= PRECO_MAX ? '+' : ''} MT
        </Text>}>Preço por dia</Titulo>
        <FaixaPrecoSlider
          min={PRECO_MIN}
          max={PRECO_MAX}
          valorMin={filtros.precoMin}
          valorMax={filtros.precoMax}
          precos={catalogo.map(a => a.preco)}
          onChange={(a, b) => definir({ precoMin: a, precoMax: b })}
        />

        <Titulo>Quartos</Titulo>
        <View style={s.linhaGrelha}>
          {[1, 2, 3, 4].map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => definir({ quartos: filtros.quartos === n ? 0 : n })}
              accessibilityState={{ selected: filtros.quartos === n }}
              style={[s.quarto, filtros.quartos === n
                ? { backgroundColor: cores.textoPrincipal, borderColor: cores.textoPrincipal }
                : { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}
            >
              <Text style={{ color: filtros.quartos === n ? cores.fundo : cores.textoPrincipal, fontFamily: Fonte.corpoSemi, fontSize: 16 }}>{n === 4 ? '4+' : n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Titulo>Tipo de aluguer</Titulo>
        <View style={s.linhaChips}>
          {ALUGUER.map(a => (
            <Chip key={a.id} escuro ativo={filtros.aluguer === a.id} texto={a.nome} onPress={() => definir({ aluguer: filtros.aluguer === a.id ? null : a.id })} />
          ))}
        </View>

        <Titulo direita={filtros.perto ? <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 15 }}>até <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoBold }}>{filtros.distanciaKm} km</Text></Text> : undefined}>Perto de</Titulo>
        <View style={s.linhaChips}>
          {PERTO.map(p => (
            <Chip key={p.id} escuro ativo={filtros.perto === p.id} texto={p.nome} onPress={() => definir({ perto: filtros.perto === p.id ? null : p.id })} />
          ))}
        </View>
        <View style={[s.linhaGrelha, { marginTop: 10 }]}>
          {DISTANCIAS.map(d => (
            <TouchableOpacity
              key={d}
              onPress={() => definir({ distanciaKm: d })}
              style={[s.distancia, { backgroundColor: filtros.distanciaKm === d ? cores.textoPrincipal : cores.fundoSuave }]}
              accessibilityState={{ selected: filtros.distanciaKm === d }}
            >
              <Text style={{ color: filtros.distanciaKm === d ? cores.fundo : cores.textoPrincipal, fontFamily: Fonte.corpoSemi, fontSize: 15 }}>{d} km</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.painel, { backgroundColor: cores.fundoSuave }]}>
          <View style={s.painelLinha}>
            <View style={{ flex: 1 }}>
              <Text style={[s.painelTitulo, { color: cores.textoPrincipal }]}>Só anúncios verificados</Text>
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>Identidade e propriedade confirmadas</Text>
            </View>
            <Switch value={filtros.verificados} onValueChange={v => definir({ verificados: v })} trackColor={{ true: cores.principal }} />
          </View>
          <View style={[s.div, { backgroundColor: cores.bordaSubtil, marginVertical: 12 }]} />
          <View style={s.painelLinha}>
            <View style={{ flex: 1 }}>
              <Text style={[s.painelTitulo, { color: cores.textoPrincipal }]}>Reserva instantânea</Text>
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>Sem esperar pela aprovação</Text>
            </View>
            <Switch value={filtros.instantanea} onValueChange={v => definir({ instantanea: v })} trackColor={{ true: cores.principal }} />
          </View>
        </View>

        <Titulo>Comodidades</Titulo>
        <View style={s.linhaChips}>
          {COMODIDADES.map(c => (
            <Chip key={c.id} ativo={filtros.comodidades.includes(c.id)} texto={c.nome} marca
              onPress={() => definir({ comodidades: alternar(filtros.comodidades, c.id) })} />
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[s.rodape, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={[s.botao, { backgroundColor: cores.principal }]}>
          <Text style={s.botaoTexto}>{total === 0 ? 'Sem espaços — ajustar filtros' : `Mostrar ${total} ${total === 1 ? 'espaço' : 'espaços'}`}</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <Modal visible={calendario} transparent animationType="slide" onRequestClose={() => setCalendario(false)}>
        <View style={s.overlay}>
          <View style={[s.folha, { backgroundColor: cores.fundoElevado }]}>
            <View style={s.folhaTopo}>
              <Text style={[s.titulo, { color: cores.textoPrincipal, flex: 1 }]}>Datas</Text>
              <TouchableOpacity onPress={() => setCalendario(false)} hitSlop={8} accessibilityLabel="Fechar">
                <Ionicons name="close" size={22} color={cores.textoPrincipal} />
              </TouchableOpacity>
            </View>
            <CalendarioReserva entrada={rascEntrada} saida={rascSaida} ocupadas={[]} onChange={(a, b) => { setRascEntrada(a); setRascSaida(b); }} />
            <View style={s.folhaAcoes}>
              <TouchableOpacity onPress={() => { definir({ entrada: null, saida: null }); setCalendario(false); }}>
                <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi, fontSize: 15, textDecorationLine: 'underline' }}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!rascEntrada || !rascSaida}
                onPress={() => { definir({ entrada: rascEntrada, saida: rascSaida }); setCalendario(false); }}
                style={[s.botaoPeq, { backgroundColor: cores.principal, opacity: rascEntrada && rascSaida ? 1 : 0.45 }]}
              >
                <Text style={{ color: Colors.branco, fontFamily: Fonte.corpoBold, fontSize: 15 }}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  fechar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topoTitulo: { fontFamily: Fonte.tituloBold, fontSize: 20 },
  limparTopo: { color: Colors.branco, fontFamily: Fonte.corpoSemi, fontSize: 14 },
  conteudo: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 18, height: 58 },
  campoInput: { flex: 1, fontFamily: Fonte.corpoMedio, fontSize: 18 },
  recentes: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  recente: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  tituloLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, marginBottom: 12 },
  titulo: { fontFamily: Fonte.tituloSemi, fontSize: 16 },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 18, height: 46, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipTexto: { fontSize: 14 },
  div: { height: 1, marginTop: 22 },
  linhaLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  passo: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  contador: { fontFamily: Fonte.tituloBold, fontSize: 20, minWidth: 28, textAlign: 'center' },
  linhaGrelha: { flexDirection: 'row', gap: 10 },
  quarto: { flex: 1, height: 52, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  distancia: { flex: 1, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  painel: { borderRadius: 20, padding: 18, marginTop: 26 },
  painelLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  painelTitulo: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  rodape: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  botao: { height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  botaoTexto: { color: Colors.branco, fontFamily: Fonte.corpoBold, fontSize: 18 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(32, 33, 36,0.48)' },
  folha: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 },
  folhaTopo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  folhaAcoes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  botaoPeq: { paddingHorizontal: 26, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
