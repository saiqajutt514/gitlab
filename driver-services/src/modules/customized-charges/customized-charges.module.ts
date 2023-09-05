import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RedisHandler } from "src/helpers/redis-handler";
import { CustomizedChargesController } from "./customized-charges.controller";
import { CustomizedChargesRepository } from "./customized-charges.repository";
import { CustomizedChargesService } from "./customized-charges.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomizedChargesRepository])],
  controllers: [CustomizedChargesController],
  providers: [CustomizedChargesService, RedisHandler],
})
export class CustomizedChargesModule {}
