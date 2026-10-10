import {
  Controller, Get, Patch, Param, Body, Query, ParseEnumPipe, UseGuards, Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { VerificationStatus } from '@prisma/client';
import { VerificationsService } from './verifications.service';
import { ReviewVerificationDto } from './dto/review-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/verifications')
export class AdminVerificationsController {
  constructor(private service: VerificationsService) {}

  @Get()
  list(
    @Query('status', new ParseEnumPipe(VerificationStatus, { optional: true }))
    status?: VerificationStatus,
  ) {
    return this.service.listForAdmin(status);
  }

  @Patch(':id/review')
  review(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ReviewVerificationDto,
  ) {
    return this.service.review(req.user.userId, id, dto);
  }
}