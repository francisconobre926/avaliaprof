import { Body, Controller, UseInterceptors, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  AddStudentsToGroupDto, AddSubjectDto, CandidatesQueryDto, ClassGroupsQueryDto, CreateClassGroupDto, CreateStudentDto, EnrollmentStatusDto, StudentsQueryDto,
  UpdateStudentDto,
} from './admin-students.dto';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import {
  AuditQueryDto, CommentsQueryDto, CommentStatusDto, CreateCourseDto, CreateSubjectDto, CreateTeacherDto, InviteTeacherDto, LinkSubjectDto, PeriodDto,
  ReportResolveDto, ReportsQueryDto, TeacherSubjectsDto, UpdatePeriodDto, UserStatusDto, UsersQueryDto,
} from './admin-panel.dto';
import { AuditInterceptor } from './audit.interceptor';
import { AdminPanelService } from './admin-panel.service';
import { AdminClassGroupsService } from './admin-class-groups.service';
import { AdminStudentsService } from './admin-students.service';

/** Gestão de estudantes e turmas: exclusiva do administrador (verificado no servidor em todas as rotas). */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@UseInterceptors(AuditInterceptor)
@Controller('admin')
export class AdminController {
  constructor(
    private students: AdminStudentsService,
    private groups: AdminClassGroupsService,
    private panel: AdminPanelService,
  ) {}

  @Get('academic-options') options() { return this.groups.options(); }

  // ── Estudantes ──
  @Get('students') list(@Query() q: StudentsQueryDto) { return this.students.list(q); }
  @Post('students') create(@Body() dto: CreateStudentDto) { return this.students.create(dto); }
  @Get('students/:id') get(@Param('id', ParseUUIDPipe) id: string, @Query('semesterId', new ParseUUIDPipe({ optional: true })) semesterId?: string) {
    return this.students.get(id, semesterId);
  }
  @Patch('students/:id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStudentDto) { return this.students.update(id, dto); }
  @Patch('students/:id/enrollment') setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EnrollmentStatusDto) {
    return this.students.setEnrollmentStatus(id, dto);
  }
  @Get('students/:id/available-subjects') availableSubjects(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('semesterId', new ParseUUIDPipe({ optional: true })) semesterId?: string,
  ) {
    return this.students.availableSubjects(id, semesterId);
  }
  @Post('students/:id/subjects') addSubject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddSubjectDto) { return this.students.addSubject(id, dto); }
  @Delete('students/:id/subjects/:courseSubjectId') removeSubject(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('courseSubjectId', ParseUUIDPipe) csId: string,
    @Query('semesterId', new ParseUUIDPipe({ optional: true })) semesterId?: string,
  ) {
    return this.students.removeSubject(id, csId, semesterId);
  }

  // ── Turmas ──
  @Get('class-groups') listGroups(@Query() q: ClassGroupsQueryDto) { return this.groups.list(q); }
  @Get('class-groups/:id') groupDetail(@Param('id', ParseUUIDPipe) id: string) { return this.groups.detail(id); }
  @Get('class-groups/:id/candidates') groupCandidates(@Param('id', ParseUUIDPipe) id: string, @Query() q: CandidatesQueryDto) { return this.groups.candidates(id, q); }
  @Post('class-groups/:id/students') @HttpCode(200) addToGroup(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddStudentsToGroupDto) {
    return this.groups.addStudents(id, dto.studentIds);
  }
  @Post('class-groups') createGroup(@Body() dto: CreateClassGroupDto) { return this.groups.create(dto); }
  @Delete('class-groups/:id') @HttpCode(200) removeGroup(@Param('id', ParseUUIDPipe) id: string) { return this.groups.remove(id); }

  // ── Semestres e períodos ──
  @Get('semesters') semesters() { return this.panel.semesters(); }
  @Post('semesters/:id/current') @HttpCode(200) setCurrent(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.panel.setCurrentSemester(u.userId, id); }
  @Get('periods') periods() { return this.panel.periods(); }
  @Post('periods') createPeriod(@CurrentUser() u: AuthUser, @Body() dto: PeriodDto) { return this.panel.createPeriod(u.userId, dto); }
  @Patch('periods/:id') updatePeriod(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePeriodDto) { return this.panel.updatePeriod(u.userId, id, dto); }
  @Delete('periods/:id') @HttpCode(200) removePeriod(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return this.panel.removePeriod(u.userId, id); }

  // ── Estrutura académica ──
  @Get('structure') structure() { return this.panel.structure(); }
  @Post('courses') createCourse(@CurrentUser() u: AuthUser, @Body() dto: CreateCourseDto) { return this.panel.createCourse(u.userId, dto); }
  @Post('subjects') createSubject(@CurrentUser() u: AuthUser, @Body() dto: CreateSubjectDto) { return this.panel.createSubject(u.userId, dto); }
  @Post('subjects/:id/courses') linkSubject(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: LinkSubjectDto) { return this.panel.linkSubject(u.userId, id, dto); }
  @Post('teachers') createTeacher(@CurrentUser() u: AuthUser, @Body() dto: CreateTeacherDto) { return this.panel.createTeacher(u.userId, dto); }
  @Post('teachers/:id/subjects') @HttpCode(200) teacherSubjects(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: TeacherSubjectsDto) { return this.panel.setTeacherSubjects(u.userId, id, dto.subjectIds); }
  @Post('teachers/:id/invite') @HttpCode(200) invite(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: InviteTeacherDto) { return this.panel.inviteTeacher(u.userId, id, dto.email); }

  // ── Utilizadores, moderação, estatísticas, auditoria ──
  @Get('users') users(@Query() q: UsersQueryDto) { return this.panel.users(q); }
  @Patch('users/:id/status') userStatus(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UserStatusDto) { return this.panel.setUserStatus(u.userId, id, dto.status); }
  @Get('comments') comments(@Query() q: CommentsQueryDto) { return this.panel.comments(q); }
  @Patch('comments/:id') commentStatus(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CommentStatusDto) { return this.panel.setCommentStatus(u.userId, id, dto.status); }
  @Get('reports') reports(@Query() q: ReportsQueryDto) { return this.panel.reports(q); }
  @Patch('reports/:id') resolveReport(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReportResolveDto) { return this.panel.resolveReport(u.userId, id, dto.status, dto.hideComment); }
  @Get('stats') stats() { return this.panel.stats(); }
  @Get('audit') audit(@Query() q: AuditQueryDto) { return this.panel.auditLog(q.page ?? 0); }
}
