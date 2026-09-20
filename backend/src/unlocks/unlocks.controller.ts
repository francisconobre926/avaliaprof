import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { UnlocksService } from './unlocks.service';
import { UnlockListingDto } from './dto/unlock-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('unlocks')
export class UnlocksController {
  constructor(private unlocksService: UnlocksService) {}

  @Get('me')
  async getMyUnlocks(@Request() req: AuthenticatedRequest) {
    return this.unlocksService.getMyUnlocks(req.user.userId);
  }

  @Post(':listingId')
  async unlock(
    @Request() req: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @Body() dto: UnlockListingDto,
  ) {
    return this.unlocksService.unlock(req.user.userId, listingId, dto.payerPhone);
  }
}