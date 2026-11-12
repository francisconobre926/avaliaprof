import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { EnrollmentService } from './enrollment.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('me/subjects')
export class EnrollmentController {
  constructor(private enrollment: EnrollmentService) {}

  /** Cadeiras (e docentes) do semestre corrente, segundo a matrícula atribuída pela administração. */
  @Get() mine(@CurrentUser() u: AuthUser) { return this.enrollment.mine(u.userId); }
}
