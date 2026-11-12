import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthLayout, ErroFormulario } from '../../src/components/AuthLayout';
import { Button, Input, useToast } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { authService } from '../../service/authService';
import { validarEmail, validarSenha, validarObrigatorio, temErros } from '../../src/utils/validacao';
import { mensagemErro } from '../../src/utils/erros';
import { Typography } from '../../src/theme/typography';

export default function Recuperar() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [passo, setPasso] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [tentou, setTentou] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string>();

  const erros1 = { email: validarEmail(email) };
  const erros2 = { codigo: validarObrigatorio(codigo, 'Indica o código.'), senha: validarSenha(senha) };

  const executar = async (acao: () => Promise<void>) => {
    setACarregar(true);
    setErroGeral(undefined);
    try { await acao(); } catch (e) { setErroGeral(mensagemErro(e)); } finally { setACarregar(false); }
  };

  const pedir = () => {
    setTentou(true);
    if (temErros(erros1)) return;
    executar(async () => {
      await authService.pedirCodigoRecuperacao(email);
      setTentou(false);
      setPasso(2);
    });
  };

  const redefinir = () => {
    setTentou(true);
    if (temErros(erros2)) return;
    executar(async () => {
      await authService.redefinirSenha(email, codigo, senha);
      toast.show({ tipo: 'success', titulo: 'Senha alterada. Já podes entrar.' });
      router.replace('/(auth)/login');
    });
  };

  return (
    <AuthLayout
      onVoltar={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
      titulo="Recuperar senha"
      subtitulo={passo === 1 ? 'Indica o email da tua conta.' : 'Introduz o código recebido e a nova senha.'}
    >
      {passo === 1 ? (
        <>
          <Input label="Email" type="email" value={email} onChangeText={setEmail} autoCapitalize="none" error={tentou ? erros1.email : undefined} />
          <Button label="Enviar código" onPress={pedir} loading={aCarregar} fullWidth />
        </>
      ) : (
        <>
          <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
            Se existir uma conta com este email, foi gerado um código válido durante 15 minutos.
          </Text>
          <Input label="Código" type="number" value={codigo} onChangeText={setCodigo} error={tentou ? erros2.codigo : undefined} />
          <Input label="Nova senha" type="password" value={senha} onChangeText={setSenha} error={tentou ? erros2.senha : undefined} />
          <Button label="Alterar senha" onPress={redefinir} loading={aCarregar} fullWidth />
        </>
      )}
      <ErroFormulario mensagem={erroGeral} />
      <Button label="Voltar" variant="ghost" onPress={() => router.back()} fullWidth />
    </AuthLayout>
  );
}
