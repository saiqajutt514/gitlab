import { PartialType } from "@nestjs/mapped-types";
import { CreateCabTypeDto } from "./create-cab-type.dto";

export class UpdateCabTypeDto extends PartialType(CreateCabTypeDto) {}
