import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseEnumPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ReportStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  async list(
    @Query('status', new ParseEnumPipe(ReportStatus, { optional: true }))
    status?: ReportStatus,
  ) {
    return this.reportsService.listForAdmin(status);
  }

  @Patch(':id/resolve')
  async resolve(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(req.user.userId, id, dto);
  }
}