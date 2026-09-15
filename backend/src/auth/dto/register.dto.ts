import { IsEmail, IsString, MinLength, IsBoolean, IsOptional, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsPhoneNumber('MZ')
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isProcurador?: boolean;

  @IsOptional()
  @IsBoolean()
  isAnunciante?: boolean;

  @IsBoolean()
  acceptedTerms: boolean;
}