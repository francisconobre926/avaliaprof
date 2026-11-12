import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { PeriodsService } from './periods.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('periods')
export class PeriodsController {
  constructor(private periods: PeriodsService) {}

  @Get('current') current(@CurrentUser() u: AuthUser) { return this.periods.currentForStudent(u.userId); }
}
