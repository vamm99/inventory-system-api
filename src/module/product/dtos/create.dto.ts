import { IsDate, IsNumber, IsString, Min } from "class-validator";
import { Unit } from "../../../../prisma/generated/prisma";
import { Type } from "class-transformer";

export class CreateProductDto {
    @IsNumber()
    providerId: number;
    @IsString()
    barcode: string;
    @IsString()
    name: string;
    @IsString()
    description: string;
    @IsNumber()
    categoryId: number;
    @IsNumber()
    @Min(0)
    coste: number;
    @IsNumber()
    @Min(0)
    price: number;
    @IsNumber()
    @Min(0)
    stock: number;
    @IsString()
    unit: Unit;
    @IsDate()
    @Type(() => Date)
    expiredAt: Date;
}
