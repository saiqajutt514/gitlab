import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { promoRequestPatterns, VALIDATE_PROMO_CODE } from './kafka-constants';
import {
  promoCodesKafkaMicroServiceConfig,
  promoCodesTCPMicroServiceConfig,
} from 'src/microServiceConfigs';
import { PromoCodeDto, UserIdDto } from './dto/promo-code.dto';

@Injectable()
export class PromoCodeService implements OnModuleInit {
  // @Client(promoCodesKafkaMicroServiceConfig)
  // promoCodesKafkaClient: ClientKafka;

  @Client(promoCodesTCPMicroServiceConfig)
  promoCodesTcpClient: ClientProxy;

  onModuleInit() {
    // promoRequestPatterns.forEach(pattern => {
    //   this.promoCodesKafkaClient.subscribeToResponseOf(pattern);
    // });
  }

  async validatePromoCode(promoCodeDto: PromoCodeDto & UserIdDto) {
    console.log(promoCodeDto);
    return await this.promoCodesTcpClient
      .send(VALIDATE_PROMO_CODE, JSON.stringify(promoCodeDto))
      .pipe()
      .toPromise();
  }
}
