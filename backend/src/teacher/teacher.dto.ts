import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ReplyDto {
  @Transform(trim) @IsString() @Length(2, 500) text: string;
}

export class CreateSessionDto {
  @IsUUID() courseSubjectId: string;
  /** Opcional: restringe a sessão a uma turma. */
  @IsOptional() @IsUUID() classGroupId?: string;
  /** Duração em minutos a contar de agora. */
  @Type(() => Number) @IsInt() @Min(5) @Max(240) minutes: number;
}
