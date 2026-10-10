import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
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

  @Post(':listingId')
  async publish(
    @Request() req: AuthenticatedRequest,
    @Param('listingId') listingId: string,
    @Body() dto: PublishListingDto,
  ) {
    return this.publicationsService.publish(req.user.userId, listingId, dto.payerPhone);
  }
}