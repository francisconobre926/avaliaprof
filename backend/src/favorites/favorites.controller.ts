import { Controller, Get, Post, Delete, Param, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get('me')
  async findMyFavorites(@Request() req: AuthenticatedRequest) {
    return this.favoritesService.findMyFavorites(req.user.userId);
  }

  @Post(':listingId')
  async add(@Request() req: AuthenticatedRequest, @Param('listingId') listingId: string) {
    return this.favoritesService.add(req.user.userId, listingId);
  }

  @Delete(':listingId')
  async remove(@Request() req: AuthenticatedRequest, @Param('listingId') listingId: string) {
    return this.favoritesService.remove(req.user.userId, listingId);
  }
}