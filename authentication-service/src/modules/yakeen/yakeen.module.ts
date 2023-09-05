import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarInfoBySequence } from './entities/CarInfoBySequence.entity';
import { getAlienAddressInfoByIqama } from './entities/getAlienAddressInfoByIqama.entity';
import { getAlienDLInfoByIqama } from './entities/getAlienDLInfoByIqama.entity';
import { getAlienInfoByIqama2 } from './entities/getAlienInfoByIqama2.entity';
import { getCitizenAddressInfo } from './entities/getCitizenAddressInfo.entity';
import { getCitizenDLInfo } from './entities/getCitizenDLInfo.entity';
import { getCitizenInfo2 } from './entities/getCitizenInfo2.entity';
import { YakeenController } from './yakeen.controller';
import { YakeenService } from './yakeen.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CarInfoBySequence,
      getAlienAddressInfoByIqama,
      getAlienDLInfoByIqama,
      getCitizenAddressInfo,
      getCitizenDLInfo,
      getCitizenInfo2,
      getAlienInfoByIqama2,
    ]),
  ],
  controllers: [YakeenController],
  providers: [YakeenService],
  exports: [YakeenService],
})
export class YakeenModule {}
