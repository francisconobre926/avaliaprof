import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class PageDto { @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0; }

/** Qualquer utilizador autenticado lê e marca as SUAS notificações. */
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private n: NotificationsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: PageDto) { return this.n.list(u.userId, q.page ?? 0); }
  @Get('unread-count') unread(@CurrentUser() u: AuthUser) { return this.n.unreadCount(u.userId); }
  @Post('read-all') @HttpCode(200) readAll(@CurrentUser() u: AuthUser) { return this.n.markAllRead(u.userId); }
  @Post(':id/read') @HttpCode(200) read(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.n.markRead(u.userId, id); }
}
