import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  /** O papel vem sempre da base de dados, nunca do token: remover um admin tem efeito imediato. */
  async validate(payload: { sub: string; tv?: number }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true },
    });
    // Conta suspensa perde acesso de imediato, mesmo com token ainda válido (R-15).
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException();
    // Versão da conta: sobe ao mudar a senha ou terminar sessões em todo o lado, invalidando tokens antigos.
    if (payload.tv !== user.tokenVersion) throw new UnauthorizedException();
    return { userId: user.id, email: user.email, role: user.role as AuthUser['role'] };
  }
}
