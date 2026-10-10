import { IsString, IsNotEmpty } from 'class-validator';

export class PublishListingDto {
  @IsString()
  @IsNotEmpty()
  payerPhone: string;
}