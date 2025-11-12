import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateBarcodeDto {
  @IsOptional()
  @IsString()
  @Length(13, 13)
  barcode?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
