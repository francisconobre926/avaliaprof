import { useRef, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import TopBar from '../src/components/TopBar';
import { Button, EmptyState, useToast } from '../src/components/ui';
import { useCores } from '../src/store/themeStore';
import { interpretarQr } from '../service/qrService';
import { Typography, Spacing, Radius } from '../src/theme/typography';

/** Leitor de QR Code do docente ou da sessão. A leitura só abre o ecrã de resultado; o servidor valida tudo. */
export default function LerQr() {
  const router = useRouter();
  const cores = useCores();
  const toast = useToast();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [lanterna, setLanterna] = useState(false);
  const ultimo = useRef<{ valor: string; em: number }>({ valor: '', em: 0 });
  const aAbrir = useRef(false);

  /** QR enviado pelo docente (imagem): lê-se da galeria. Não precisa de câmara e passa pelas mesmas validações do servidor. */
  const carregarImagem = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (r.canceled || !r.assets[0]) return;
      const lidos = await Camera.scanFromURLAsync(r.assets[0].uri, ['qr']);
      if (!lidos.length) { toast.show({ tipo: 'error', titulo: 'Não encontrámos nenhum QR Code nesta imagem.' }); return; }
      aoLer({ data: lidos[0].data });
    } catch {
      toast.show({ tipo: 'error', titulo: 'Não foi possível ler a imagem.' });
    }
  };

  const aoLer = ({ data }: { data: string }) => {
    if (aAbrir.current) return;
    const agora = Date.now();
    if (data === ultimo.current.valor && agora - ultimo.current.em < 3000) return; // debounce do mesmo código
    ultimo.current = { valor: data, em: agora };
    const alvo = interpretarQr(data);
    if (!alvo) { toast.show({ tipo: 'error', titulo: 'Este QR Code não é da AvaliaProf.' }); return; }
    aAbrir.current = true;
    if (alvo.tipo === 'professor') router.replace({ pathname: '/qr/professor/[codigo]', params: { codigo: alvo.valor } });
    else router.replace({ pathname: '/qr/sessao/[token]', params: { token: alvo.valor } });
  };

  return (
    <View style={[styles.raiz, { backgroundColor: cores.fundo }]}>
      <TopBar titulo="Ler QR Code" />
      {!permissao ? (
        <View style={styles.centro} />
      ) : !permissao.granted ? (
        <View style={{ flex: 1 }}>
        <EmptyState
          icon="camera-outline"
          titulo="Precisamos da câmara"
          descricao={permissao.canAskAgain
            ? 'Para ler o QR Code do docente ou da aula, permite o acesso à câmara.'
            : 'O acesso à câmara foi recusado. Activa-o nas definições do telemóvel para ler QR Codes.'}
          ctaLabel={permissao.canAskAgain ? 'Permitir câmara' : undefined}
          onCtaPress={permissao.canAskAgain ? () => { pedirPermissao(); } : undefined}
        />
        <View style={{ padding: Spacing.lg }}>
          <Button label="Carregar imagem do QR" icon="image-outline" variant="outline" onPress={carregarImagem} fullWidth />
        </View>
        </View>
      ) : (
        <View style={styles.conteudo}>
          <View style={styles.camara}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={lanterna}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={aoLer}
              accessibilityLabel="Câmara para ler QR Code"
            />
            <View pointerEvents="none" style={[styles.moldura, { borderColor: cores.principal }]} />
          </View>
          <Text style={[Typography.body, { color: cores.textoSecundario, textAlign: 'center' }]}>
            Aponta a câmara ao QR Code mostrado pelo docente.
          </Text>
          <Button label="Carregar imagem do QR" icon="image-outline" variant="outline" onPress={carregarImagem} fullWidth />
          <Button label={lanterna ? 'Desligar lanterna' : 'Ligar lanterna'} icon={lanterna ? 'flash' : 'flash-outline'} variant="outline" onPress={() => setLanterna(v => !v)} fullWidth />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { flex: 1 },
  conteudo: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  camara: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  moldura: { width: 220, height: 220, borderWidth: 3, borderRadius: Radius.lg },
});
