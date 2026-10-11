import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Request() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.setPhoto(req.user.userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/photo')
  async removePhoto(@Request() req: AuthenticatedRequest) {
    return this.usersService.removePhoto(req.user.userId);
  }

  // Perfil público: sem email nem telefones
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }
}