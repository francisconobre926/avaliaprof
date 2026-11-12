import { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthLayout, ErroFormulario } from '../../src/components/AuthLayout';
import { Button, Input } from '../../src/components/ui';
import { useCores } from '../../src/store/themeStore';
import { useUserStore } from '../../src/store/userStore';
import { validarEmail, validarSenha, temErros } from '../../src/utils/validacao';
import { mensagemErro } from '../../src/utils/erros';
import { Typography } from '../../src/theme/typography';

/** Activação da conta de docente com o código de convite (8 caracteres) entregue pela administração. */
export default function ActivarDocente() {
  const router = useRouter();
  const cores = useCores();
  const activar = useUserStore(s => s.activarDocente);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [tentou, setTentou] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [erroGeral, setErroGeral] = useState<string>();

  const erros = {
    email: validarEmail(email),
    codigo: /^[A-Z0-9]{8}$/.test(codigo) ? undefined : 'O código de convite tem 8 caracteres (letras e números).',
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
      await activar({ email: email.trim(), codigo, senha });
    } catch (e) {
      setErroGeral(mensagemErro(e));
      setACarregar(false);
    }
  };

  return (
    <AuthLayout
      onVoltar={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
      titulo="Activar conta de docente"
      subtitulo="Usa o email e o código de convite que a administração te entregou. O código é válido durante 7 dias e só pode ser usado uma vez."
      rodape={
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} accessibilityRole="link">
          <Text style={[Typography.body, { color: cores.principalTexto, textAlign: 'center' }]}>Voltar a entrar</Text>
        </TouchableOpacity>
      }
    >
      <Input label="Email" type="email" value={email} onChangeText={setEmail} autoCapitalize="none" error={ver('email')} />
      <Input label="Código de convite" value={codigo} onChangeText={t => setCodigo(t.toUpperCase().replace(/[^A-Z0-9]/g, ''))} autoCapitalize="characters" maxLength={8} error={ver('codigo')} />
      <Input label="Nova senha" type="password" value={senha} onChangeText={setSenha} error={ver('senha')} hint="Mínimo 8 caracteres, com letras e números." />
      <Input label="Confirmar senha" type="password" value={confirmar} onChangeText={setConfirmar} error={ver('confirmar')} />
      <ErroFormulario mensagem={erroGeral} />
      <Button label="Activar conta" onPress={submeter} loading={aCarregar} fullWidth />
    </AuthLayout>
  );
}
