import { Type } from 'class-transformer';
import {
  IsOptional, IsString, IsEnum, IsNumber, IsBoolean, IsUUID, Min, Max,
} from 'class-validator';
import { ListingPurpose } from '@prisma/client';

export enum SortBy {
  RECENT = 'recent',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISTANCE = 'distance',
}

export class SearchListingsDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsString()
  province?: string;

  @IsOptional() @IsString()
  district?: string;

  @IsOptional() @IsString()
  city?: string;

  @IsOptional() @IsString()
  neighborhood?: string;

  @IsOptional() @IsUUID()
  categoryId?: string;

  @IsOptional() @IsEnum(ListingPurpose)
  purpose?: ListingPurpose;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  bedrooms?: number;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  hasWater?: boolean;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  hasElectricity?: boolean;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  hasWifi?: boolean;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  furnished?: boolean;

  @IsOptional() @Type(() => Boolean) @IsBoolean()
  hasParking?: boolean;

  // Pesquisa por proximidade ("perto de mim")
  @IsOptional() @Type(() => Number) @IsNumber()
  lat?: number;

  @IsOptional() @Type(() => Number) @IsNumber()
  lng?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0.1) @Max(100)
  radiusKm?: number;

  @IsOptional() @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RECENT;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50)
  limit?: number = 20;
}