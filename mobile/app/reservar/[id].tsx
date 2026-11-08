/**
 * Escolher datas e reservar — segundo o protótipo (página 5).
 * Calendário + resumo de preço (taxa 8%) + M-Pesa / e-Mola.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCores } from '../../src/store/themeStore';
import { Fonte } from '../../src/theme/fonts';
import { ANUNCIOS_MOCK } from '../../src/data/anuncios-mock';
import { obterAnuncioLocal } from '../../src/store/anunciosLocal';
import { useUserStore } from '../../src/store/userStore';
import { useReservasStore } from '../../src/store/reservasStore';
import TopBar from '../../src/components/TopBar';
import CalendarioReserva from '../../src/components/CalendarioReserva';
import {
  MetodoPagamento, calcularPreco, datasOcupadasMock, formatarDataCurta, formatarMT,
  noitesEntre, operadoraDoNumero, telefoneValido, TAXA_SERVICO,
} from '../../src/utils/reservas';
import { Colors } from '../../src/theme/colors';

export default function ReservarScreen() {
  const { id, entrada: entradaParam, saida: saidaParam, hospedes: hospedesParam } =
    useLocalSearchParams<{ id: string; entrada?: string; saida?: string; hospedes?: string }>();
  const anuncioId = Array.isArray(id) ? id[0] : String(id || '');
  const router = useRouter();
  const cores = useCores();
  const usuario = useUserStore(s => s.usuario);
  const criar = useReservasStore(s => s.criar);

  const [anuncio, setAnuncio] = useState<any | null | undefined>(undefined);
  const [entrada, setEntrada] = useState<string | null>(entradaParam ? String(entradaParam) : null);
  const [saida, setSaida] = useState<string | null>(saidaParam ? String(saidaParam) : null);
  const [hospedes, setHospedes] = useState(Number(hospedesParam) || 2);
  const [metodo, setMetodo] = useState<MetodoPagamento>('mpesa');
  const [telefone, setTelefone] = useState(usuario?.telefone?.replace(/^\+?258/, '') ?? '');
  const [aPagar, setAPagar] = useState(false);

  useEffect(() => {
    (async () => {
      const local = await obterAnuncioLocal(anuncioId);
      setAnuncio(local ?? ANUNCIOS_MOCK.find(a => a.id === anuncioId) ?? null);
    })();
  }, [anuncioId]);

  const ocupadas = useMemo(() => datasOcupadasMock(anuncioId), [anuncioId]);
  const noites = entrada && saida ? noitesEntre(entrada, saida) : 0;
  const preco = calcularPreco(Number(anuncio?.preco || 0), noites);
  const numeroOk = telefoneValido(telefone);
  const operadora = operadoraDoNumero(telefone);
  const operadoraErrada = numeroOk && operadora && operadora !== metodo;
  const podePagar = noites > 0 && numeroOk && !operadoraErrada && !aPagar;

  if (anuncio === undefined) {
    return <View style={[s.centro, { backgroundColor: cores.fundo }]}><ActivityIndicator color={cores.principal} /></View>;
  }
  if (!anuncio) {
    return (
      <View style={[s.centro, { backgroundColor: cores.fundo }]}>
        <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoSemi }}>Anúncio não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoSemi }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const local = [anuncio.bairro, anuncio.cidade].filter(Boolean).join(', ');
  const foto: string | undefined = anuncio.fotos?.[0] || anuncio.imagem;
  const unidade = ['salao', 'espaco_eventos', 'espaco_casamento', 'salao_festas'].includes(String(anuncio.categoria))
    ? 'dia' : 'noite';

  const confirmar = async () => {
    if (!entrada || !saida) return;
    setAPagar(true);
    // Simulação do pedido push M-Pesa / e-Mola (sem backend ainda).
    await new Promise(r => setTimeout(r, 1400));
    const reserva = await criar({
      anuncioId, titulo: anuncio.titulo, local, foto, entrada, saida, hospedes,
      noites, subtotal: preco.subtotal, taxa: preco.taxa, total: preco.total,
      metodo, telefone: telefone.replace(/\s/g, ''),
    });
    setAPagar(false);
    Alert.alert('Reserva confirmada', `Código ${reserva.codigo}. O valor fica retido pela plataforma até 24 h após o check-in.`);
    router.replace('/(procurador)/reservas' as any);
  };

  return (
    <View style={[s.flex, { backgroundColor: cores.fundoElevado }]}>
      <TopBar titulo="Escolher datas e reservar" onVoltar={() => router.back()} />

      <ScrollView style={{ backgroundColor: cores.fundo }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={s.resumoAnuncio}>
          {foto
            ? <Image source={{ uri: foto }} style={s.foto} />
            : <View style={[s.foto, { backgroundColor: cores.principalClara, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="home-outline" size={26} color={cores.principal} /></View>}
          <View style={{ flex: 1 }}>
            <Text style={[s.titulo, { color: cores.textoPrincipal }]} numberOfLines={2}>{anuncio.titulo}</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }} numberOfLines={1}>
              {local}{anuncio.anuncianteRating ? <> · <Ionicons name="star" size={12} color={cores.textoSecundario} /> {Number(anuncio.anuncianteRating).toFixed(1)}</> : null}
            </Text>
            <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoBold, fontSize: 14, marginTop: 2 }}>
              {formatarMT(Number(anuncio.preco || 0))} <Text style={{ fontFamily: Fonte.corpo, color: cores.textoSecundario }}>/{unidade}</Text>
            </Text>
          </View>
        </View>

        <View style={[s.datas, { borderColor: cores.bordaMedia, backgroundColor: cores.fundoElevado }]}>
          <View style={s.dataBox}>
            <Text style={[s.dataRotulo, { color: cores.textoTerciario }]}>ENTRADA</Text>
            <Text style={[s.dataValor, { color: entrada ? cores.textoPrincipal : cores.textoTerciario }]}>{entrada ? formatarDataCurta(entrada) : 'Escolher'}</Text>
          </View>
          <View style={[s.dataSep, { backgroundColor: cores.bordaMedia }]} />
          <View style={s.dataBox}>
            <Text style={[s.dataRotulo, { color: cores.textoTerciario }]}>SAÍDA</Text>
            <Text style={[s.dataValor, { color: saida ? cores.textoPrincipal : cores.textoTerciario }]}>{saida ? formatarDataCurta(saida) : 'Escolher'}</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <CalendarioReserva
            entrada={entrada}
            saida={saida}
            ocupadas={ocupadas}
            onChange={(a, b) => { setEntrada(a); setSaida(b); }}
            onConflito={() => Alert.alert('Datas indisponíveis', 'Há dias ocupados dentro do período escolhido. Escolha outro intervalo.')}
          />
        </View>

        <View style={[s.linhaHospedes, { borderColor: cores.bordaSubtil }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.rotulo, { color: cores.textoPrincipal }]}>Pessoas</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 12 }}>Hóspedes ou convidados</Text>
          </View>
          <Passo icone="remove" desativado={hospedes <= 1} onPress={() => setHospedes(h => Math.max(1, h - 1))} cores={cores} />
          <Text style={[s.contador, { color: cores.textoPrincipal }]}>{hospedes}</Text>
          <Passo icone="add" onPress={() => setHospedes(h => h + 1)} cores={cores} />
        </View>

        <View style={[s.cartao, { backgroundColor: cores.fundoSuave }]}>
          <Text style={[s.cartaoTitulo, { color: cores.textoPrincipal }]}>Resumo do preço</Text>
          {noites > 0 ? (
            <>
              <Linha a={`${formatarMT(preco.precoDia)} × ${noites} ${unidade}${noites > 1 ? 's' : ''}`} b={formatarMT(preco.subtotal)} cores={cores} />
              <Linha a={`Taxa de serviço (${Math.round(TAXA_SERVICO * 100)}%)`} b={formatarMT(preco.taxa)} cores={cores} />
              <View style={[s.div, { backgroundColor: cores.bordaSubtil }]} />
              <Linha a="Total" b={formatarMT(preco.total)} forte cores={cores} />
            </>
          ) : (
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13 }}>Escolha a entrada e a saída no calendário.</Text>
          )}
        </View>

        <Text style={[s.sec, { color: cores.textoPrincipal }]}>Pagar com</Text>
        <View style={s.metodos}>
          {(['mpesa', 'emola'] as const).map(m => {
            const ativo = metodo === m;
            return (
              <TouchableOpacity key={m} onPress={() => setMetodo(m)} activeOpacity={0.8}
                style={[s.metodo, { borderColor: ativo ? cores.principal : cores.bordaMedia, backgroundColor: ativo ? cores.principalClara : cores.fundoElevado }]}>
                <Text style={{ fontFamily: Fonte.corpoBold, fontSize: 15, color: ativo ? cores.principal : cores.textoPrincipal }}>{m === 'mpesa' ? 'M-Pesa' : 'e-Mola'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[s.rotuloPequeno, { color: cores.textoSecundario }]}>Número de telefone</Text>
        <TextInput
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          placeholder={metodo === 'mpesa' ? '84 123 4567' : '86 123 4567'}
          placeholderTextColor={cores.textoTerciario}
          style={[s.input, { borderColor: telefone && !numeroOk ? cores.erro : cores.bordaMedia, color: cores.textoPrincipal, backgroundColor: cores.fundoElevado }]}
        />
        {telefone.length > 0 && !numeroOk && <Text style={[s.erro, { color: cores.erro }]}>Número inválido. Use 9 dígitos, ex.: 84 123 4567.</Text>}
        {operadoraErrada && (
          <Text style={[s.erro, { color: cores.erro }]}>
            Este número é {operadora === 'mpesa' ? 'M-Pesa (84/85)' : 'e-Mola (86/87)'}. Altere o método de pagamento.
          </Text>
        )}

        <View style={s.aviso}>
          <Ionicons name="shield-checkmark-outline" size={16} color={cores.textoSecundario} />
          <Text style={{ flex: 1, color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 12, lineHeight: 17 }}>
            O valor fica retido pela plataforma até 24 h após o check-in. Cancelamento gratuito até 48 h antes.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[s.rodape, { backgroundColor: cores.fundoElevado, borderTopColor: cores.bordaSubtil }]}>
        <TouchableOpacity disabled={!podePagar} onPress={confirmar} activeOpacity={0.85}
          style={[s.botao, { backgroundColor: cores.principal, opacity: podePagar ? 1 : 0.45 }]}>
          {aPagar
            ? <><ActivityIndicator color={Colors.branco} /><Text style={s.botaoTexto}>A aguardar confirmação no telemóvel…</Text></>
            : <Text style={s.botaoTexto}>{noites > 0 ? `Confirmar e pagar ${formatarMT(preco.total)}` : 'Escolha as datas'}</Text>}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function Passo({ icone, onPress, desativado, cores }: { icone: 'add' | 'remove'; onPress: () => void; desativado?: boolean; cores: any }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={desativado} accessibilityLabel={icone === 'add' ? 'Mais uma pessoa' : 'Menos uma pessoa'}
      style={[s.passo, { borderColor: cores.bordaMedia, opacity: desativado ? 0.4 : 1 }]}>
      <Ionicons name={icone} size={18} color={cores.textoPrincipal} />
    </TouchableOpacity>
  );
}

function Linha({ a, b, forte, cores }: { a: string; b: string; forte?: boolean; cores: any }) {
  return (
    <View style={s.linha}>
      <Text style={{ color: forte ? cores.textoPrincipal : cores.textoSecundario, fontFamily: forte ? Fonte.corpoBold : Fonte.corpo, fontSize: forte ? 17 : 14 }}>{a}</Text>
      <Text style={{ color: cores.textoPrincipal, fontFamily: forte ? Fonte.corpoBold : Fonte.corpoMedio, fontSize: forte ? 17 : 14 }}>{b}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  voltar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  topoTitulo: { fontFamily: Fonte.tituloBold, fontSize: 18 },
  resumoAnuncio: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  foto: { width: 72, height: 72, borderRadius: 16 },
  titulo: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  datas: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, marginTop: 16 },
  dataBox: { flex: 1, padding: 14 },
  dataSep: { width: 1, marginVertical: 10 },
  dataRotulo: { fontFamily: Fonte.corpoSemi, fontSize: 12, letterSpacing: 0.6 },
  dataValor: { fontFamily: Fonte.corpoBold, fontSize: 16, marginTop: 2 },
  linhaHospedes: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, marginTop: 8, borderTopWidth: 1, borderBottomWidth: 1 },
  rotulo: { fontFamily: Fonte.corpoBold, fontSize: 15 },
  passo: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  contador: { fontFamily: Fonte.corpoBold, fontSize: 16, minWidth: 22, textAlign: 'center' },
  cartao: { borderRadius: 20, padding: 16, marginTop: 16, gap: 8 },
  cartaoTitulo: { fontFamily: Fonte.corpoBold, fontSize: 16, marginBottom: 2 },
  linha: { flexDirection: 'row', justifyContent: 'space-between' },
  div: { height: 1, marginVertical: 4 },
  sec: { fontFamily: Fonte.corpoBold, fontSize: 16, marginTop: 20, marginBottom: 10 },
  metodos: { flexDirection: 'row', gap: 10 },
  metodo: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  rotuloPequeno: { fontFamily: Fonte.corpo, fontSize: 12, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontFamily: Fonte.corpoMedio, fontSize: 16 },
  erro: { fontFamily: Fonte.corpo, fontSize: 12, marginTop: 6 },
  aviso: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-start' },
  rodape: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  botao: { flexDirection: 'row', gap: 10, borderRadius: 999, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  botaoTexto: { color: Colors.branco, fontFamily: Fonte.corpoBold, fontSize: 16 },
});
