import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EcraResultadoQr } from '../../../src/components/ResultadoQr';
import { qrService } from '../../../service/qrService';

/** QR de uma sessão de avaliação criada pelo docente (`avaliaprof://qr/sessao/<token>`). */
export default function QrSessao() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const carregar = useCallback(() => qrService.porSessao(String(token)), [token]);
  return <EcraResultadoQr titulo="Sessão de avaliação" carregar={carregar} />;
}
