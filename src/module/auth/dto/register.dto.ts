import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Role } from "../../../../prisma/generated/prisma";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsEmail()
    @IsNotEmpty()
    email: string;
    @IsString()
    @IsNotEmpty()
    password: string;
    role: Role;
}
