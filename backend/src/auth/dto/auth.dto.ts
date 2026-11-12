import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

const SENHA_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const SENHA_MSG = 'A senha deve ter pelo menos uma letra e um número.';

export class RegisterDto {
  @Transform(trim) @Matches(/^[A-Za-z0-9]{4,20}$/, { message: 'Número de estudante inválido.' }) studentNumber: string;
  @Transform(lower) @IsEmail() @MaxLength(160) email: string;
  @IsString() @MinLength(8) @MaxLength(72) @Matches(SENHA_REGEX, { message: SENHA_MSG }) password: string;
}

export class LoginDto {
  @Transform(lower) @IsEmail() email: string;
  @IsString() @MaxLength(72) password: string;
}

export class ForgotDto {
  @Transform(lower) @IsEmail() email: string;
}

export class ResetDto {
  @Transform(lower) @IsEmail() email: string;
  @Transform(trim) @Matches(/^\d{6}$/, { message: 'Código inválido.' }) code: string;
  @IsString() @MinLength(8) @MaxLength(72) @Matches(SENHA_REGEX, { message: SENHA_MSG }) newPassword: string;
}

export class ActivateTeacherDto {
  @Transform(lower) @IsEmail() email: string;
  @Transform(trim) @Matches(/^[A-Z0-9]{8}$/, { message: 'Código de convite inválido.' }) code: string;
  @IsString() @MinLength(8) @MaxLength(72) @Matches(SENHA_REGEX, { message: SENHA_MSG }) password: string;
}

export class RefreshDto {
  @IsString() @MinLength(20) @MaxLength(200) refreshToken: string;
}

export class LogoutDto {
  @IsOptional() @IsString() @MaxLength(200) refreshToken?: string;
}
