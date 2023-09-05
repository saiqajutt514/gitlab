import { IsEnum, IsNotEmpty } from "class-validator";

import { PaginationCommonDto } from "./pagination.dto";
import { EARNING_DURATION } from "../captain.enum";

export class SubscriptionEarningDto extends PaginationCommonDto {
  @IsNotEmpty()
  @IsEnum(EARNING_DURATION)
  duration: EARNING_DURATION;
}
