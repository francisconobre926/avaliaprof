import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { VerificationsService } from './verifications.service';
import { RequestVerificationDto } from './dto/request-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('verifications')
export class VerificationsController {
  constructor(private service: VerificationsService) {}

  @Post()
  request(@Request() req: AuthenticatedRequest, @Body() dto: RequestVerificationDto) {
    return this.service.request(req.user.userId, dto);
  }

  @Get('me')
  getMine(@Request() req: AuthenticatedRequest) {
    return this.service.getMine(req.user.userId);
  }

  // Selos públicos de qualquer utilizador (para mostrar no anúncio e no perfil)
  @Get('badges/:userId')
  getBadges(@Param('userId') userId: string) {
    return this.service.getBadges(userId);
  }
}