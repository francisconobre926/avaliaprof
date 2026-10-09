import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('me')
  findMine(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.findMine(req.user.userId);
  }

  @Get('unread-count')
  unreadCount(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.unreadCount(req.user.userId);
  }

  @Get('preferences')
  getPreferences(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.getPreferences(req.user.userId);
  }

  @Patch('preferences')
  setPreference(@Request() req: AuthenticatedRequest, @Body() dto: UpdatePreferenceDto) {
    return this.notificationsService.setPreference(req.user.userId, dto.type, dto.enabled);
  }

  @Post('devices')
  registerDevice(@Request() req: AuthenticatedRequest, @Body() dto: RegisterDeviceDto) {
    return this.notificationsService.registerDevice(req.user.userId, dto.token, dto.platform);
  }

  @Delete('devices/:token')
  removeDevice(@Request() req: AuthenticatedRequest, @Param('token') token: string) {
    return this.notificationsService.removeDevice(req.user.userId, token);
  }

  @Post('read-all')
  markAllRead(@Request() req: AuthenticatedRequest) {
    return this.notificationsService.markAllRead(req.user.userId);
  }

  @Post(':id/read')
  markRead(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markRead(id, req.user.userId);
  }

  @Post(':id/unread')
  markUnread(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.notificationsService.markUnread(id, req.user.userId);
  }
}