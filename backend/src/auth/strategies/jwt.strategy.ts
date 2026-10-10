import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isAdmin: true, isAnunciante: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const role = user.isAdmin
      ? Role.ADMIN
      : user.isAnunciante
        ? Role.ADVERTISER
        : Role.SEEKER;

    // userId e email mantêm-se, por isso os outros controllers não mudam
    return { userId: user.id, email: user.email, role };
  }
}