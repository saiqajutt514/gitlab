import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  UsePipes,
  ValidationPipe,
  Param,
  Post,
  Body,
} from '@nestjs/common';

import { AdminService } from '../admin/admin.service';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { GetCabTypeQueryDto } from './dto/get-cab-type.dto';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { CaptainService } from './captains.services';
import { ShowSelectedVehicleDetailsForAppDto } from '../admin/dto/rar.dto';

@Controller('master')
export class MasterController {
  private readonly logger = new LoggerHandler(
    MasterController.name,
  ).getInstance();
  constructor(
    private readonly captainService: CaptainService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  // Cab Types
  @Get('cab-type/all')
  async findAll(@Query() query: GetCabTypeQueryDto) {
    try {
      this.logger.log(`cab-type/all -> query -> ${JSON.stringify(query)}`);
      const result = await this.captainService.getAllCabTypes(query);
      this.logger.log(`cab-type/all -> result -> ${JSON.stringify(result)}`);
      if (result.statusCode == HttpStatus.OK && result.data) {
        let resultData = result.data;
        if (result.data.cabs) {
          resultData = result.data.cabs;
        }
        await Promise.all(
          resultData.map(async (record, idx) => {
            if (record?.categoryIcon) {
              resultData[
                idx
              ].categoryIcon = await this.awsS3Service.getCabTypeFile({
                name: record?.categoryIcon,
              });
            }
          }),
        );
        if (result.data.cabs) {
          result.data.cabs = resultData;
        } else {
          result.data = resultData;
        }
      } else {
        this.logger.error(`cab-type/all -> ${JSON.stringify(result)}`);
      }
      return ResponseHandler(result);
    } catch (err) {
      return false;
    }
  }

  @Get('setting/:name')
  @UsePipes(ValidationPipe)
  async getSingleSetting(@Param('name') name: string) {
    const response = await this.captainService.getSetting(name);
    return ResponseHandler(response);
  }

  //A1 Show list of vehicle in apps
  @Get('rar-appfindall')
  async showSelectMenuForApp() {
    try {
      this.logger.log(
        `showSelectMenuForApp -> query -> ${JSON.stringify('no query passed')}`,
      );

      const result = await this.captainService.showSelectMenuForApp();

      // This code below will attach photo.
      if (result.statusCode == HttpStatus.OK && result.data) {
        let resultData = result.data;
        await Promise.all(
          resultData.map(async (record, idx) => {
            if (record?.inventoryIcon) {
              resultData[
                idx
              ].inventoryIconUrl = await this.awsS3Service.getInventoryIcon({
                name: record?.model.modelEnglish + record?.modelYear,
              });
            }
          }),
        );
        result.data = resultData;
      }
      return ResponseHandler(result);
    } catch (err) {
      return false;
    }
  }

  //A2 show selected vehicle details.
  @Post('rar-appselect')
  async getSelectedVehicleDetailsForApp(
    @Body() body: ShowSelectedVehicleDetailsForAppDto,
  ) {
    try {
      this.logger.log(
        `getSelectedVehicleDetailsForApp -> param -> ${JSON.stringify(body)}`,
      );
      const result = await this.captainService.getSelectedVehicleDetailsForApp(
        body,
      );

      //this code below will attach photo
      if (result.statusCode == HttpStatus.OK && result.data) {
        let record = result.data;
        if (record?.inventoryIcon) {
          record.inventoryIconUrl = await this.awsS3Service.getInventoryIcon({
            name: record?.model.modelEnglish + record?.modelYear,
          });
        }
        result.data = record;
      }
      return ResponseHandler(result);
    } catch (er) {
      return false;
    }
  }
}
