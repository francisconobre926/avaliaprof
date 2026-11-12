import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { EcraResultadoQr } from '../../../src/components/ResultadoQr';
import { qrService } from '../../../service/qrService';

/** QR permanente do docente (`avaliaprof://qr/professor/<código>`). */
export default function QrProfessor() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const carregar = useCallback(() => qrService.porProfessor(String(codigo)), [codigo]);
  return <EcraResultadoQr titulo="QR do docente" carregar={carregar} />;
}
