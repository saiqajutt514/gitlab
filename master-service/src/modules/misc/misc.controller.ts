import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import {
  SYNC_SETTINGS,
  GET_ALL_SETTING,
  GET_SETTING,
  UPDATE_SETTING,
  NEW_UPDATE_SETTING,
} from 'src/constants/kafka-constant';
import { MiscService } from './misc.service';
import { SaveSettingDto } from './dto/setting.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { SettingListParams } from './interfaces/setting.interface';
import { ResponseHandler } from 'src/helpers/responseHandler';

@Controller('misc')
export class MiscController {
  private readonly logger = new LoggerHandler(
    MiscController.name,
  ).getInstance();
  constructor(private readonly miscService: MiscService) {}

  @MessagePattern(SYNC_SETTINGS)
  async syncSettingList() {
    this.logger.debug(`input::misc::${SYNC_SETTINGS}::recv`);
    return await this.miscService.syncSettings();
  }

  @MessagePattern(GET_ALL_SETTING, Transport.TCP)
  async getSettingList(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `input::misc::${GET_ALL_SETTING}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const params: SettingListParams = message.value;
    return await this.miscService.getAllSettings(params);
  }

  @MessagePattern(GET_SETTING, Transport.TCP)
  async getSettingDetail(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `input::misc::${GET_SETTING}::recv -> ${JSON.stringify(message.value)}`,
    );
    const name: string = message.value?.name;
    return await this.miscService.getSetting(name);
  }

  @MessagePattern(UPDATE_SETTING, Transport.TCP)
  async updateSettingList(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.debug(
      `input::misc::${UPDATE_SETTING}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    const name: string = message.value?.name;
    const data: SaveSettingDto = message.value?.data;
    return await this.miscService.updateSetting(name, data);
  }

  //for new design of master control by mujtaba
  @MessagePattern(NEW_UPDATE_SETTING, Transport.TCP)
  async newUpdateSettingList(@Payload() payload) {
    let data = JSON.parse(payload);
    this.logger.debug(
      `input::misc::${NEW_UPDATE_SETTING}::recv -> ${JSON.stringify(data)}`,
    );
    let responseArray = [];
    try {
      for (let i = 0; i < data.length; i++) {
        let res = await this.miscService.newUpdateSetting(data[i].name, {
          value: data[i].value,
        });
        responseArray.push(res);
      }
    } catch (err) {
      return ResponseHandler.error(404, err.message);
    }
    return ResponseHandler.success(responseArray);
  }
}
