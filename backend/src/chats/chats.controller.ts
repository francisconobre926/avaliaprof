import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Get('me')
  async findMyChats(@Request() req: AuthenticatedRequest) {
    return this.chatsService.findMyChats(req.user.userId);
  }

  @Get(':chatId/messages')
  async findMessages(@Request() req: AuthenticatedRequest, @Param('chatId') chatId: string) {
    return this.chatsService.findMessages(chatId, req.user.userId);
  }

  @Post(':chatId/messages')
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(chatId, req.user.userId, dto.content, dto.type ?? 'TEXTO');
  }

  @Post(':chatId/read')
  async markAsRead(@Request() req: AuthenticatedRequest, @Param('chatId') chatId: string) {
    return this.chatsService.markAsRead(chatId, req.user.userId);
  }

  @Post(':chatId/archive')
  async archive(@Request() req: AuthenticatedRequest, @Param('chatId') chatId: string) {
    return this.chatsService.archive(chatId, req.user.userId);
  }

  @Post(':chatId/block')
  async block(@Request() req: AuthenticatedRequest, @Param('chatId') chatId: string) {
    return this.chatsService.block(chatId, req.user.userId);
  }
}