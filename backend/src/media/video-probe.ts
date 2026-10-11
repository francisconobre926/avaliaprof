import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execFileAsync = promisify(execFile);
const logger = new Logger('VideoProbe');

interface ProbeOutput {
  format?: { duration?: string };
  streams?: { codec_type?: string }[];
}

/**
 * Devolve a duração do vídeo em segundos. Lança 400 se o ficheiro não for
 * um vídeo válido. Usa execFile (sem shell) e um nome de ficheiro fixo,
 * por isso nada do que o utilizador envia chega à linha de comandos.
 */
export async function probeVideoDuration(buffer: Buffer): Promise<number> {
  const dir = await mkdtemp(join(tmpdir(), 'gohome-video-'));
  const filePath = join(dir, 'input');

  try {
    await writeFile(filePath, buffer);

    const { stdout } = await execFileAsync(
      'ffprobe',
      [
        '-v', 'error',
        '-show_entries', 'format=duration:stream=codec_type',
        '-of', 'json',
        filePath,
      ],
      { timeout: 15_000 },
    );

    const info = JSON.parse(stdout) as ProbeOutput;
    const hasVideoStream = info.streams?.some((s) => s.codec_type === 'video') ?? false;
    const duration = Number(info.format?.duration);

    if (!hasVideoStream || !Number.isFinite(duration) || duration <= 0) {
      throw new BadRequestException('O ficheiro não é um vídeo válido.');
    }
    return duration;
  } catch (e) {
    if (e instanceof BadRequestException) throw e;

    // ffprobe não está instalado neste servidor: erro nosso, não do utilizador
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      logger.error('ffprobe não encontrado. Instala o ffmpeg no servidor.');
      throw new InternalServerErrorException(
        'Não foi possível validar o vídeo neste momento.',
      );
    }

    throw new BadRequestException('O ficheiro não é um vídeo válido.');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}