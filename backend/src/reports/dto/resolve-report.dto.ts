import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ResolveReportDto {
  /** true = denúncia procedente (suspende o anúncio); false = improcedente */
  @IsBoolean()
  upheld: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}