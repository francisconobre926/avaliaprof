import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { StorageProvider } from './storage/storage-provider.interface';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { probeVideoDuration } from './video-probe';
import { randomUUID } from 'crypto';

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_VIDEO_SECONDS = 60;
const VIDEO_DURATION_TOLERANCE = 0.5; // arredondamentos do contentor do vídeo

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {}

  private async assertOwner(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status === 'REMOVIDO') {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (listing.ownerId !== userId) {
      throw new ForbiddenException('Não tens permissão para gerir media deste anúncio.');
    }
    return listing;
  }

  async uploadImage(listingId: string, userId: string, file: Express.Multer.File) {
    await this.assertOwner(listingId, userId);

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Ficheiro deve ser uma imagem.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Imagem excede o limite de 5 MB.');
    }

    const currentCount = await this.prisma.media.count({
      where: { listingId, type: 'IMAGEM' },
    });
    if (currentCount >= MAX_IMAGES) {
      throw new BadRequestException(`Máximo de ${MAX_IMAGES} imagens por anúncio.`);
    }

    const key = `listings/${listingId}/images/${randomUUID()}-${file.originalname}`;
    const { url } = await this.storage.upload(file.buffer, key, file.mimetype);

    return this.prisma.media.create({
      data: {
        listingId,
        type: 'IMAGEM',
        url,
        key,
        order: currentCount,
        size: file.size,
      },
    });
  }

  async uploadVideo(listingId: string, userId: string, file: Express.Multer.File) {
    await this.assertOwner(listingId, userId);

    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Ficheiro deve ser um vídeo.');
    }
    if (file.size > MAX_VIDEO_SIZE) {
      throw new BadRequestException('Vídeo excede o limite de 50 MB.');
    }

    const existingVideo = await this.prisma.media.findFirst({
      where: { listingId, type: 'VIDEO' },
    });
    if (existingVideo) {
      throw new BadRequestException('Este anúncio já tem um vídeo. Remove-o antes de enviar outro.');
    }

    // Valida antes de enviar para o R2, para um vídeo recusado não deixar lixo
    const duration = await probeVideoDuration(file.buffer);
    if (duration > MAX_VIDEO_SECONDS + VIDEO_DURATION_TOLERANCE) {
      throw new BadRequestException(
        `O vídeo não pode ter mais de ${MAX_VIDEO_SECONDS} segundos.`,
      );
    }

    const key = `listings/${listingId}/video/${randomUUID()}-${file.originalname}`;
    const { url } = await this.storage.upload(file.buffer, key, file.mimetype);

    return this.prisma.media.create({
      data: { listingId, type: 'VIDEO', url, key, order: 0, size: file.size },
    });
  }

  async remove(mediaId: string, userId: string) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: { listing: true },
    });
    if (!media) {
      throw new NotFoundException('Ficheiro não encontrado.');
    }
    if (media.listing.ownerId !== userId) {
      throw new ForbiddenException('Não tens permissão para remover este ficheiro.');
    }

    await this.storage.delete(media.key);
    return this.prisma.media.delete({ where: { id: mediaId } });
  }

  async findByListingId(listingId: string) {
    return this.prisma.media.findMany({
      where: { listingId },
      orderBy: { order: 'asc' },
    });
  }
}