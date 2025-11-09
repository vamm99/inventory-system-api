import { IsOptional, IsString } from "class-validator";

export class ShareDto {
    @IsString()
    @IsOptional()
    name?: {};
}