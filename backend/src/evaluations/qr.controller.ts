import { Body, Controller, Get, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from './qr.service';

const TOKEN = /^[A-Za-z0-9_-]{10,40}$/;
const bad = () => new HttpException({ code: 'QR_INVALIDO', message: 'QR Code inválido.' }, 404);

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('qr')
export class QrController {
  constructor(private qr: QrService) {}
  @Get('teacher/:code') teacher(@CurrentUser() u: AuthUser, @Param('code') code: string) {
    if (!TOKEN.test(code)) throw bad();
    return this.qr.byTeacherCode(u.userId, code);
  }
  @Get('session/:token') session(@CurrentUser() u: AuthUser, @Param('token') token: string) {
    if (!TOKEN.test(token)) throw bad();
    return this.qr.bySession(u.userId, token);
  }
}

class ReportDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @Length(3, 300) reason: string;
}

/** Denúncia de um comentário público (qualquer utilizador autenticado, uma vez por comentário). */
@UseGuards(JwtAuthGuard)
@Controller('comments')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Post(':id/report') async report(@CurrentUser() u: AuthUser, @Param('id') id: string, @Body() dto: ReportDto) {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpException('Comentário não encontrado.', 404);
    const c = await this.prisma.comment.findFirst({ where: { id, status: 'PUBLISHED' }, select: { id: true } });
    if (!c) throw new HttpException('Comentário não encontrado.', 404);
    try {
      await this.prisma.commentReport.create({ data: { commentId: id, reporterId: u.userId, reason: dto.reason } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new HttpException({ code: 'JA_DENUNCIADO', message: 'Já denunciaste este comentário.' }, 409);
      }
      throw e;
    }
    return { ok: true };
  }
}
