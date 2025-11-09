import { IsEmail, IsOptional, IsString } from "class-validator";

export class SheareDto {
    @IsString()
    @IsOptional()
    name?: {};
    @IsString()
    @IsOptional()
    email?: {};
    @IsString()
    @IsOptional()
    phone?: {};
}  
    
