import { IsOptional, IsString } from "class-validator";

export class ShareDto {
    @IsString()
    @IsOptional()
    barcode?: string;
    @IsString()
    @IsOptional()
    name?: string;
}
