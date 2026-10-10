import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSearchRequestDto } from './create-search-request.dto';

export class UpdateSearchRequestDto extends CreateSearchRequestDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}