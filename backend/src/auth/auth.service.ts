import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { toUserDto } from '../users/user.mapper';
import { ActivateTeacherDto, ForgotDto, LoginDto, RegisterDto, ResetDto } from './dto/auth.dto';

const RESET_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Falhas seguidas que bloqueiam a conta, e durante quanto tempo. */
const MAX_LOGIN_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
/** Tentativas erradas do código de recuperação/convite antes de o invalidar. */
const MAX_CODE_ATTEMPTS = 5;
// Hash válido de uma senha qualquer: iguala o tempo de resposta quando o email não existe.
const HASH_FALSO = bcrypt.hashSync('avaliaprof-sem-utilizador', 12);

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

type UserComCurso = Awaited<ReturnType<AuthService['loadWithCourse']>>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) { }

  private loadWithCourse(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, include: { course: true } });
  }

  /**
   * Sessão = token de acesso curto (JWT com a versão da conta) + token de renovação rotativo, guardado só como hash.
   * Mudar a senha ou terminar sessão em todo o lado sobe `tokenVersion` e invalida os tokens de acesso já emitidos.
   */
  private async issue(user: NonNullable<UserComCurso>) {
    const token = this.jwt.sign({ sub: user.id, tv: user.tokenVersion });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
    });
    return { token, refreshToken, user: toUserDto(user) };
  }

  /** Emite um novo par de tokens para uma conta já autenticada (ex.: depois de mudar a senha). */
  async issueFor(userId: string) {
    return this.issue(await this.loadWithCourse(userId));
  }

  /**
   * Activação de conta de estudante (D-11: o registo livre está fechado). Só quem o administrador já
   * cadastrou (mesmo email E número, conta pendente) define a senha e passa a ACTIVE; curso e matrícula
   * são os do cadastro. Qualquer outro caso é recusado e não se cria conta nenhuma.
   */
  async register(dto: RegisterDto) {
    const pre = await this.prisma.user.findFirst({
      where: { email: dto.email, studentNumber: dto.studentNumber, role: 'STUDENT' },
    });
    if (!pre) {
      throw new ForbiddenException({ code: 'NAO_CADASTRADO', message: 'Não encontrámos o teu cadastro com este email e número. Contacta a administração.' });
    }
    if (pre.status !== 'PENDING' || pre.password) {
      throw new ConflictException({ code: 'CONTA_EXISTENTE', message: 'Esta conta já foi activada. Entra com a tua senha.' });
    }
    const user = await this.prisma.user.update({
      where: { id: pre.id },
      data: { password: await bcrypt.hash(dto.password, 12), status: 'ACTIVE' },
      include: { course: true },
    });
    return this.issue(user);
  }

  /** Activação do docente com o código de convite que o administrador lhe entregou. */
  async activateTeacher(dto: ActivateTeacherDto) {
    const erro = new BadRequestException({ code: 'CONVITE', message: 'Convite inválido ou expirado.' });
    const user = await this.prisma.user.findFirst({ where: { email: dto.email, role: 'TEACHER' } });
    if (!user || user.status !== 'PENDING' || !user.resetCodeHash || !user.resetExpires || user.resetExpires < new Date()) throw erro;
    if (!(await this.codeMatches(user, dto.code))) throw erro;
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.password, 12), status: 'ACTIVE', resetCodeHash: null, resetExpires: null, resetAttempts: 0 },
      include: { course: true },
    });
    return this.issue(updated);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email }, include: { course: true } });
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      const min = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new HttpException({ code: 'CONTA_BLOQUEADA', message: `Demasiadas tentativas falhadas. Tenta de novo dentro de ${min} minuto(s).` }, 429);
    }
    const ok = await bcrypt.compare(dto.password, user?.password ?? HASH_FALSO) && !!user?.password;
    if (!user || !ok) {
      if (user) {
        const falhas = user.loginFailures + 1;
        await this.prisma.user.update({
          where: { id: user.id },
          data: falhas >= MAX_LOGIN_FAILURES ? { loginFailures: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { loginFailures: falhas },
        });
      }
      throw new UnauthorizedException({ code: 'CREDENCIAIS', message: 'Email ou senha incorrectos.' });
    }
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException({ code: 'CONTA_INACTIVA', message: 'Esta conta não está activa. Contacta a administração.' });
    }
    if (user.loginFailures || user.lockedUntil) await this.prisma.user.update({ where: { id: user.id }, data: { loginFailures: 0, lockedUntil: null } });
    return this.issue(user);
  }

  /** Troca um token de renovação válido por um novo par. Reutilizar um já usado indica roubo: revoga tudo. */
  async refresh(refreshToken: string) {
    const invalido = new UnauthorizedException({ code: 'SESSAO_INVALIDA', message: 'Sessão expirada. Entra de novo.' });
    const rt = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } });
    if (!rt) throw invalido;
    if (rt.revokedAt) {
      await this.revokeAll(rt.userId);
      throw invalido;
    }
    if (rt.expiresAt < new Date()) throw invalido;
    const claim = await this.prisma.refreshToken.updateMany({ where: { id: rt.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (!claim.count) throw invalido;
    const user = await this.prisma.user.findUnique({ where: { id: rt.userId }, include: { course: true } });
    if (!user || user.status !== 'ACTIVE') throw invalido;
    return this.issue(user);
  }

  /** Termina a sessão deste dispositivo (revoga o seu token de renovação). */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({ where: { userId, tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    }
    return { ok: true };
  }

  /** Termina todas as sessões: revoga os tokens de renovação e invalida os de acesso já emitidos. */
  async revokeAll(userId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } }),
    ]);
    return { ok: true };
  }

  /** Responde sempre igual, exista ou não o email, para não revelar quem tem conta. */
  async forgot(dto: ForgotDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (user) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetCodeHash: this.hashCode(code), resetExpires: new Date(Date.now() + RESET_TTL_MS), resetAttempts: 0 },
      });
      // Ainda não há fornecedor de email. Fora de produção o código vai para o log do servidor.
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Código de recuperação para ${user.email}: ${code}`);
      } else {
        this.logger.error('Recuperação pedida em produção mas não existe serviço de email configurado.');
      }
    }
    return { ok: true };
  }

  async reset(dto: ResetDto) {
    const erro = new BadRequestException({ code: 'CODIGO', message: 'Código inválido ou expirado.' });
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.resetCodeHash || !user.resetExpires || user.resetExpires < new Date()) throw erro;
    if (!(await this.codeMatches(user, dto.code))) throw erro;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(dto.newPassword, 12), resetCodeHash: null, resetExpires: null, resetAttempts: 0,
        loginFailures: 0, lockedUntil: null, tokenVersion: { increment: 1 },
      },
    });
    // Mudar a senha termina todas as sessões abertas.
    await this.prisma.refreshToken.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { ok: true };
  }

  /**
   * Compara o código; cada falha conta e à 5.ª o código é invalidado (é preciso pedir outro), o que torna
   * inviável adivinhar um código de 6 dígitos mesmo com muitos IPs.
   */
  private async codeMatches(user: { id: string; resetCodeHash: string | null; resetAttempts: number }, code: string) {
    const a = Buffer.from(user.resetCodeHash ?? '');
    const b = Buffer.from(this.hashCode(code));
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
    const tentativas = user.resetAttempts + 1;
    await this.prisma.user.update({
      where: { id: user.id },
      data: tentativas >= MAX_CODE_ATTEMPTS ? { resetCodeHash: null, resetExpires: null, resetAttempts: 0 } : { resetAttempts: tentativas },
    });
    return false;
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }
}
