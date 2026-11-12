import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateEvaluationDto, PageQueryDto, SyncDto, UpdateEvaluationDto } from './evaluations.dto';
import { EvaluationsService } from './evaluations.service';
import { TeacherScopeService } from '../teacher-scope/teacher-scope.service';
import { StatsService } from './stats.service';

/** Avaliações: só estudantes (R-1, R-5). Docentes e administradores recebem 403. */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STUDENT)
@Controller()
export class EvaluationsController {
  constructor(private evaluations: EvaluationsService) {}

  /** 201 quando cria; 200 quando o `clientId` já tinha sido gravado (reenvio idempotente). */
  @Post('evaluations')
  async create(@CurrentUser() u: AuthUser, @Body() dto: CreateEvaluationDto, @Res({ passthrough: true }) res: Response) {
    const r = await this.evaluations.create(u.userId, dto);
    res.status(r.duplicate ? 200 : 201);
    return { duplicate: r.duplicate, evaluation: r.evaluation };
  }

  @Patch('evaluations/:id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEvaluationDto) {
    return this.evaluations.update(u.userId, id, dto);
  }

  @Delete('evaluations/:id') @HttpCode(200) remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.remove(u.userId, id);
  }

  @Post('sync/evaluations') @HttpCode(200) sync(@CurrentUser() u: AuthUser, @Body() dto: SyncDto) { return this.evaluations.sync(u.userId, dto.operations); }

  @Get('me/evaluations') mine(@CurrentUser() u: AuthUser) { return this.evaluations.mine(u.userId); }

  @Get('teachers/:id/eligibility') eligibility(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.eligibility(u.userId, id);
  }
}

/** Leitura: estatísticas agregadas e comentários publicados. O estudante só os vê dos docentes que lhe dão aulas. */
@UseGuards(JwtAuthGuard)
@Controller('teachers/:id')
export class TeacherInsightsController {
  constructor(
    private stats: StatsService,
    private scope: TeacherScopeService,
  ) {}

  @Get('stats') async statsOf(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('subjectId', new ParseUUIDPipe({ optional: true })) subjectId?: string,
  ) {
    await this.scope.assertCanView(u, id);
    return this.stats.teacherStats(id, subjectId);
  }

  @Get('comments') async comments(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query() q: PageQueryDto) {
    await this.scope.assertCanView(u, id);
    return this.stats.comments(id, q.page ?? 0, q.pageSize ?? 10, q.subjectId);
  }
}
