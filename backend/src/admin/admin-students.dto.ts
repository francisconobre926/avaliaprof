import { Type, Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray } from 'class-validator';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min } from 'class-validator';
import { ClassRegime, EnrollmentStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const NUMERO = /^[A-Za-z0-9]{4,20}$/;

export class CreateStudentDto {
  @Transform(trim) @IsString() @Length(3, 100) name: string;
  @Transform(trim) @Matches(NUMERO, { message: 'Número de estudante inválido.' }) studentNumber: string;
  @Transform(lower) @IsEmail() @MaxLength(160) email: string;
  @IsUUID() courseId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(10) courseYear: number;
  @IsUUID() semesterId: string;
  @IsUUID() classGroupId: string;
  @IsOptional() @IsEnum(EnrollmentStatus) status?: EnrollmentStatus;
}

export class UpdateStudentDto {
  @IsOptional() @Transform(trim) @IsString() @Length(3, 100) name?: string;
  @IsOptional() @Transform(trim) @Matches(NUMERO, { message: 'Número de estudante inválido.' }) studentNumber?: string;
  @IsOptional() @Transform(lower) @IsEmail() @MaxLength(160) email?: string;
  /** Para mudar de turma envia os quatro campos; o servidor confirma que são coerentes. */
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10) courseYear?: number;
  @IsOptional() @IsUUID() semesterId?: string;
  @IsOptional() @IsUUID() classGroupId?: string;
  @IsOptional() @IsEnum(EnrollmentStatus) status?: EnrollmentStatus;
}

export class EnrollmentStatusDto {
  @IsEnum(EnrollmentStatus) status: EnrollmentStatus;
  /** Semestre da matrícula; por defeito o corrente. */
  @IsOptional() @IsUUID() semesterId?: string;
}

export class StudentsQueryDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() classGroupId?: string;
  @IsOptional() @IsUUID() semesterId?: string;
  @IsOptional() @IsEnum(EnrollmentStatus) status?: EnrollmentStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number = 15;
}

export class AddSubjectDto {
  @IsUUID() courseSubjectId: string;
  @IsOptional() @IsUUID() semesterId?: string;
}

export class CreateClassGroupDto {
  @IsUUID() courseId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(10) courseYear: number;
  @IsUUID() semesterId: string;
  /** O nome é gerado pelo servidor (ex.: Info4Lab2L) a partir do curso, ano, semestre e regime. */
  @IsEnum(ClassRegime) regime: ClassRegime;
}

export class ClassGroupsQueryDto {
  @IsOptional() @IsUUID() semesterId?: string;
  @IsOptional() @IsUUID() courseId?: string;
}

export class AddStudentsToGroupDto {
  /** Estudantes a passar para esta turma (um ou vários). Todos têm de cumprir as regras, senão nada é alterado. */
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ArrayUnique() @IsUUID('all', { each: true }) studentIds: string[];
}

export class CandidatesQueryDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number = 30;
}
