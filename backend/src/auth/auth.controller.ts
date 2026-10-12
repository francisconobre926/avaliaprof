import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorCodeDto, TwoFactorLoginDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('2fa/login')
  async loginWithTwoFactor(@Body() dto: TwoFactorLoginDto) {
    return this.authService.loginWithTwoFactor(dto.tempToken, dto.code);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@Request() req: AuthenticatedRequest) {
    return this.authService.setupTwoFactor(req.user.userId);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enableTwoFactor(@Request() req: AuthenticatedRequest, @Body() dto: TwoFactorCodeDto) {
    return this.authService.enableTwoFactor(req.user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: AuthenticatedRequest) {
    return req.user;
  }
}