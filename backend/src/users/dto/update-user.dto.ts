import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { AdvertiserType, ContactChannel } from '@prisma/client';

const PHONE_REGEX = /^\+?[0-9]{9,15}$/;
const PHONE_MESSAGE = 'Número de telefone inválido.';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  phone?: string;

  @IsOptional()
  @Matches(PHONE_REGEX, { message: PHONE_MESSAGE })
  alternatePhone?: string;

  @IsOptional()
  @IsEnum(AdvertiserType)
  advertiserType?: AdvertiserType;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsEnum(ContactChannel, { each: true })
  contactChannels?: ContactChannel[];
}