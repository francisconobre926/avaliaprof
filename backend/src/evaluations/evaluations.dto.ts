import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { PartialScoresDto, ScoresDto } from './scores.dto';

export class CreateEvaluationDto {
  /** Gerado no dispositivo: torna o envio idempotente (sincronização offline). */
  @IsUUID() clientId: string;
  @IsUUID() teacherId: string;
  @IsUUID() courseSubjectId: string;
  @ValidateNested() @Type(() => ScoresDto) scores: ScoresDto;
  /** Limite largo só para proteger o servidor; o limite funcional (500) é aplicado pela moderação. */
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}

export class UpdateEvaluationDto {
  @IsOptional() @ValidateNested() @Type(() => PartialScoresDto) scores?: PartialScoresDto;
  /** `null` apaga o comentário; texto substitui-o (volta a ser moderado). */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(2000) comment?: string | null;
  /** Versão que o cliente viu; se já mudou no servidor devolve 409 (conflito). */
  @IsOptional() @IsInt() @Min(1) version?: number;
}

export class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) page?: number = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number = 10;
  @IsOptional() @IsUUID() subjectId?: string;
}

/** Uma operação da fila offline do dispositivo. O servidor decide cada uma pela sua hora e regras (R-4). */
export class SyncOpDto {
  @IsIn(['create', 'update', 'delete']) op: 'create' | 'update' | 'delete';
  /** create: identificador gerado no dispositivo (idempotência). */
  @ValidateIf((o) => o.op === 'create') @IsUUID() clientId?: string;
  @ValidateIf((o) => o.op === 'create') @IsUUID() teacherId?: string;
  @ValidateIf((o) => o.op === 'create') @IsUUID() courseSubjectId?: string;
  @ValidateIf((o) => o.op === 'create') @ValidateNested() @Type(() => ScoresDto) scores?: ScoresDto;
  /** update/delete: avaliação alvo. */
  @ValidateIf((o) => o.op !== 'create') @IsUUID() evaluationId?: string;
  @IsOptional() @ValidateNested() @Type(() => PartialScoresDto) patch?: PartialScoresDto;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(2000) comment?: string | null;
  @IsOptional() @IsInt() @Min(1) version?: number;
}

export class SyncDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => SyncOpDto) operations: SyncOpDto[];
}
