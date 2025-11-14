import { IsNumber, IsString } from "class-validator";

export class ProductKardex {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  quantity: number;
}