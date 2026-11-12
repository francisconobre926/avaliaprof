/**
 * Peças partilhadas pelos ecrãs de perfil dos três papéis (estudante, docente, administrador):
 * cabeçalho com fotografia, grupos de opções em cartão e o bloco de sessão.
 */
import { ReactNode } from 'react';
import { Alert, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Avatar, Badge, useToast } from '../ui';
import { useCores } from '../../store/themeStore';
import { useUserStore } from '../../store/userStore';
import { mensagemErro } from '../../utils/erros';
import { Typography, Spacing, Radius } from '../../theme/typography';

type Icone = keyof typeof Ionicons.glyphMap;

const PAPEIS = { estudante: 'Estudante', docente: 'Docente', admin: 'Administrador' } as const;

/** Fotografia, nome, email e papel. Tocar na fotografia abre a edição do perfil. */
export function CabecalhoPerfil({ nome, foto, detalhes }: { nome?: string; foto?: string | null; detalhes?: string[] }) {
  const cores = useCores();
  const router = useRouter();
  const utilizador = useUserStore(s => s.utilizador);
  if (!utilizador) return null;
  const linhas = (detalhes ?? []).filter(Boolean);
  return (
    <View style={[styles.cartao, styles.cabecalho, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil }]}>
      <TouchableOpacity onPress={() => router.push('/editar-perfil')} accessibilityRole="button" accessibilityLabel="Editar perfil e fotografia" activeOpacity={0.8}>
        <Avatar nome={nome ?? utilizador.nome} foto={(foto ?? utilizador.foto) ?? undefined} tamanho="xl" />
        <View style={[styles.lapis, { backgroundColor: cores.principal, borderColor: cores.fundoElevado }]}>
          <Ionicons name="pencil" size={12} color={cores.textoSobrePrincipal} />
        </View>
      </TouchableOpacity>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={[Typography.h1, { color: cores.textoPrincipal, textAlign: 'center' }]} accessibilityRole="header">{nome ?? utilizador.nome}</Text>
        <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]} selectable>{utilizador.email}</Text>
        <Badge label={PAPEIS[utilizador.papel]} cor="azul" />
      </View>
      {linhas.length > 0 && (
        <View style={[styles.detalhes, { borderTopColor: cores.bordaSubtil }]}>
          {linhas.map(l => <Text key={l} style={[Typography.bodySmall, { color: cores.textoSecundario, textAlign: 'center' }]}>{l}</Text>)}
        </View>
      )}
    </View>
  );
}

/** Grupo de opções com título, dentro de um cartão. */
export function GrupoMenu({ titulo, children }: { titulo: string; children: ReactNode }) {
  const cores = useCores();
  return (
    <View style={{ gap: Spacing.sm }}>
      <Text style={[Typography.captionBold, { color: cores.textoTerciario, marginLeft: Spacing.xs }]} accessibilityRole="header">{titulo}</Text>
      <View style={[styles.cartao, { backgroundColor: cores.fundoElevado, borderColor: cores.bordaSubtil, paddingVertical: 0 }]}>{children}</View>
    </View>
  );
}

interface LinhaMenuProps {
  icone: Icone;
  rotulo: string;
  /** Texto à direita (ex.: contagem) ou descrição por baixo. */
  valor?: string;
  descricao?: string;
  onPress?: () => void;
  perigo?: boolean;
  ultima?: boolean;
  direita?: ReactNode;
}

/** Linha de menu com ícone, alvo de toque de 56 dp e seta quando navega. */
export function LinhaMenu({ icone, rotulo, valor, descricao, onPress, perigo, ultima, direita }: LinhaMenuProps) {
  const cores = useCores();
  const cor = perigo ? cores.erro : cores.textoPrincipal;
  const conteudo = (
    <>
      <View style={[styles.icone, { backgroundColor: cores.fundoSuave }]}>
        <Ionicons name={icone} size={18} color={perigo ? cores.erro : cores.principalTexto} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.body, { color: cor }]}>{rotulo}</Text>
        {descricao && <Text style={[Typography.caption, { color: cores.textoTerciario }]}>{descricao}</Text>}
      </View>
      {valor && <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>{valor}</Text>}
      {direita}
      {onPress && !direita && <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />}
    </>
  );
  const estilo = [styles.linha, !ultima && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.bordaSubtil }];
  return onPress ? (
    <TouchableOpacity style={estilo} onPress={onPress} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={valor ? `${rotulo}, ${valor}` : rotulo} accessibilityHint={descricao}>
      {conteudo}
    </TouchableOpacity>
  ) : (
    <View style={estilo} accessible accessibilityLabel={valor ? `${rotulo}, ${valor}` : rotulo}>{conteudo}</View>
  );
}

/** Conta: editar perfil e alterar senha (iguais nos três papéis). */
export function GrupoConta({ children }: { children?: ReactNode }) {
  const router = useRouter();
  return (
    <GrupoMenu titulo="Conta">
      <LinhaMenu icone="person-outline" rotulo="Editar perfil" descricao="Nome e fotografia" onPress={() => router.push('/editar-perfil')} />
      <LinhaMenu icone="key-outline" rotulo="Alterar senha" onPress={() => router.push('/alterar-senha')} ultima={!children} />
      {children}
    </GrupoMenu>
  );
}

/**
 * Sessão: terminar neste dispositivo (com confirmação e aviso se houver avaliações por enviar)
 * ou em todos os dispositivos. Por baixo, a versão da app.
 */
export function GrupoSessao({ porEnviar = 0 }: { porEnviar?: number }) {
  const cores = useCores();
  const toast = useToast();
  const sair = useUserStore(s => s.sair);
  const sairDeTodos = useUserStore(s => s.sairDeTodos);

  const confirmarSair = () =>
    Alert.alert(
      'Terminar sessão',
      porEnviar > 0
        ? `Tens ${porEnviar} avaliação(ões) por enviar. Ficam guardadas neste telemóvel e são enviadas quando voltares a entrar com esta conta.`
        : 'Queres mesmo terminar a sessão neste dispositivo?',
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Terminar sessão', style: 'destructive', onPress: () => { void sair(); } }],
    );

  const confirmarTodos = () =>
    Alert.alert('Terminar em todos os dispositivos', 'A sessão é terminada aqui e em qualquer outro telemóvel onde tenhas entrado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Terminar em todos', style: 'destructive',
        onPress: async () => { try { await sairDeTodos(); } catch (e) { toast.show({ tipo: 'error', titulo: mensagemErro(e) }); } },
      },
    ]);

  return (
    <View style={{ gap: Spacing.md }}>
      <GrupoMenu titulo="Sessão">
        <LinhaMenu icone="log-out-outline" rotulo="Terminar sessão" onPress={confirmarSair} perigo />
        <LinhaMenu icone="phone-portrait-outline" rotulo="Terminar em todos os dispositivos" onPress={confirmarTodos} perigo ultima />
      </GrupoMenu>
      <Text style={[Typography.caption, { color: cores.textoTerciario, textAlign: 'center' }]}>
        AvaliaProf · versão {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base },
  cabecalho: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  lapis: { position: 'absolute', right: 0, bottom: 0, width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  detalhes: { alignSelf: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.md, gap: 2 },
  linha: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  icone: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
