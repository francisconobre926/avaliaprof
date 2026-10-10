import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestVerificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}