/**
 * Perfil do procurador (protótipo, página 8).
 * Cabeçalho, alternador Cliente/Anfitrião, reservas ativas, salvos,
 * convite para ser anfitrião e lista de definições.
 */
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import TopBar from '../../src/components/TopBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/userStore';
import { useCores } from '../../src/store/themeStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useReferralStore } from '../../src/store/referralStore';
import { useReservasStore } from '../../src/store/reservasStore';
import { useFavoritosStore } from '../../src/store/favoritosStore';
import { Anuncio } from '../../src/types';
import { carregarCatalogo } from '../../src/data/catalogo';
import { formatarIntervalo, formatarMT } from '../../src/utils/reservas';
import { Fonte } from '../../src/theme/fonts';
import { Typography } from '../../src/theme/typography';
import { Colors } from '../../src/theme/colors';


export default function PerfilProcurador() {
  const router = useRouter();
  const cores = useCores();

  const usuario = useUserStore(st => st.usuario);
  const escolherPapel = useUserStore(st => st.escolherPapel);
  const carteiraStore = useWalletStore(st => st.carteira);
  const { reservas, carregado: reservasCarregadas, carregar: carregarReservas } = useReservasStore();
  const { ids: salvosIds, carregar: carregarFavoritos } = useFavoritosStore();
  const [catalogo, setCatalogo] = useState<Anuncio[]>([]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregarFavoritos();
      if (!reservasCarregadas) carregarReservas();
      carregarCatalogo().then(l => { if (ativo) setCatalogo(l); });
      return () => { ativo = false; };
    }, [carregarFavoritos, carregarReservas, reservasCarregadas]),
  );

  const nome = usuario?.nome?.trim() || 'Convidado';
  const iniciais = usuario?.nome?.trim()
    ? usuario.nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toLocaleUpperCase('pt-MZ')
    : '?';

  const camposPerfil = [usuario?.nome?.trim(), usuario?.email?.trim(), usuario?.telefone?.trim(), usuario?.foto];
  const perfilCompleto = Math.round((camposPerfil.filter(Boolean).length / camposPerfil.length) * 100);

  const carteira = carteiraStore ?? { saldoDisponivel: 0, saldoCreditos: 0, saldoPendente: 0 };
  const saldoTotal = (Number(carteira.saldoDisponivel) || 0) + (Number(carteira.saldoCreditos) || 0);

  const referralState = useReferralStore() as any;
  const totalConvidados = typeof referralState.getTotalConvidados === 'function'
    ? Number(referralState.getTotalConvidados()) || 0 : 0;

  const hoje = new Date().toISOString().slice(0, 10);
  const ativas = reservas
    .filter(r => (r.estado === 'confirmada' || r.estado === 'pendente') && r.saida >= hoje)
    .slice(0, 3);

  const salvos = salvosIds.map(id => catalogo.find(a => a.id === id)).filter(Boolean) as Anuncio[];
  const miniaturas = salvos.slice(0, 3);
  const restantes = Math.max(0, salvosIds.length - miniaturas.length);

  const passarParaAnfitriao = async () => {
    if (!usuario) {
      // Sem conta: criar conta/entrar já como anunciante.
      router.push({ pathname: '/auth', params: { papel: 'anunciante' } } as any);
      return;
    }
    await escolherPapel('anunciante');
    router.replace('/(anunciante)' as any);
  };

  const sair = useUserStore(st => st.sair);
  const terminarSessao = () => {
    Alert.alert('Terminar sessão', 'Quer mesmo sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await sair(); router.replace('/(procurador)' as any); } },
    ]);
  };

  const confirmarResetDev = () => {
    Alert.alert(
      '🧪 Reset total da app',
      'Isto apaga TUDO: língua escolhida, onboarding, utilizador, carteira, anúncios locais, referências. A app vai começar do zero no ecrã de escolha de língua.\n\nContinuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, apagar tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('✅ App limpa', 'Fecha e reabre a app (ou abana o telemóvel → Reload no menu Dev do Expo).', [{ text: 'OK' }]);
            } catch {
              Alert.alert('Erro', 'Não foi possível limpar o storage.');
            }
          },
        },
      ],
    );
  };

  const estadoCor = (e: string) => (e === 'confirmada' ? cores.sucesso : cores.aviso);

  const Linha = ({ titulo, descricao, onPress, ultimo, cor }: { titulo: string; descricao?: string; onPress?: () => void; ultimo?: boolean; cor?: string }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole="button"
      style={[s.menuLinha, !ultimo && { borderBottomColor: cores.bordaSubtil, borderBottomWidth: 1 }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[s.menuTitulo, { color: cor || cores.textoPrincipal }]}>{titulo}</Text>
        {!!descricao && <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 13, marginTop: 2 }}>{descricao}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
    </TouchableOpacity>
  );

  return (
    <View style={[s.flex, { backgroundColor: cores.fundo }]}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.conteudo}>
        {/* ============ CABEÇALHO ============ */}
        <View style={s.cabecalho}>
          {usuario?.foto
            ? <Image source={{ uri: usuario.foto }} style={s.avatar} />
            : <View style={[s.avatar, { backgroundColor: cores.principal }]}><Text style={s.avatarTexto}>{iniciais}</Text></View>}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/editar-perfil')} accessibilityLabel="Ver e editar perfil">
            <Text style={[s.nome, { color: cores.textoPrincipal }]} numberOfLines={1}>{nome}</Text>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 15 }}>Ver e editar perfil ›</Text>
          </TouchableOpacity>
          {usuario && (
            <View style={[s.pilula, { backgroundColor: perfilCompleto === 100 ? cores.principalClara : cores.aviso + '24' }]}>
              <Text style={[s.pilulaTexto, { color: perfilCompleto === 100 ? cores.principal : cores.aviso }]}>
                {perfilCompleto === 100 ? <><Ionicons name="checkmark" size={13} color={cores.principalTexto} /> Verificada</> : `Perfil ${perfilCompleto}%`}
              </Text>
            </View>
          )}
        </View>

        {/* ============ CLIENTE / ANFITRIÃO ============ */}
        <View style={[s.alternador, { backgroundColor: cores.fundoSuave }]} accessibilityRole="tablist">
          <View style={[s.alternadorItem, { backgroundColor: cores.fundoElevado }]} accessibilityState={{ selected: true }}>
            <Text style={[s.alternadorTexto, { color: cores.textoPrincipal, fontFamily: Fonte.corpoBold }]}>Cliente</Text>
          </View>
          <TouchableOpacity style={s.alternadorItem} onPress={passarParaAnfitriao} accessibilityRole="tab" accessibilityState={{ selected: false }}>
            <Text style={[s.alternadorTexto, { color: cores.textoSecundario }]}>Anfitrião</Text>
          </TouchableOpacity>
        </View>

        {/* ============ RESERVAS ATIVAS ============ */}
        <Text style={[s.secao, { color: cores.textoPrincipal }]}>Reservas ativas</Text>
        {ativas.length > 0 ? ativas.map(r => (
          <TouchableOpacity
            key={r.id}
            activeOpacity={0.85}
            onPress={() => router.push('/(procurador)/reservas' as any)}
            style={[s.reserva, { backgroundColor: cores.fundoSuave }]}
          >
            <View style={[s.reservaBarra, { backgroundColor: estadoCor(r.estado) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.reservaTitulo, { color: cores.textoPrincipal }]} numberOfLines={1}>{r.titulo}</Text>
              <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 14 }}>
                {formatarIntervalo(r.entrada, r.saida)} · {r.codigo}
              </Text>
            </View>
            <View style={[s.pilula, { backgroundColor: estadoCor(r.estado) + '22' }]}>
              <Text style={[s.pilulaTexto, { color: estadoCor(r.estado) }]}>{r.estado === 'confirmada' ? 'Confirmada' : 'Pendente'}</Text>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={[s.reserva, { backgroundColor: cores.fundoSuave }]}>
            <Text style={{ color: cores.textoSecundario, fontFamily: Fonte.corpo, fontSize: 15, flex: 1 }}>
              Ainda não tem reservas ativas. Explore casas e salões para reservar.
            </Text>
          </View>
        )}

        {/* ============ SALVOS ============ */}
        <View style={s.salvosCabecalho}>
          <Text style={[s.secao, { color: cores.textoPrincipal, marginTop: 0 }]}>Salvos ({salvosIds.length})</Text>
          {salvosIds.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(procurador)/favoritos' as any)}>
              <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoBold, fontSize: 15 }}>Ver tudo</Text>
            </TouchableOpacity>
          )}
        </View>
        {salvosIds.length > 0 && (
          <View style={s.salvosLinha}>
            {miniaturas.map((a, i) => {
              const foto = a.fotos?.[0] || a.imagem;
              return (
                <TouchableOpacity key={a.id} style={[s.salvo, { backgroundColor: [cores.principalClara, cores.fundoSuave, cores.aviso + '24'][i % 3] }]} onPress={() => router.push(`/anuncio/${a.id}` as any)} accessibilityLabel={a.titulo}>
                  {foto ? <Image source={{ uri: foto }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                </TouchableOpacity>
              );
            })}
            {restantes > 0 && (
              <TouchableOpacity style={[s.salvo, { backgroundColor: cores.sucesso + '22', alignItems: 'center', justifyContent: 'center' }]} onPress={() => router.push('/(procurador)/favoritos' as any)}>
                <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoBold, fontSize: 18 }}>+{restantes}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ============ SER ANFITRIÃO ============ */}
        <View style={[s.convite, { backgroundColor: cores.textoPrincipal }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.conviteTitulo, { color: cores.fundo }]}>Tem uma casa ou salão?</Text>
            <Text style={{ color: cores.fundo, opacity: 0.7, fontFamily: Fonte.corpo, fontSize: 14, marginTop: 2 }}>Anuncie e receba por M-Pesa ou e-Mola.</Text>
          </View>
          <TouchableOpacity onPress={passarParaAnfitriao} style={[s.conviteBotao, { backgroundColor: cores.fundo }]} accessibilityRole="button">
            <Text style={{ color: cores.textoPrincipal, fontFamily: Fonte.corpoBold, fontSize: 15 }}>Ser anfitrião</Text>
          </TouchableOpacity>
        </View>

        {/* ============ DEFINIÇÕES ============ */}
        <View style={[s.menu, { backgroundColor: cores.fundoSuave }]}>
          <Linha titulo="Informações pessoais" descricao="Nome, email, telefone" onPress={() => router.push('/editar-perfil')} />
          <Linha titulo="Pagamentos (M-Pesa / e-Mola)" descricao={`Carteira ${formatarMT(saldoTotal)}`} onPress={() => router.push('/carteira' as any)} />
          <Linha titulo="Notificações" onPress={() => router.push('/avisos' as any)} />
          <Linha titulo="Programa de referência" descricao={totalConvidados > 0 ? `${totalConvidados} convidado${totalConvidados === 1 ? '' : 's'}` : 'Ganha 10% com indicados'} onPress={() => router.push('/referencia' as any)} />
          <Linha titulo="Aparência" descricao="Tema e cores da app" onPress={() => router.push('/aparencia')} />
          <Linha titulo="Privacidade e segurança" descricao="Password" onPress={() => router.push('/auth/nova-password')} />
          <Linha titulo="Ajuda e termos" ultimo />
        </View>

        {usuario ? (
          <TouchableOpacity style={s.trocar} onPress={terminarSessao} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color={cores.erro} />
            <Text style={{ color: cores.erro, fontFamily: Fonte.corpoBold, fontSize: 16 }}>Terminar sessão</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.trocar} onPress={() => router.push('/auth' as any)} accessibilityRole="button">
            <Ionicons name="log-in-outline" size={20} color={cores.principalTexto} />
            <Text style={{ color: cores.principalTexto, fontFamily: Fonte.corpoBold, fontSize: 16 }}>Entrar ou criar conta</Text>
          </TouchableOpacity>
        )}

        {/* Só visível em desenvolvimento */}
        {__DEV__ && (
          <TouchableOpacity style={[s.trocar, { backgroundColor: cores.erro, borderRadius: 14, marginTop: 4 }]} onPress={confirmarResetDev}>
            <Ionicons name="refresh-circle" size={20} color={Colors.branco} />
            <Text style={{ color: Colors.branco, fontFamily: Fonte.corpoBold, fontSize: 15 }}>🧪 DEV — Reset total da app</Text>
          </TouchableOpacity>
        )}

        <Text style={[s.versao, { color: cores.textoTerciario }]}>GoHome v1.2 · Let's Go Tech</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { color: Colors.branco, fontFamily: Fonte.tituloBold, fontSize: 24 },
  nome: { ...Typography.tituloSecao, fontFamily: Fonte.tituloBold, fontSize: 22 },
  pilula: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pilulaTexto: { fontFamily: Fonte.corpoSemi, fontSize: 12 },
  alternador: { flexDirection: 'row', borderRadius: 18, padding: 5, marginTop: 20 },
  alternadorItem: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  alternadorTexto: { fontFamily: Fonte.corpoSemi, fontSize: 16 },
  secao: { ...Typography.tituloSecao, marginTop: 28, marginBottom: 12 },
  reserva: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20, paddingVertical: 16, paddingRight: 16, paddingLeft: 14, marginBottom: 10 },
  reservaBarra: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  reservaTitulo: { fontFamily: Fonte.corpoBold, fontSize: 16 },
  salvosCabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 12 },
  salvosLinha: { flexDirection: 'row', gap: 10 },
  salvo: { flex: 1, aspectRatio: 1.15, borderRadius: 18, overflow: 'hidden' },
  convite: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, padding: 18, marginTop: 28 },
  conviteTitulo: { fontFamily: Fonte.tituloSemi, fontSize: 18 },
  conviteBotao: { paddingHorizontal: 18, height: 46, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  menu: { borderRadius: 22, marginTop: 20, paddingHorizontal: 18 },
  menuLinha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18 },
  menuTitulo: { fontFamily: Fonte.corpoSemi, fontSize: 16 },
  trocar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 12 },
  versao: { textAlign: 'center', fontFamily: Fonte.corpo, fontSize: 12, marginTop: 16 },
});
