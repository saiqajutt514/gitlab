import { Module } from "@nestjs/common";
import { WASLService } from "./wasl.service";
import { WASLController } from "./wasl.controller";

@Module({
  providers: [WASLService],
  controllers: [WASLController],
  exports: [WASLService],
})
export class WASLModule {}
