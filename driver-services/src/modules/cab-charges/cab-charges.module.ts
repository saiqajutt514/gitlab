import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CabChargesController } from "./cab-charges.controller";
import { CabChargesRepository } from "./cab-charges.repository";
import { CabChargesService } from "./cab-charges.service";
import { CountryRepository } from "./country.repository";
import { CityRepository } from "./city.repository";
import { RedisHandler } from "src/helpers/redis-handler";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CabChargesRepository,
      CountryRepository,
      CityRepository,
    ]),
  ],
  controllers: [CabChargesController],
  providers: [CabChargesService, RedisHandler],
})
export class CabChargesModule {}
