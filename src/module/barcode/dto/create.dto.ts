import { IsString, Length, IsOptional } from 'class-validator';

export class CreateBarcodeDto {
  @IsString()
  @Length(13, 13, { message: 'El código EAN-13 debe tener 13 dígitos' })
  barcode: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
