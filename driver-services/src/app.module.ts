import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { CaptainModule } from "./modules/captain/captain.module";
import { CabTypeModule } from "./modules/cab-type/cab-type.module";
import { CarInfoModule } from "./modules/car-info/car-info.module";
import { VehicleModule } from "./modules/vehicle/vehicle.module";
import { WASLModule } from "./modules/wasl/wasl.module";

import { typeOrmConfig } from "config/typeOrmConfig";
import { LoggerModule } from "nestjs-pino";
import { ScheduleModule } from "@nestjs/schedule";
import { CabChargesModule } from "./modules/cab-charges/cab-charges.module";
import { CustomizedChargesModule } from "./modules/customized-charges/customized-charges.module";

console.log("in app module", typeOrmConfig);
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ScheduleModule.forRoot(),
    CaptainModule,
    CabTypeModule,
    CabChargesModule,
    CustomizedChargesModule,
    CarInfoModule,
    VehicleModule,
    WASLModule,
    LoggerModule.forRoot({
      pinoHttp: {
        name: "captain-services",
        level: "debug",
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
