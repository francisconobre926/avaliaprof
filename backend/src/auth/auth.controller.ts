import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ActivateTeacherDto, ForgotDto, LoginDto, LogoutDto, RefreshDto, RegisterDto, ResetDto } from './dto/auth.dto';

/** Limite apertado nas rotas de autenticação (anti força-bruta). AUTH_RATE_LIMIT só deve subir em testes. */
@Throttle({ default: { limit: Number(process.env.AUTH_RATE_LIMIT ?? 10), ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  
  constructor(private auth: AuthService) { }

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  @Post('activate-teacher') @HttpCode(200) activateTeacher(@Body() dto: ActivateTeacherDto) { 
    return this.auth.activateTeacher(dto); 
  }

  @Post('refresh') @HttpCode(200) refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }
  @UseGuards(JwtAuthGuard) @Post('logout') @HttpCode(200) logout(@CurrentUser() u: AuthUser, @Body() dto: LogoutDto) { return this.auth.logout(u.userId, dto.refreshToken); }
  @UseGuards(JwtAuthGuard) @Post('logout-all') @HttpCode(200) logoutAll(@CurrentUser() u: AuthUser) { return this.auth.revokeAll(u.userId); }
  @Post('login') @HttpCode(200) login(@Body() dto: LoginDto) { 
    return this.auth.login(dto); 
  }

  @Post('forgot') @HttpCode(200) forgot(@Body() dto: ForgotDto) { 
    return this.auth.forgot(dto); 
  }

  @Post('reset') @HttpCode(200) reset(@Body() dto: ResetDto) { 
    
    return this.auth.reset(dto); 

  }
}
