import { IsString, IsNotEmpty, Length } from 'class-validator';

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class TwoFactorLoginDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @Length(6, 6)
  code: string;
}