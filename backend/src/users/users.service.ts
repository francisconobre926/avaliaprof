import { BadRequestException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { UPLOADS_DIR } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, UpdateMeDto } from './dto/update-me.dto';
import { toUserDto } from './user.mapper';

/** Valida o tipo real do ficheiro pelos primeiros bytes (o mimetype do cliente é falsificável). */
function detectarExtensao(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.length >= 12 && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private auth: AuthService) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { course: true } });
    if (!user) throw new NotFoundException();
    return toUserDto(user);
  }

  async update(userId: string, dto: UpdateMeDto) {
    const atual = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    // O nome público do docente é o da sua ficha, gerida pela administração.
    if (dto.name !== undefined && atual?.role === 'TEACHER') {
      throw new ForbiddenException({ code: 'NOME_DO_DOCENTE', message: 'O nome do docente é definido pela administração.' });
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data: { name: dto.name }, include: { course: true } });
    return toUserDto(user);
  }

  /** Muda a senha (exige a actual), termina as outras sessões e devolve um novo par de tokens para este dispositivo. */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.password) throw new NotFoundException();
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new HttpException({ code: 'SENHA_ACTUAL', message: 'A senha actual não está correcta.' }, 400);
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new HttpException({ code: 'SENHA_IGUAL', message: 'A nova senha tem de ser diferente da actual.' }, 400);
    }
    await this.prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(dto.newPassword, 12) } });
    await this.auth.revokeAll(userId);
    return this.auth.issueFor(userId);
  }

  /** A fotografia do docente é a que os estudantes veem: mantém a ficha em sintonia com a conta. */
  private async syncTeacherPhoto(userId: string, photoUrl: string | null) {
    await this.prisma.teacher.updateMany({ where: { userId }, data: { photoUrl } });
  }

  async setPhoto(userId: string, file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Ficheiro em falta.');
    const ext = detectarExtensao(file.buffer);
    if (!ext) throw new BadRequestException('Formato inválido. Usa JPEG, PNG ou WebP.');

    const dir = join(UPLOADS_DIR, 'avatars');
    await fs.mkdir(dir, { recursive: true });
    const nome = `${randomUUID()}.${ext}`;
    await fs.writeFile(join(dir, nome), file.buffer);

    const anterior = await this.prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { photoUrl: `/uploads/avatars/${nome}` },
      include: { course: true },
    });
    await this.syncTeacherPhoto(userId, user.photoUrl);
    if (anterior?.photoUrl?.startsWith('/uploads/avatars/')) {
      await fs.rm(join(UPLOADS_DIR, 'avatars', anterior.photoUrl.split('/').pop()!), { force: true });
    }
    return toUserDto(user);
  }

  async removePhoto(userId: string) {
    const anterior = await this.prisma.user.findUnique({ where: { id: userId }, select: { photoUrl: true } });
    const user = await this.prisma.user.update({ where: { id: userId }, data: { photoUrl: null }, include: { course: true } });
    await this.syncTeacherPhoto(userId, null);
    if (anterior?.photoUrl?.startsWith('/uploads/avatars/')) {
      await fs.rm(join(UPLOADS_DIR, 'avatars', anterior.photoUrl.split('/').pop()!), { force: true });
    }
    return toUserDto(user);
  }
}
