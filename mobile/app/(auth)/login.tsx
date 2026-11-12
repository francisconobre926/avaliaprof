import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthLayout, ErroFormulario } from '../../src/components/AuthLayout';
import { Button, Input } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { validarEmail, validarObrigatorio, temErros } from '../../src/utils/validacao';
import { mensagemErro } from '../../src/utils/erros';
import { Typography, Spacing, Radius } from '../../src/theme/typography';

/** Só o email fica guardado para a próxima vez; a senha nunca. */
const CHAVE_EMAIL = '@avaliaprof_ultimo_email';

type Icone = keyof typeof Ionicons.glyphMap;

export default function Login() {
  const router = useRouter();
  const cores = useCores();
  const entrar = useUserStore(s => s.entrar);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tentou, setTentou] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string>();

  useEffect(() => { AsyncStorage.getItem(CHAVE_EMAIL).then(v => { if (v) setEmail(e => e || v); }).catch(() => {}); }, []);

  const erros = { email: validarEmail(email), senha: validarObrigatorio(senha, 'Indica a senha.') };

  const submeter = async () => {
    if (aCarregar) return;
    setTentou(true);
    setErroGeral(undefined);
    if (temErros(erros)) return;
    setACarregar(true);
    try {
      const limpo = email.trim().toLowerCase();
      await entrar(limpo, senha);
      AsyncStorage.setItem(CHAVE_EMAIL, limpo).catch(() => {});
    } catch (e) {
      setErroGeral(mensagemErro(e));
      setSenha('');
      setTentou(false);
      setACarregar(false);
    }
  };

  const Acesso = ({ icone, titulo, descricao, onPress }: { icone: Icone; titulo: string; descricao: string; onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${titulo}. ${descricao}`}
      style={[styles.acesso, { borderColor: cores.bordaSubtil, backgroundColor: cores.fundoElevado }]}
    >
      <View style={[styles.acessoIcone, { backgroundColor: cores.fundoSuave }]}><Ionicons name={icone} size={20} color={cores.principalTexto} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[Typography.bodyBold, { color: cores.textoPrincipal }]}>{titulo}</Text>
        <Text style={[Typography.caption, { color: cores.textoSecundario }]}>{descricao}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={cores.textoTerciario} />
    </TouchableOpacity>
  );

  return (
    <AuthLayout
      destaque
      titulo="Entrar"
      subtitulo="Estudantes, docentes e administração entram aqui com o email institucional."
      rodape={
        <View style={{ gap: Spacing.sm }}>
          <Text style={[Typography.captionBold, { color: cores.textoTerciario, textAlign: 'center' }]}>Primeiro acesso</Text>
          <Acesso icone="school-outline" titulo="Sou estudante" descricao="Activar a conta com o email e o número de estudante" onPress={() => router.push('/(auth)/registo')} />
          <Acesso icone="mail-open-outline" titulo="Sou docente" descricao="Activar a conta com o código de convite" onPress={() => router.push('/(auth)/activar-docente')} />
        </View>
      }
    >
      <Input
        label="Email" type="email" value={email} onChangeText={setEmail} iconLeft="mail-outline" placeholder="nome@universidade.ac.mz"
        autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" returnKeyType="next"
        error={tentou ? erros.email : undefined}
      />
      <Input
        label="Senha" type="password" value={senha} onChangeText={setSenha} iconLeft="lock-closed-outline"
        autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submeter}
        error={tentou ? erros.senha : undefined}
      />
      <TouchableOpacity onPress={() => router.push('/(auth)/recuperar')} style={styles.esqueci} accessibilityRole="link" hitSlop={8}>
        <Text style={[Typography.bodySmall, { color: cores.principalTexto }]}>Esqueci-me da senha</Text>
      </TouchableOpacity>
      <ErroFormulario mensagem={erroGeral} />
      <Button label="Entrar" onPress={submeter} loading={aCarregar} fullWidth size="lg" />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  esqueci: { alignSelf: 'flex-end', marginTop: -Spacing.xs },
  acesso: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, minHeight: 60 },
  acessoIcone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
