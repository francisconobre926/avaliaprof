import { IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** O curso, o número e o email vêm do cadastro do administrador: o próprio utilizador não os altera. */
export class UpdateMeDto {
  @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @Length(3, 100) name?: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(72) currentPassword: string;
  @IsString() @MinLength(8) @MaxLength(72) @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'A senha deve ter pelo menos uma letra e um número.' }) newPassword: string;
}
