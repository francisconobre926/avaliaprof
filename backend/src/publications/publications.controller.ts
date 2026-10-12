import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { PublicationsService } from './publications.service';
import { PublishListingDto } from './dto/publish-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('publications')
export class PublicationsController {
  constructor(private publicationsService: PublicationsService) {}

  @Get(':listingId/quote')
  async getQuote(
    @Request() req: AuthenticatedRequest,
    @Param('listingId') listingId: string,
  ) {
    return this.publicationsService.getQuote(req.user.userId, listingId);
  }

  // Pagamento: poucas tentativas por minuto
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':listingId')
  async publish(
    @Request() req: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @Body() dto: PublishListingDto,
  ) {
    return this.publicationsService.publish(req.user.userId, listingId, dto.payerPhone);
  }
}