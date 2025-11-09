import { IsNumber, IsObject, IsString } from "class-validator";
import { Prisma } from "../../../../prisma/generated/prisma/client";

export class CreateDisheDto {
    @IsString()
    name: string;
    @IsString()
    description: string;
    @IsNumber()
    coste: number;
    @IsNumber()
    price: number;
    @IsNumber()
    stock: number;
    @IsObject()
    content: Record<string, any>;
}
