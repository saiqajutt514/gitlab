import { Controller } from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import {
  ADD_CUSTOMIZED_CHARGE,
  DELETE_CUSTOMIZED_CHARGE,
  UPDATE_CUSTOMIZED_CHARGE,
  GET_ALL_CUSTOMIZED_CHARGES,
  GET_CUSTOMIZED_CHARGE,
} from "src/constants/kafka-constant";
import { LoggerHandler } from "src/helpers/logger-handler";
import { CustomizedChargeQueryParams } from "./customized-charges.interface";
import { CustomizedChargesService } from "./customized-charges.service";
import { CreateCustomizedChargeDto } from "./dto/create-customized-charge.dto";
import { UpdateCustomizedChargeDto } from "./dto/update-customized-charge.dto";

@Controller("customized-charges")
export class CustomizedChargesController {
  private readonly logger = new LoggerHandler(
    CustomizedChargesController.name
  ).getInstance();
  constructor(
    private readonly customizedChargesService: CustomizedChargesService
  ) {}

  @MessagePattern(ADD_CUSTOMIZED_CHARGE, Transport.TCP)
  async createEntry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::customized-charges::${ADD_CUSTOMIZED_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const rowData: CreateCustomizedChargeDto = message.value;
    return await this.customizedChargesService.create(rowData);
  }

  @MessagePattern(UPDATE_CUSTOMIZED_CHARGE, Transport.TCP)
  async updateEntry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::customized-charges::${UPDATE_CUSTOMIZED_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    const rowData: UpdateCustomizedChargeDto = message.value?.data;
    return await this.customizedChargesService.update(id, rowData);
  }

  @MessagePattern(DELETE_CUSTOMIZED_CHARGE, Transport.TCP)
  async deleteEntry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::customized-charges::${DELETE_CUSTOMIZED_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.customizedChargesService.remove(id);
  }

  @MessagePattern(GET_ALL_CUSTOMIZED_CHARGES, Transport.TCP)
  async getAllEntries(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::customized-charges::${GET_ALL_CUSTOMIZED_CHARGES}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const params: CustomizedChargeQueryParams = message.value?.query;
    return await this.customizedChargesService.findAll(params);
  }

  @MessagePattern(GET_CUSTOMIZED_CHARGE, Transport.TCP)
  async getEntry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::customized-charges::${GET_CUSTOMIZED_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.customizedChargesService.findOne(id);
  }
}
