import { IsEnum, IsNotEmpty } from "class-validator";

import { PaginationCommonDto } from "src/helpers/dto/pagination.dto";
import { EARNING_DURATION } from "../enum";

export class SubscriptionEarningDto extends PaginationCommonDto {

    @IsNotEmpty()
    @IsEnum(EARNING_DURATION)
    duration: EARNING_DURATION;
}