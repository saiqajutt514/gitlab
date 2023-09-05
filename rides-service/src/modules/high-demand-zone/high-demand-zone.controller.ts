import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import {
  CREATE_HIGH_DEMAND_ZONE,
  DELETE_HIGH_DEMAND_ZONE,
  FIND_ALL_HIGH_DEMAND_ZONE,
  GET_LIST_OF_USERS_IN_THIS_ZONE,
} from '../customer/kafka-constants';
import { HighDemandZoneService } from './high-demand-zone.service';

@Controller()
export class HighDemandZoneController {
  private logger = new Logger(HighDemandZoneController.name);

  constructor(private readonly highDemandZoneService: HighDemandZoneService) {}

  @MessagePattern(CREATE_HIGH_DEMAND_ZONE, Transport.TCP)
  async create(@Payload() message) {
    this.logger.log(
      `kafka::demand-zone::${CREATE_HIGH_DEMAND_ZONE}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    return await this.highDemandZoneService.create(message);
  }

  @MessagePattern(DELETE_HIGH_DEMAND_ZONE, Transport.TCP)
  async remove(@Payload() message) {
    this.logger.log(
      `kafka::demand-zone::${DELETE_HIGH_DEMAND_ZONE}::recv -> ${message}`,
    );
    message = JSON.parse(message).id;
    return await this.highDemandZoneService.remove(message);
  }

  @MessagePattern(FIND_ALL_HIGH_DEMAND_ZONE, Transport.TCP)
  async findAll(@Payload() payload) {
    this.logger.log(`kafka::trip::${FIND_ALL_HIGH_DEMAND_ZONE}::recv ->`);

    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::demand-zone::${FIND_ALL_HIGH_DEMAND_ZONE}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );

    return await this.highDemandZoneService.findAll(message.value);
  }
  @MessagePattern(GET_LIST_OF_USERS_IN_THIS_ZONE, Transport.TCP)
  async getAllAdminHZD(@Payload() message) {
    this.logger.log(
      `kafka::demand-zone::${GET_LIST_OF_USERS_IN_THIS_ZONE}::recv -> ${message}`,
    );
    message = JSON.parse(message);
    return await this.highDemandZoneService.getAllAdminHZD(message);
  }
}
