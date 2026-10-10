import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewVerificationDto {
  /** true = aprova e atribui o selo; false = rejeita */
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}