import { PartialType } from "@nestjs/mapped-types";
import { CreateCabChargeDto } from "./create-cab-charge.dto";

export class UpdateCabChargeDto extends PartialType(CreateCabChargeDto) {}
