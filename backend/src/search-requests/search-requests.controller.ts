import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { SearchRequestsService } from './search-requests.service';
import { CreateSearchRequestDto } from './dto/create-search-request.dto';
import { UpdateSearchRequestDto } from './dto/update-search-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('search-requests')
export class SearchRequestsController {
  constructor(private service: SearchRequestsService) {}

  @Post()
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateSearchRequestDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Get()
  findMine(@Request() req: AuthenticatedRequest) {
    return this.service.findMine(req.user.userId);
  }

  @Patch(':id')
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSearchRequestDto,
  ) {
    return this.service.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.service.remove(req.user.userId, id);
  }
}