import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { HomeService } from './home.service';
import { InsightsService } from './insights.service';

class InsightsQueryDto {
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() subjectId?: string;
  @IsOptional() @IsUUID() semesterId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) @Transform(({ value }) => value) limit?: number;
}

/** Início do estudante: resumo, por avaliar, destaques e as suas avaliações recentes. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller('home')
export class HomeController {
  constructor(private home: HomeService) {}
  @Get() get(@CurrentUser() u: AuthUser) { return this.home.home(u); }
}

/** Rankings e estatísticas agregadas de todos os docentes (com amostra mínima, ver InsightsService). */
@UseGuards(JwtAuthGuard)
@Controller('stats')
export class InsightsController {
  constructor(private insights: InsightsService) {}
  @Get('options') options() { return this.insights.options(); }
  @Get('ranking') ranking(@Query() q: InsightsQueryDto) { return this.insights.ranking(q); }
  @Get('overview') overview(@Query() q: InsightsQueryDto) { return this.insights.overview(q); }
}
