import { Controller, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import {
  NOTIFY_TRIP_DETAIL,
  EMIT_TO_ADMIN_DASHBOARD,
} from './constants/kafka-list';
import { EventPattern, Payload, Transport } from '@nestjs/microservices';
import appConfig from 'config/appConfig';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  //KAFKA
  @EventPattern(NOTIFY_TRIP_DETAIL)
  notifyTripHandlers(@Payload() message) {
    Logger.log(
      `kafka::socket::${NOTIFY_TRIP_DETAIL}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    this.appService.notifyTripDetailToSocket(message.value);
  }

  @EventPattern(EMIT_TO_ADMIN_DASHBOARD)
  emitToAdminDashboardHandlers(@Payload() message) {
    Logger.log(
      `kafka::socket::${EMIT_TO_ADMIN_DASHBOARD}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    this.appService.emitToAdminDashboard(message.value);
  }
  // /// TCP
  // @EventPattern(NOTIFY_TRIP_DETAIL, Transport.TCP)
  // notifyTripHandlersWithTCP(@Payload() message) {
  //   if (appConfig().transportType == 2) {
  //     Logger.log(
  //       `TCP::socket::${NOTIFY_TRIP_DETAIL}::recv -> ${JSON.stringify(
  //         message.value,
  //       )}`,
  //     );
  //     this.appService.notifyTripDetailToSocket(message.value);
  //   }
  // }
  // @EventPattern(EMIT_TO_ADMIN_DASHBOARD, Transport.TCP)
  // emitToAdminDashboardHandlersTC(@Payload() message) {
  //   if (appConfig().transportType == 2) {
  //     Logger.log(
  //       `TCP::socket::${EMIT_TO_ADMIN_DASHBOARD}::recv -> ${JSON.stringify(
  //         message.value,
  //       )}`,
  //     );
  //     this.appService.emitToAdminDashboard(message.value);
  //   }
  // }
}
