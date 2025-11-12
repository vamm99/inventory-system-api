import { IsNumber, IsOptional, IsString } from "class-validator";

export class SheareDto {
    @IsOptional()
    @IsNumber()
    id?: number;
    @IsOptional()
    @IsString()
    name?: string;
}