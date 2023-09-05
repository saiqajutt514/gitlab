import { Controller } from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import {
  CREATE_CAB_CHARGE,
  GET_CITIES,
  GET_COUNTRIES,
  UPDATE_CAB_CHARGE,
  DELETE_CAB_CHARGE,
  GET_ALL_CAB_CHARGES,
  ADD_COUNTRY,
  ADD_CITY,
  GET_CHARGE_CITIES,
  UPDATE_COUNTRY,
  UPDATE_CITY,
  DELETE_CITY,
} from "src/constants/kafka-constant";
import { LoggerHandler } from "src/helpers/logger-handler";
import { CabChargeQueryParams } from "./cab-charges.interface";
import { CabChargesService } from "./cab-charges.service";
import { CreateCabChargeDto } from "./dto/create-cab-charge.dto";
import { UpdateCabChargeDto } from "./dto/update-cab-charge.dto";

@Controller("cab-charges")
export class CabChargesController {
  private readonly logger = new LoggerHandler(
    CabChargesController.name
  ).getInstance();
  constructor(private readonly cabChargesService: CabChargesService) {}

  @MessagePattern(CREATE_CAB_CHARGE, Transport.TCP)
  async create(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::cab-charges::${CREATE_CAB_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const data: CreateCabChargeDto = message.value;
    return await this.cabChargesService.create(data);
  }

  @MessagePattern(UPDATE_CAB_CHARGE, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::captain::${UPDATE_CAB_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    const data: UpdateCabChargeDto = message.value?.data;
    return await this.cabChargesService.update(id, data);
  }

  @MessagePattern(DELETE_CAB_CHARGE, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::captain::${DELETE_CAB_CHARGE}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const id: string = message.value?.id;
    return await this.cabChargesService.remove(id);
  }

  @MessagePattern(GET_ALL_CAB_CHARGES, Transport.TCP)
  async getAllRows(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::captain::${GET_ALL_CAB_CHARGES}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    const params: CabChargeQueryParams = message.value?.query;
    return await this.cabChargesService.findAll(params);
  }

  @MessagePattern(GET_COUNTRIES, Transport.TCP)
  async getCountries() {
    this.logger.log(`tcp::getCountries::${GET_COUNTRIES}::recv`);
    return await this.cabChargesService.getCountries();
  }

  @MessagePattern(GET_CITIES, Transport.TCP)
  async getCities(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::getCities::${GET_CITIES}::recv -> ${JSON.stringify(message.value)}`
    );
    const { countryId, keyword } = message.value;
    return await this.cabChargesService.getCities(countryId, keyword);
  }

  @MessagePattern(ADD_COUNTRY, Transport.TCP)
  async addCountry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::addCountry::${ADD_COUNTRY}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.cabChargesService.addCountry(message.value);
  }

  @MessagePattern(UPDATE_COUNTRY, Transport.TCP)
  async updateCountry(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::updateCountry::${UPDATE_COUNTRY}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.cabChargesService.updateCountry(message.value);
  }

  @MessagePattern(ADD_CITY, Transport.TCP)
  async addCity(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::addCity::${ADD_CITY}::recv -> ${JSON.stringify(message.value)}`
    );
    return await this.cabChargesService.addCity(message.value);
  }

  @MessagePattern(UPDATE_CITY, Transport.TCP)
  async updateCity(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::updateCity::${UPDATE_CITY}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.cabChargesService.updateCity(message.value);
  }

  @MessagePattern(DELETE_CITY, Transport.TCP)
  async deleteCity(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::deleteCity::${DELETE_CITY}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.cabChargesService.deleteCity(message.value?.id);
  }

  @MessagePattern(GET_CHARGE_CITIES, Transport.TCP)
  async getRowList(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `tcp::cab-charges::${GET_CHARGE_CITIES}::recv -> ${JSON.stringify(
        message.value
      )}`
    );
    return await this.cabChargesService.getRowList();
  }
}
