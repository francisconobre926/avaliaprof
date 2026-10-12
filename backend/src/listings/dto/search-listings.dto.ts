import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
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

// Um parâmetro de URL chega sempre como texto: "false" tem de dar false
const toBoolean = ({ value }: TransformFnParams): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value; // qualquer outra coisa é recusada pelo @IsBoolean
};

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

  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasWater?: boolean;

  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasElectricity?: boolean;

  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasWifi?: boolean;

  @IsOptional() @Transform(toBoolean) @IsBoolean()
  furnished?: boolean;

  @IsOptional() @Transform(toBoolean) @IsBoolean()
  hasParking?: boolean;

  // Pesquisa por proximidade ("perto de mim")
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90)
  lat?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  lng?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(100)
  radiusKm?: number;

  @IsOptional() @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RECENT;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(50)
  limit?: number = 20;
}