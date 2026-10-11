import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/jwt-auth/optional-jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

// Nas rotas públicas pode não haver sessão
interface OptionalAuthRequest extends ExpressRequest {
  user?: { userId: string; email: string };
}

@Controller('listings')
export class ListingsController {
  constructor(private listingsService: ListingsService) {}

  @Get('search')
  async search(@Query() dto: SearchListingsDto) {
    return this.listingsService.search(dto);
  }

  @Get()
  async findAll() {
    return this.listingsService.findAll();
  }

  // Público, mas o dono também vê o seu rascunho ou suspenso
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  async findById(@Request() req: OptionalAuthRequest, @Param('id') id: string) {
    return this.listingsService.findById(id, req.user?.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateListingDto) {
    return this.listingsService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.listingsService.remove(id, req.user.userId);
  }
}