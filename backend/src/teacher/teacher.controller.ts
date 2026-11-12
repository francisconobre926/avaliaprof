import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { PageQueryDto } from '../evaluations/evaluations.dto';
import { CreateSessionDto, ReplyDto } from './teacher.dto';
import { TeacherService } from './teacher.service';

/** Área do docente (papel TEACHER). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@Controller('teacher/me')
export class TeacherController {
  constructor(private teacher: TeacherService) {}

  @Get() me(@CurrentUser() u: AuthUser) { return this.teacher.me(u.userId); }
  @Get('stats') stats(@CurrentUser() u: AuthUser, @Query('subjectId', new ParseUUIDPipe({ optional: true })) subjectId?: string) {
    return this.teacher.statsOf(u.userId, subjectId);
  }
  @Get('comments') comments(@CurrentUser() u: AuthUser, @Query() q: PageQueryDto) {
    return this.teacher.comments(u.userId, q.page ?? 0, q.pageSize ?? 10, q.subjectId);
  }
  @Put('comments/:id/reply') @HttpCode(200) reply(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplyDto) {
    return this.teacher.reply(u.userId, id, dto.text);
  }
  @Delete('comments/:id/reply') @HttpCode(200) removeReply(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.teacher.removeReply(u.userId, id);
  }

  @Get('sessions') sessions(@CurrentUser() u: AuthUser) { return this.teacher.sessions(u.userId); }
  @Post('sessions') createSession(@CurrentUser() u: AuthUser, @Body() dto: CreateSessionDto) { return this.teacher.createSession(u.userId, dto); }
  @Post('sessions/:id/close') @HttpCode(200) close(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.teacher.closeSession(u.userId, id); }
}
