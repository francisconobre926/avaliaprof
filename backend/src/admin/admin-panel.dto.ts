import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDate, IsEmail, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import { PeriodStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class PeriodDto {
  @IsUUID() semesterId: string;
  @Type(() => Date) @IsDate() opensAt: Date;
  @Type(() => Date) @IsDate() closesAt: Date;
  @IsOptional() @IsEnum(PeriodStatus) status?: PeriodStatus;
  /** Âmbito: vazio nos dois = todo o semestre. */
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID(undefined, { each: true }) courseIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(300) @IsUUID(undefined, { each: true }) courseSubjectIds?: string[];
}

export class UpdatePeriodDto {
  @IsOptional() @Type(() => Date) @IsDate() opensAt?: Date;
  @IsOptional() @Type(() => Date) @IsDate() closesAt?: Date;
  @IsOptional() @IsEnum(PeriodStatus) status?: PeriodStatus;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsUUID(undefined, { each: true }) courseIds?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(300) @IsUUID(undefined, { each: true }) courseSubjectIds?: string[];
}

export class CreateCourseDto {
  @Transform(trim) @IsString() @Length(3, 120) name: string;
  /** Abreviatura para o nome das turmas (ex.: Info). */
  @Transform(trim) @Matches(/^[A-Za-z]{2,6}$/, { message: 'A abreviatura deve ter 2 a 6 letras.' }) code: string;
}

export class CreateSubjectDto {
  @Transform(trim) @IsString() @Length(2, 140) name: string;
  @IsUUID() departmentId: string;
  /** Ligação opcional a um curso. */
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10) courseYear?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(2) semesterNumber?: number;
}

export class LinkSubjectDto {
  @IsUUID() courseId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(10) courseYear: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(2) semesterNumber: number;
}

export class CreateTeacherDto {
  @Transform(trim) @IsString() @Length(3, 120) name: string;
  @IsUUID() departmentId: string;
}

export class TeacherSubjectsDto { @IsArray() @ArrayMaxSize(100) @IsUUID(undefined, { each: true }) subjectIds: string[]; }

export class InviteTeacherDto { @Transform(lower) @IsEmail() @MaxLength(160) email: string; }

export class UsersQueryDto {
  @IsOptional() @IsIn(['STUDENT', 'TEACHER', 'ADMIN']) role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0;
}

export class UserStatusDto { @IsIn(['ACTIVE', 'SUSPENDED']) status: 'ACTIVE' | 'SUSPENDED'; }

export class CommentsQueryDto {
  @IsOptional() @IsIn(['PUBLISHED', 'BLOCKED', 'PENDING_REVIEW', 'HIDDEN', 'REMOVED']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0;
}
export class CommentStatusDto { @IsIn(['PUBLISHED', 'HIDDEN', 'REMOVED']) status: 'PUBLISHED' | 'HIDDEN' | 'REMOVED'; }

export class ReportsQueryDto {
  @IsOptional() @IsIn(['OPEN', 'RESOLVED', 'DISMISSED']) status?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0;
}
export class ReportResolveDto {
  @IsIn(['RESOLVED', 'DISMISSED']) status: 'RESOLVED' | 'DISMISSED';
  /** Ao resolver pode ocultar logo o comentário denunciado. */
  @IsOptional() @IsBoolean() hideComment?: boolean;
}

export class AuditQueryDto { @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0; }
