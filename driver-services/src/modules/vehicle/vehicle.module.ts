import { Module } from "@nestjs/common";

import { VehicleService } from "./vehicle.service";
import { VehicleController } from "./vehicle.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { VehicleRepository } from "./vehicle.repository";

@Module({
  imports: [TypeOrmModule.forFeature([VehicleRepository])],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService],
})
export class VehicleModule {}
