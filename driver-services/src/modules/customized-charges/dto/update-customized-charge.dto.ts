import { PartialType } from "@nestjs/mapped-types";
import { CreateCustomizedChargeDto } from "./create-customized-charge.dto";

export class UpdateCustomizedChargeDto extends PartialType(
  CreateCustomizedChargeDto
) {}
