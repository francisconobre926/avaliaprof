import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import TopBar from '../src/components/TopBar';
import { Avatar, Button, Input, useToast } from '../src/components/ui';
import { useCores } from '../src/store/themeStore';
import { useUserStore } from '../src/store/userStore';
import { validarNome, temErros } from '../src/utils/validacao';
import { mensagemErro } from '../src/utils/erros';
import { Typography, Spacing } from '../src/theme/typography';

export default function EditarPerfil() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const utilizador = useUserStore(s => s.utilizador);
  const atualizarPerfil = useUserStore(s => s.atualizarPerfil);
  const [nome, setNome] = useState(utilizador?.nome ?? '');
  const [foto, setFoto] = useState(utilizador?.foto ?? null);
  const [tentou, setTentou] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);

  if (!utilizador) return null;

  const docente = utilizador.papel === 'docente';
  const estudante = utilizador.papel === 'estudante';
  const erros = { nome: docente ? undefined : validarNome(nome) };

  const pedirDefinicoes = (recurso: string) =>
    Alert.alert(`Permissão da ${recurso} negada`, `Para usar a ${recurso} activa a permissão nas definições do telemóvel.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir definições', onPress: () => Linking.openSettings() },
    ]);

  const escolher = async (origem: 'galeria' | 'camara') => {
    const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 };
    const perm = origem === 'camara'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return pedirDefinicoes(origem === 'camara' ? 'câmara' : 'galeria');
    const r = origem === 'camara' ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (!r.canceled) setFoto(r.assets[0].uri);
  };

  const guardar = async () => {
    setTentou(true);
    if (temErros(erros)) return;
    setAGuardar(true);
    try {
      await atualizarPerfil(docente ? { foto } : { nome: nome.trim(), foto });
      toast.show({ tipo: 'success', titulo: 'Perfil actualizado' });
      router.back();
    } catch (e) {
      toast.show({ tipo: 'error', titulo: mensagemErro(e) });
      setAGuardar(false);
    }
  };

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Editar perfil" onVoltar={() => router.back()} />
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.foto}>
          <Avatar nome={nome || utilizador.nome} foto={foto ?? undefined} tamanho="xl" />
          <View style={styles.fotoAcoes}>
            <TouchableOpacity onPress={() => escolher('galeria')} accessibilityRole="button"><Text style={[Typography.bodyBold, { color: cores.principalTexto }]}>Galeria</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => escolher('camara')} accessibilityRole="button"><Text style={[Typography.bodyBold, { color: cores.principalTexto }]}>Câmara</Text></TouchableOpacity>
            {foto && <TouchableOpacity onPress={() => setFoto(null)} accessibilityRole="button"><Text style={[Typography.bodyBold, { color: cores.erro }]}>Remover</Text></TouchableOpacity>}
          </View>
        </View>

        {docente && (
          <Text style={[Typography.bodySmall, { color: cores.textoSecundario, textAlign: 'center' }]}>
            A fotografia é a que os estudantes veem no teu perfil de docente.
          </Text>
        )}
        <Input label="Nome completo" value={nome} onChangeText={setNome} autoCapitalize="words" error={tentou ? erros.nome : undefined} disabled={docente} hint={docente ? 'Definido pela administração.' : undefined} />
        <Input label="Email" value={utilizador.email} onChangeText={() => {}} disabled hint="Não pode ser alterado." />
        {estudante && <Input label="Número de estudante" value={utilizador.numeroEstudante} onChangeText={() => {}} disabled hint="Não pode ser alterado." />}
        {estudante && <Input label="Curso" value={utilizador.cursoNome ?? 'Sem curso'} onChangeText={() => {}} disabled hint="Definido pela administração (cadastro e matrícula)." />}
        <Button label="Guardar" onPress={guardar} loading={aGuardar} fullWidth />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { padding: Spacing.base, gap: Spacing.base },
  foto: { alignItems: 'center', gap: Spacing.md },
  fotoAcoes: { flexDirection: 'row', gap: Spacing.xl },
});
