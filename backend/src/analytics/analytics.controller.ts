import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('overview')
  overview(@Query() q: DateRangeDto) {
    return this.service.overview(q.from, q.to);
  }

  @Get('daily')
  daily(@Query() q: DateRangeDto) {
    return this.service.dailySeries(q.from, q.to);
  }

  @Get('top-cities')
  topCities(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.service.topCities(limit);
  }
}