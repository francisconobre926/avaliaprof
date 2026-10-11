import {
  Injectable, ConflictException, UnauthorizedException,
  BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Tolera 1 intervalo de 30s de diferença entre o relógio do telemóvel e o do servidor
authenticator.options = { window: 1 };

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Já existe uma conta com este email.');
    }

    if (!dto.acceptedTerms) {
      throw new BadRequestException('É necessário aceitar os termos e a política de não-reembolso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      phone: dto.phone,
      isProcurador: dto.isProcurador ?? true,
      isAnunciante: dto.isAnunciante ?? false,
      termsAcceptedAt: new Date(),
    });

    return this.generateToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email ou password incorretos.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou password incorretos.');
    }

    // Admin com 2FA ativo: ainda não recebe acesso, só um token temporário
    if (user.isAdmin && user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, scope: '2fa' },
        { expiresIn: '5m' },
      );
      return { requires2FA: true, tempToken };
    }

    return this.generateToken(user.id, user.email);
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Apenas administradores usam 2FA.');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('O 2FA já está ativo.');
    }

    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, otpauthUrl: authenticator.keyuri(user.email, 'GoHome', secret) };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isAdmin || !user.twoFactorSecret) {
      throw new BadRequestException('Inicia primeiro a configuração do 2FA.');
    }
    if (user.twoFactorEnabled) {
      throw new BadRequestException('O 2FA já está ativo.');
    }
    if (!authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException('Código inválido.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return this.generateToken(user.id, user.email, true);
  }

  async loginWithTwoFactor(tempToken: string, code: string) {
    let payload: { sub: string; scope?: string };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faz login outra vez.');
    }
    if (payload.scope !== '2fa') {
      throw new UnauthorizedException('Token inválido.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isAdmin || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Token inválido.');
    }
    if (!authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException('Código inválido.');
    }

    return this.generateToken(user.id, user.email, true);
  }

  private generateToken(userId: string, email: string, twoFactorVerified = false) {
    const payload = { sub: userId, email, twoFactorVerified };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}