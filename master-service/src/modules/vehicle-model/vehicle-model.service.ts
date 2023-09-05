import { Injectable, Logger, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { VehicleModelRepository } from './repositories/vehicle-model.repository';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { RedisHandler } from 'src/helpers/redis-handler';
import {
  AddVehicleModelDto,
  UpdateVehicleModelDto,
} from './dto/vehicle-model.dto';
import { VehicleMakerRepository } from '../vehicle-maker/repositories/vehicle-maker.repository';
import { ClientProxy } from '@nestjs/microservices';
import {
  GET_CAB_TYPE_DETAIL,
  UPDATE_CAB_ID,
} from 'src/constants/kafka-constant';
import { errorMessage } from 'src/constants/error-message-constant';

@Injectable()
export class VehicleModelService {
  private readonly logger = new LoggerHandler(
    VehicleModelService.name,
  ).getInstance();

  constructor(
    @InjectRepository(VehicleModelRepository)
    private vehicleModelRepository: VehicleModelRepository,
    @InjectRepository(VehicleMakerRepository)
    private vehicleMakerRepository: VehicleMakerRepository,
    @Inject('CLIENT_CAPTAIN_SERVICE_TCP')
    private clientCaptainTCP: ClientProxy,
  ) {}

  async addVehicleModel(body: AddVehicleModelDto) {
    try {
      const response = this.vehicleModelRepository.create({
        model: body.model,
        modelEnglish: body?.modelEnglish,
        makerId: body.makerId,
      });
      this.logger.log(`addVehicleModel -> ${JSON.stringify(response)}`);
      await this.vehicleModelRepository.save(response);
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`addVehicleModel -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAllUnAssigned() {
    try {
      const fields = [
        'vehiclemodels.id',
        'vehiclemodels.makerId',
        'vehiclemodels.model',
        'vehiclemodels.modelEnglish',
        'vehiclemodels.cabTypeId',
        'vehiclemodels.cabTypeName',
        'maker.makerEnglish',
        'maker.maker',
        'vehiclemodels.createdAt',
        'vehiclemodels.updatedAt',
      ];

      const vehicleModelInstance =
        this.vehicleModelRepository.createQueryBuilder('vehiclemodels');
      vehicleModelInstance.select(fields);
      vehicleModelInstance.where('vehiclemodels.cabTypeId IS NULL');
      vehicleModelInstance.leftJoin('vehiclemodels.maker', 'maker');

      const [result, total] = await vehicleModelInstance.getManyAndCount();

      this.logger.debug('[findAllUnAssigned] get list with count: ' + total);
      return ResponseHandler.success({ result, total });
    } catch (err) {
      this.logger.error('[findAllUnAssigned] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
  async findOne(model: string) {
    try {
      const vehicleMakerInstance =
        this.vehicleMakerRepository.createQueryBuilder('vehiclemakers');
      vehicleMakerInstance.where('vehiclemakers.model LIKE :model', {
        model: `%${model}%`,
      });
      const result = await vehicleMakerInstance.getOne();
      if (result) {
        return ResponseHandler.success(result);
      } else {
        return ResponseHandler.error(HttpStatus.NOT_FOUND);
      }
    } catch (err) {
      this.logger.error('[findOne] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findAll() {
    try {
      const fields = [
        'vehiclemodels.id',
        'vehiclemodels.makerId',
        'vehiclemodels.model',
        'vehiclemodels.modelEnglish',
        'vehiclemodels.cabTypeId',
        'vehiclemodels.cabTypeName',
        'maker.makerEnglish',
        'vehiclemodels.createdAt',
        'vehiclemodels.updatedAt',
      ];

      const makerFields = [
        'vehiclemakers.id',
        'vehiclemakers.maker',
        'vehiclemakers.makerEnglish',
        'vehiclemakers.createdAt',
        'vehiclemakers.updatedAt',
      ];

      const vehicleModelInstance =
        this.vehicleModelRepository.createQueryBuilder('vehiclemodels');
      vehicleModelInstance.select(fields);
      vehicleModelInstance.innerJoin('vehiclemodels.maker', 'maker');
      const [result, total] = await vehicleModelInstance.getManyAndCount();
      const vehicleMakerInstance =
        this.vehicleMakerRepository.createQueryBuilder('vehiclemakers');
      vehicleMakerInstance.select(makerFields);
      vehicleMakerInstance.where('vehiclemakers.status = :status', {
        status: 1,
      });
      const [makerResult, makerTotal] =
        await vehicleMakerInstance.getManyAndCount();
      const totalCount: number = total;
      const models: any = result;
      const totalMakerCount: number = makerTotal;
      const makers: any = makerResult;
      this.logger.debug('[findAll] get list with count: ' + totalCount);
      return ResponseHandler.success({ models, makers, totalCount });
    } catch (err) {
      this.logger.error('[findAll] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async findVehicleModelInfo(params) {
    try {
      const vehicleModelInstance =
        this.vehicleModelRepository.createQueryBuilder('vehiclemodels');
      vehicleModelInstance.select([
        'vehiclemodels.id',
        'vehiclemodels.modelEnglish',
        'vehiclemodels.cabTypeId',
      ]);
      vehicleModelInstance.where('vehiclemodels.model = :model', {
        model: params.vehicleModel,
      });
      let modelResult;
      modelResult = await vehicleModelInstance.getOne();
      if (!modelResult?.id) {
        //creating maker
        await this.addVehicleModel({
          model: params.vehicleModel,
          makerId: params?.vehicleMakerId,
        });
      }

      this.logger.debug(
        '[findVehicleModelInfo] get list: ' + JSON.stringify(modelResult),
      );
      return ResponseHandler.success(modelResult);
    } catch (err) {
      this.logger.error('[findVehicleMaterInfo] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  async updateVehicleModel(body: UpdateVehicleModelDto) {
    try {
      this.logger.log(`updateVehicleModel -> ${JSON.stringify(body)}`);
      const { id, cabTypeId } = body;
      let updateBody: any = {
        ...body,
      };
      let cabResp;
      if (cabTypeId) {
        cabResp = await this.clientCaptainTCP
          .send(GET_CAB_TYPE_DETAIL, JSON.stringify({ id: cabTypeId }))
          .pipe()
          .toPromise();
        if (cabResp.statusCode != HttpStatus.OK) {
          this.logger.error(
            `[updateVehicleModel] invalid cabTypeId, Resp: ${JSON.stringify(
              cabResp,
            )}`,
          );
          return ResponseHandler.error(
            HttpStatus.BAD_REQUEST,
            errorMessage.INVALIDE_CAB_ID,
          );
        }
      }
      await this.vehicleModelRepository.update(id, updateBody);
      const response = await this.vehicleModelRepository.findOne({ id });

      if (cabResp.statusCode == HttpStatus.OK) {
        await this.clientCaptainTCP
          .send(
            UPDATE_CAB_ID,
            JSON.stringify({ model: response.model, cabId: cabTypeId }),
          )
          .pipe()
          .toPromise();
      }
      return ResponseHandler.success(response);
    } catch (err) {
      this.logger.error(`updateVehicleModel -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
  //TODO
  // async updateCabType(){

  // }
  async deleteVehicleModel(id: string) {
    try {
      this.logger.log(`deleteVehicleModel -> ${id}`);
      const response = await this.vehicleModelRepository.delete({ id });
      return ResponseHandler.success({});
    } catch (err) {
      this.logger.error(`deleteVehicleModel -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }
}
