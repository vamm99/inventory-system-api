import { PartialType } from "@nestjs/mapped-types";
import { CreateProviderDto } from "./create.dto";

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}