import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthLayout, ErroFormulario } from '../../src/components/AuthLayout';
import { Button, Input } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { validarEmail, validarNumeroEstudante, validarSenha, temErros } from '../../src/utils/validacao';
import { mensagemErro } from '../../src/utils/erros';
import { Typography } from '../../src/theme/typography';

/**
 * Activação da conta de estudante. O registo livre está fechado: só consegue activar quem a administração
 * já cadastrou, com o mesmo email e número de estudante.
 */
export default function Registo() {
  const router = useRouter();
  const cores = useCores();
  const registar = useUserStore(s => s.registar);
  const [numero, setNumero] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [tentou, setTentou] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string>();

  const erros = {
    numero: validarNumeroEstudante(numero),
    email: validarEmail(email),
    senha: validarSenha(senha),
    confirmar: confirmar !== senha ? 'As senhas não coincidem.' : undefined,
  };
  const ver = (k: keyof typeof erros) => (tentou ? erros[k] : undefined);

  const submeter = async () => {
    setTentou(true);
    setErroGeral(undefined);
    if (temErros(erros)) return;
    setACarregar(true);
    try {
      await registar({ numeroEstudante: numero.trim(), email: email.trim(), senha });
    } catch (e) {
      setErroGeral(mensagemErro(e));
      setACarregar(false);
    }
  };

  return (
    <AuthLayout
      onVoltar={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
      titulo="Activar conta"
      subtitulo="A tua conta é criada pela administração da universidade. Usa o mesmo email e número de estudante do teu cadastro para definir a senha."
      rodape={
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} accessibilityRole="link">
          <Text style={[Typography.body, { color: cores.principalTexto, textAlign: 'center' }]}>Já activaste a conta? Entra</Text>
        </TouchableOpacity>
      }
    >
      <Input label="Número de estudante" type="number" value={numero} onChangeText={setNumero} error={ver('numero')} maxLength={10} />
      <Input label="Email" type="email" value={email} onChangeText={setEmail} autoCapitalize="none" error={ver('email')} />
      <Input label="Nova senha" type="password" value={senha} onChangeText={setSenha} error={ver('senha')} hint="Mínimo 8 caracteres, com letras e números." />
      <Input label="Confirmar senha" type="password" value={confirmar} onChangeText={setConfirmar} error={ver('confirmar')} />
      <ErroFormulario mensagem={erroGeral} />
      <Button label="Activar conta" onPress={submeter} loading={aCarregar} fullWidth />
    </AuthLayout>
  );
}
