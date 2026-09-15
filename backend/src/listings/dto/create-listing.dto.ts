import {
  IsString, IsEnum, IsNumber, IsOptional, IsBoolean,
  MinLength, Min, IsUUID,
} from 'class-validator';
import { ListingPurpose } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @MinLength(5)
  title: string;

  @IsEnum(ListingPurpose)
  purpose: ListingPurpose;

  @IsUUID()
  categoryId: string;

  @IsString()
  @MinLength(20)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  pricePeriod?: string;

  @IsString()
  province: string;

  @IsString()
  district: string;

  @IsString()
  city: string;

  @IsString()
  neighborhood: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  exactLocationAfterUnlock?: boolean;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWater?: boolean;

  @IsOptional()
  @IsBoolean()
  hasElectricity?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @IsOptional()
  @IsBoolean()
  hasParking?: boolean;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  availability?: string;
}