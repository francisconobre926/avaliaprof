import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ReferralsService } from './referrals.service';
import { ApplyReferralDto } from './dto/apply-referral.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private service: ReferralsService) {}

  // O meu código, o meu crédito e os meus convites
  @Get('me')
  getMine(@Request() req: AuthenticatedRequest) {
    return this.service.getMine(req.user.userId);
  }

  @Post('apply')
  apply(@Request() req: AuthenticatedRequest, @Body() dto: ApplyReferralDto) {
    return this.service.applyCode(req.user.userId, dto.code);
  }
}