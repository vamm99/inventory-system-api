import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateProviderDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsEmail()
    email?: string;
    @IsString()
    phone?: string;
    @IsString()
    address?: string;
}