import { Body, Controller, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { PromoCodeDto } from './dto/promo-code.dto';
import { PromoCodeService } from './promo-code.service';

@Controller('promo-code')
export class PromoCodeController {

  constructor(
    private promoCodeService: PromoCodeService
  ) { }

  @Post('validate')
  @UsePipes(ValidationPipe)
  async validatePromoCode(@Body() validateCode: PromoCodeDto, @Req() request) {
    const userId: string = request?.user?.id
    const response = await this.promoCodeService.validatePromoCode({ ...validateCode, userId })
    return ResponseHandler(response)
  }

}
