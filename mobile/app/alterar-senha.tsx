import { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '../src/components/TopBar';
import { Button, Input, useToast } from '../src/components/ui';
import { useCores } from '../src/store/themeStore';
import { authService } from '../service/authService';
import { validarObrigatorio, validarSenha, temErros } from '../src/utils/validacao';
import { mensagemErro } from '../src/utils/erros';
import { Typography, Spacing } from '../src/theme/typography';

/** Alterar a senha: pede a actual; ao mudar, as sessões noutros dispositivos terminam. */
export default function AlterarSenha() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [tentou, setTentou] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string>();

  const erros = {
    atual: validarObrigatorio(atual, 'Indica a senha actual.'),
    nova: validarSenha(nova) ?? (nova && nova === atual ? 'A nova senha tem de ser diferente da actual.' : undefined),
    repetir: repetir !== nova ? 'As senhas não coincidem.' : undefined,
  };

  const guardar = async () => {
    setTentou(true);
    setErro(undefined);
    if (temErros(erros)) return;
    setAGuardar(true);
    try {
      await authService.alterarSenha(atual, nova);
      toast.show({ tipo: 'success', titulo: 'Senha alterada', descricao: 'As sessões noutros dispositivos foram terminadas.' });
      router.back();
    } catch (e) {
      setErro(mensagemErro(e));
      setAGuardar(false);
    }
  };

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Alterar senha" onVoltar={() => router.back()} />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={[Typography.bodySmall, { color: cores.textoSecundario }]}>
          Por segurança, ao mudares a senha a sessão é terminada nos outros dispositivos onde tenhas entrado.
        </Text>
        <Input label="Senha actual" type="password" value={atual} onChangeText={setAtual} error={tentou ? erros.atual : undefined} autoComplete="current-password" />
        <Input label="Nova senha" type="password" value={nova} onChangeText={setNova} error={tentou ? erros.nova : undefined} hint="Mínimo 8 caracteres, com letras e números." autoComplete="new-password" />
        <Input label="Repetir a nova senha" type="password" value={repetir} onChangeText={setRepetir} error={tentou ? erros.repetir : undefined} autoComplete="new-password" />
        {erro && <Text style={[Typography.bodySmall, { color: cores.erro }]} accessibilityRole="alert">{erro}</Text>}
        <Button label="Guardar nova senha" onPress={guardar} loading={aGuardar} fullWidth />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.base },
});
