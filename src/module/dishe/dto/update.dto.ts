import { PartialType } from "@nestjs/mapped-types";
import { CreateDisheDto } from "./create.dto";

export class UpdateDisheDto extends PartialType(CreateDisheDto) {}