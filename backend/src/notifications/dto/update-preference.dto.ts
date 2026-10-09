import { IsEnum, IsBoolean } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class UpdatePreferenceDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsBoolean()
  enabled: boolean;
}