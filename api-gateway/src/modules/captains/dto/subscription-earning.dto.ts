import { IsEnum, IsNotEmpty } from "class-validator";

import { PaginationCommonDto } from "src/helpers/dto/pagination";
import { EARNING_DURATION } from "../captain.enum";

export class subscriptionEarningDto extends PaginationCommonDto {

    @IsNotEmpty()
    @IsEnum(EARNING_DURATION)
    duration: EARNING_DURATION = EARNING_DURATION.TODAY;
}