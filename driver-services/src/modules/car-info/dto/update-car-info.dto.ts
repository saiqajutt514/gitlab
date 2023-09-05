import { PartialType } from "@nestjs/mapped-types";
import { CreateCarInfoDto } from "./create-car-info.dto";

export class UpdateCarInfoDto extends PartialType(CreateCarInfoDto) {}
