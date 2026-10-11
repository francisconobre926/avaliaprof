import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ContactChannel } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { StorageProvider } from '../media/storage/storage-provider.interface';
import { STORAGE_PROVIDER } from '../media/storage/storage-provider.interface';
import { UpdateUserDto } from './dto/update-user.dto';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  isProcurador?: boolean;
  isAnunciante?: boolean;
  termsAcceptedAt?: Date;
}

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 MB
const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UsersService {
  private logger = new Logger('UsersService');

  constructor(
    private prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private storage: StorageProvider,
  ) {}

  // Perfil PRIVADO: só o próprio utilizador o vê (/users/me)
  private readonly publicSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    alternatePhone: true,
    advertiserType: true,
    contactChannels: true,
    photoUrl: true,
    isProcurador: true,
    isAnunciante: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
  };

  // Perfil PÚBLICO: sem email nem telefones, que só se revelam depois do desbloqueio
  private readonly publicProfileSelect = {
    id: true,
    name: true,
    isAnunciante: true,
    advertiserType: true,
    contactChannels: true,
    photoUrl: true,
    createdAt: true,
  };

  async findByEmail(email: string) {
    // Usado só pelo auth (login) — aqui PRECISAMOS da password para comparar
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicSelect,
    });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }
    return user;
  }

  async findPublicById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicProfileSelect,
    });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }
    return user;
  }

  async create(data: CreateUserData) {
    return this.prisma.user.create({ data });
  }

  async update(id: string, dto: UpdateUserDto) {
    const current = await this.findById(id); // lança 404 se não existir

    // Telefone e WhatsApp como canais exigem um número no perfil
    const phone = dto.phone ?? current.phone;
    const channels = dto.contactChannels ?? current.contactChannels;
    const needsPhone = channels.some(
      (c) => c === ContactChannel.TELEFONE || c === ContactChannel.WHATSAPP,
    );
    if (needsPhone && !phone) {
      throw new BadRequestException(
        'Para aceitar contacto por telefone ou WhatsApp, indica o teu número.',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: this.publicSelect,
    });
  }

  async setPhoto(userId: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Envia uma imagem no campo "file".');
    }
    const extension = PHOTO_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException('A foto deve ser JPG, PNG ou WebP.');
    }
    if (file.size > MAX_PHOTO_SIZE) {
      throw new BadRequestException('A foto excede o limite de 2 MB.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { photoKey: true },
    });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    // A chave não usa o nome do ficheiro enviado, só um UUID
    const key = `users/${userId}/photo/${randomUUID()}.${extension}`;
    const { url } = await this.storage.upload(file.buffer, key, file.mimetype);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: url, photoKey: key },
      select: this.publicSelect,
    });

    // A foto antiga só se apaga depois de a nova estar guardada
    if (user.photoKey) {
      await this.deleteFromStorage(user.photoKey);
    }
    return updated;
  }

  async removePhoto(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { photoKey: true },
    });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: null, photoKey: null },
      select: this.publicSelect,
    });
    if (user.photoKey) {
      await this.deleteFromStorage(user.photoKey);
    }
    return updated;
  }

  // Um ficheiro órfão no R2 não deve estragar o pedido do utilizador
  private async deleteFromStorage(key: string) {
    try {
      await this.storage.delete(key);
    } catch (e) {
      this.logger.warn(`Não foi possível apagar ${key} do R2: ${(e as Error).message}`);
    }
  }
}