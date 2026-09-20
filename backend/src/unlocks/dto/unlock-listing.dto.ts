import { IsString, IsNotEmpty } from 'class-validator';

export class UnlockListingDto {
  @IsString()
  @IsNotEmpty()
  payerPhone: string;
}