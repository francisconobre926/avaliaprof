import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ApplyReferralDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 16)
  code: string;
}