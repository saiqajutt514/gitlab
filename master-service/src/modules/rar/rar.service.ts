import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Console, count } from 'console';
import e, { response } from 'express';
import { copyFile } from 'fs';
import { exit } from 'process';
import { async } from 'rxjs';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { getManager, Repository } from 'typeorm';
import { VehicleMakerRepository } from '../vehicle-maker/repositories/vehicle-maker.repository';
import { VehicleModelRepository } from '../vehicle-model/repositories/vehicle-model.repository';
import {
  ActivationDto,
  AddMakerModelInventoryDto,
  AddToInventoryDto,
  GetSelectedVehicleDetailsForAppDto,
  UpdateInventoryDto,
} from './dto/rar.dto';
import { VIRepo } from './repository/rar.repository';
import { InventoryListSort } from './enum/rar.enum';
import { ListSearchSortDto } from './interface/rar.interface';
import { iGetIsoDateTime } from 'src/helpers/date-functions';
var fs = require('fs');

@Injectable()
export class RarService {
  private readonly logger = new LoggerHandler(RarService.name).getInstance();

  constructor(
    @InjectRepository(VIRepo)
    private vIRepo: VIRepo,
    @InjectRepository(VehicleModelRepository)
    private vehicleModelRepository: VehicleModelRepository,
    @InjectRepository(VehicleMakerRepository)
    private vehicleMakerRepository: VehicleMakerRepository,
  ) {}

  //D1 this function doesnot check if modelId exist.
  async addToInventry(body: AddToInventoryDto) {
    let cloneSn = {};

    let allreadyExistSequencesNo = [];
    try {
      for (let index in body.sequenceNo) {
        //check if sequence allready exist
        let inventryFound = await this.vIRepo.findOne({
          where: { sequenceNo: body.sequenceNo[index] },
        });

        //make a object
        let cloneSn = { ...body, sequenceNo: body.sequenceNo[index] };
        console.log(cloneSn);
        // if sequence no allready exist than save it in array if not then save in db

        if (inventryFound != undefined) {
          allreadyExistSequencesNo.push(body.sequenceNo[index]);
        } else {
          await this.vIRepo.save(cloneSn);
        }
      }
      if (allreadyExistSequencesNo.length == body.sequenceNo.length) {
        return ResponseHandler.error(
          HttpStatus.FORBIDDEN,
          'All sequence number allready exist',
        );
      } else if (
        allreadyExistSequencesNo.length < body.sequenceNo.length &&
        allreadyExistSequencesNo.length != 0
      ) {
        return ResponseHandler.success(
          allreadyExistSequencesNo,
          'These sequence no allready exist so they are not saved other than this are saved.',
        );
      } else {
        return ResponseHandler.success({}, 'All sequence no are saved.');
      }
    } catch (err) {
      return ResponseHandler.error(err.message);
    }
  }

  //D2 This function add maker, model and vehicle details at same time.
  async addMakerModelInventry(body: AddMakerModelInventoryDto) {
    let makerModelRes: string = '';
    let executed: boolean = false;

    let allreadyExistSequencesNo = [];
    try {
      //loop throuth the sequence no
      for (let index in body.sequenceNo) {
        //check if sequence allready exist
        let inventryFound = await this.vIRepo.findOne({
          where: { sequenceNo: body.sequenceNo[index] },
        });

        //make a object with sequence no as string instead of array
        let inCloneObj = { ...body, sequenceNo: body.sequenceNo[index] };

        // if sequence no allready exist than save it in array of rejected sequence no if not then save in db
        if (inventryFound != undefined) {
          allreadyExistSequencesNo.push(body.sequenceNo[index]);
        } else {
          //save maker and model only once.
          if (!executed) {
            makerModelRes = await this.checkIfMakerModelAllreadyExistAddIfNot(
              body.maker,
              body.makerEnglish,
              body.model,
              body.modelEnglish,
            );
            executed = true;
          }
          await this.vIRepo.save({
            modelYear: body.modelYear,
            bodyColor: body.bodyColor,
            category: body.category,
            sequenceNo: body.sequenceNo[index],
            displacement: body.displacement,
            fuelType: body.fuelType,
            noOfCylinder: body.noOfCylinder,
            seatingCapacity: body.seatingCapacity,
            transmission: body.transmission,
            iStatus: body.iStatus,
            modelId: makerModelRes,
            inventoryIcon: body.inventoryIcon,
          });
        }
      }
      //check if all sequence no allready exist than throw error
      // else if few of them allready exist then give success with message
      // else show that all are saved
      if (allreadyExistSequencesNo.length == body.sequenceNo.length) {
        return ResponseHandler.error(
          HttpStatus.FORBIDDEN,
          'All sequence number allready exist',
        );
      } else if (
        allreadyExistSequencesNo.length < body.sequenceNo.length &&
        allreadyExistSequencesNo.length != 0
      ) {
        return ResponseHandler.success(
          allreadyExistSequencesNo,
          'These sequence no allready exist so they are not saved other than this are saved.',
        );
      } else {
        return ResponseHandler.success({}, 'All sequence no are saved.');
      }
    } catch (err) {
      return ResponseHandler.error(err.message);
    }
  }

  //D3 This Function add maker model inventory via csv file
  async addMakerModelInventryViaCsv(file) {
    try {
      // split csv by \n
      var dataArray = file.split(/\r?\n/);

      // map it and remove white spaces.
      let multiA: any[][] = [];
      dataArray.map((a, i) => {
        if (a.length > 2) {
          let newArray = a.split(',');
          let anotherArray: any[] = [];
          newArray.map((a) => {
            a = a.replace(/\s/g, '');
            // a = a.trim();
            anotherArray.push(a);
            return a;
          });
          multiA.push(anotherArray);
        }
      });

      // map and save in db
      let responseArray: any[] = [];
      for (let i = 1; i < multiA.length; i++) {
        let object: AddMakerModelInventoryDto = {
          maker: multiA[i][0],
          makerEnglish: multiA[i][1],
          status: multiA[i][2],
          model: multiA[i][3],
          modelEnglish: multiA[i][4],
          modelYear: multiA[i][5],
          bodyColor: multiA[i][6],
          sequenceNo: [multiA[i][7]],
          displacement: multiA[i][8],
          fuelType: multiA[i][9],
          noOfCylinder: multiA[i][10],
          seatingCapacity: multiA[i][11],
          transmission: multiA[i][12],
          category: multiA[i][13],
          iStatus: multiA[i][14],
        };
        const res = await this.addMakerModelInventry(object);
        if (res.statusCode === 403) {
          res.message = object.sequenceNo + ' this sequence no allready exist';
        }
        // Object.entries(response).forEach(o => delete o.statusCode);
        responseArray.push(res);
      }
      return ResponseHandler.success(responseArray);
    } catch (err) {
      this.logger.log(
        `[rar-service-error] -> ADD_MAKER_MODEL_INVENTORY_VIA_CSV | ${err.message}`,
      );
      return ResponseHandler.error(err.message);
    }
  }

  //D4 total final dashboard findall. // need to check if model id exist
  async findAllForDashboard(params: ListSearchSortDto) {
    try {
      const fields = [
        'rideInventory.id',
        //  'rideInventory.modelId',
        'rideInventory.modelYear',

        //'rideInventory.bodyColor',
        //'rideInventory.sequenceNo',
        //'rideInventory.displacement',
        //'rideInventory.fuelType',
        //'rideInventory.noOfCylinder',
        'rideInventory.seatingCapacity',
        //'rideInventory.transmission',
        'rideInventory.category',
        //'rideInventory.isAvaliable',
        //  'rideInventory.iStatus',
        'rideInventory.createdAt',
        'rideInventory.updatedAt',
        //'rideInventory.vehicleImage',
        'rideInventory.inventoryIcon',
        'rideInventory.modelId',
        'model.modelEnglish',
        'model.makerId',
        'maker.makerEnglish',
      ];

      const vehicleInventoryInstance = await this.vIRepo.createQueryBuilder(
        'rideInventory',
      );
      vehicleInventoryInstance.select(fields);
      vehicleInventoryInstance.groupBy('modelid');
      vehicleInventoryInstance.addGroupBy('modelYear');
      vehicleInventoryInstance.innerJoin('rideInventory.model', 'model');
      vehicleInventoryInstance.innerJoin('model.maker', 'maker');
      vehicleInventoryInstance.addSelect('COUNT(*) AS total');
      vehicleInventoryInstance.addSelect(
        'SUM(CASE WHEN isRegistered=1 THEN 1 ELSE 0 END)',
        'registered',
      );
      //vehicleInventoryInstance.addSelect('SUM(CASE WHEN isAvaliable=0 THEN 1 ELSE 0 END)', 'inactive');
      vehicleInventoryInstance.addSelect(
        'SUM(CASE WHEN iStatus=2 THEN 1 ELSE 0 END)',
        'inactive',
      ); // inactice
      vehicleInventoryInstance.addSelect(
        'SUM(CASE WHEN iStatus=3 THEN 1 ELSE 0 END)',
        'draft',
      ); // draft
      vehicleInventoryInstance.addSelect(
        'SUM(CASE WHEN isRegistered=0 THEN 1 ELSE 0 END)',
        'not-registered',
      );
      vehicleInventoryInstance.addSelect(
        'SUM(CASE WHEN iStatus=1 && isRegistered=0 THEN 1 ELSE 0 END)',
        'avaliable',
      );

      if (params?.filters?.modelYear) {
        vehicleInventoryInstance.andWhere(
          'rideInventory.modelId LIKE :modelYear',
          {
            modelYear: `${params?.filters?.modelYear}%`,
          },
        );
      }

      if (params?.filters?.seatingCapacity) {
        vehicleInventoryInstance.andWhere(
          'rideInventory.seatingCapacity LIKE :seatingCapacity',
          {
            seatingCapacity: `${params?.filters?.seatingCapacity}%`,
          },
        );
      }

      if (params?.filters?.category) {
        vehicleInventoryInstance.andWhere(
          'rideInventory.category LIKE :category',
          {
            category: `${params?.filters?.category}%`,
          },
        );
      }

      if (params?.filters?.modelEnglish) {
        console.log('+++++++++++++++++++++++++');
        vehicleInventoryInstance.andWhere(
          'model.modelEnglish LIKE :modelEnglish',
          {
            modelEnglish: `${params?.filters?.modelEnglish}%`,
          },
        );
      }

      if (params?.filters?.makerEnglish) {
        vehicleInventoryInstance.andWhere(
          'maker.makerEnglish LIKE :makerEnglish',
          {
            makerEnglish: `${params?.filters?.makerEnglish}%`,
          },
        );
      }
      if (params?.filters?.total) {
        console.log('----------------------------------');
        vehicleInventoryInstance.andWhere('rideInventory.total LIKE :total', {
          total: `${params?.filters?.total}%`,
        });
      }
      if (params?.filters?.total) {
        console.log('----------------------------------');
        vehicleInventoryInstance.andWhere('rideInventory.total LIKE :total', {
          total: `${params?.filters?.total}%`,
        });
      }

      // This code below can be used to search for inventories created between 2 dates.
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = iGetIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        vehicleInventoryInstance.andWhere(
          'rideInventory.createdAt >= :fromDate',
          {
            fromDate,
          },
        );
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = iGetIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        vehicleInventoryInstance.andWhere(
          'rideInventory.createdAt <= :toDate',
          { toDate },
        );
      }

      // Admin Sort
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = InventoryListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          vehicleInventoryInstance.orderBy(sortField, sortOrder);
        }
        vehicleInventoryInstance.skip(params.skip);
        vehicleInventoryInstance.take(params.take);
      }

      // total - registered - inactive - draft = avaliable
      const asyncArray = await vehicleInventoryInstance.getRawMany();
      console.log(asyncArray);

      if (asyncArray != null) {
        return ResponseHandler.success(asyncArray);
      } else {
        return ResponseHandler.error(HttpStatus.BAD_REQUEST, 'No data found');
      }
    } catch (err) {
      this.logger.error('[findAll] error ' + err);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  //D5 tested but need a beter algo //
  async setVehiclesAvalibility(param: ActivationDto) {
    let iterator: number = 0;
    try {
      let mId = await this.getModelIdByModelEnglish(param.model);
      const inventryFound = await this.vIRepo.find({
        where: {
          modelId: mId,
          modelYear: param.year,
        },
      });
      if (inventryFound != undefined) {
        if (param.activate == true) {
          Promise.all(
            inventryFound.map(async (vehicle) => {
              console.log(iterator);
              console.log(parseInt(param.quantity));
              if (iterator < parseInt(param.quantity)) {
                iterator = iterator + 1;
                console.log('activate');

                let response = await this.vIRepo.findOne({
                  where: { id: vehicle.id },
                });
                response.iStatus = 1;
                await this.vIRepo.save(response);
                // console.log("new" + iterator);
              }
            }),
          );
          return ResponseHandler.success({}, 'data activated');
        } else if (param.inActivate == true) {
          console.log('inactivate');
          Promise.all(
            inventryFound.map(async (vehicle) => {
              console.log(iterator);
              console.log(parseInt(param.quantity));
              if (iterator < parseInt(param.quantity)) {
                console.log(iterator);
                iterator = iterator + 1;
                console.log('inactivate');
                let response = await this.vIRepo.findOne({
                  where: { id: vehicle.id },
                });
                response.iStatus = 2;
                await this.vIRepo.save(response);
                // console.log("new" + iterator);
              }
            }),
          );
          return ResponseHandler.success({}, 'data deactivated');
        } else {
          return ResponseHandler.error(
            HttpStatus.BAD_REQUEST,
            'booleon mismatch',
          );
        }
      } else {
        return ResponseHandler.error(
          HttpStatus.NOT_FOUND,
          'no data found related to this in inventory',
        );
      }
    } catch (err) {
      return ResponseHandler.error(
        HttpStatus.BAD_GATEWAY,
        'issue while performing operations.',
      );
    }
  }

  //D6
  async updateInventory(param: UpdateInventoryDto) {
    try {
      console.log(param);
      console.log('in  update inventory ');
      console.log(param?.id);
      let updateResponse = await this.vIRepo.update(param.id, param);
      console.log(updateResponse);
      let findUpdated = await this.vIRepo.findOne(param.id);
      return ResponseHandler.success(findUpdated);
    } catch (err) {
      this.logger.error(`updateVehicleMaker -> ${JSON.stringify(err.message)}`);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  //A1
  async showSelectMenuForApp() {
    try {
      console.log('in app select menu');
      const iFields = [
        'rideInventory.id',
        'rideInventory.modelId',
        'rideInventory.modelYear',
        'rideInventory.category',
        'rideInventory.inventoryIcon',
        'model.modelEnglish',
        'model.makerId',
        'maker.makerEnglish',
      ];

      const vehicleInventoryInstance =
        this.vIRepo.createQueryBuilder('rideInventory');
      vehicleInventoryInstance.select(iFields);
      vehicleInventoryInstance.groupBy('modelid');
      vehicleInventoryInstance.addGroupBy('modelYear');
      vehicleInventoryInstance.innerJoin('rideInventory.model', 'model');
      vehicleInventoryInstance.innerJoin('model.maker', 'maker');
      vehicleInventoryInstance.andWhere('rideInventory.isRegistered = 0');
      vehicleInventoryInstance.andWhere('rideInventory.iStatus = 1');

      let [iResult, iTotal] = await vehicleInventoryInstance.getManyAndCount();

      return ResponseHandler.success(iResult);
    } catch (err) {
      this.logger.error('[findAll] error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  //A2
  async getSelectedVehicleDetailsForApp(
    body: GetSelectedVehicleDetailsForAppDto,
  ) {
    try {
      const iFields = [
        'rideInventory.id',
        'rideInventory.modelId',
        'rideInventory.modelYear',
        'rideInventory.transmission',
        'rideInventory.fuelType',
        'rideInventory.seatingCapacity',
        'rideInventory.noOfCylinder',
        'rideInventory.displacement',
        'rideInventory.inventoryIcon',
        'model.modelEnglish',
        'model.makerId',
        'maker.makerEnglish',
      ];

      const vehicleInventoryInstance =
        this.vIRepo.createQueryBuilder('rideInventory');
      vehicleInventoryInstance.select(iFields);
      vehicleInventoryInstance.where('rideInventory.id = :id', { id: body.id });
      vehicleInventoryInstance.innerJoin('rideInventory.model', 'model');
      vehicleInventoryInstance.andWhere('rideInventory.modelId = :modelId', {
        modelId: body.modelId,
      });
      vehicleInventoryInstance.innerJoin('model.maker', 'maker');

      let iResult = await vehicleInventoryInstance.getOne();
      return ResponseHandler.success(iResult);
    } catch (err) {
      this.logger.error('error ' + err.message);
      return ResponseHandler.error(HttpStatus.BAD_REQUEST);
    }
  }

  //--D2D3
  async checkIfMakerModelAllreadyExistAddIfNot(
    maker,
    makerEnglish,
    model,
    modelEnglish,
  ) {
    try {
      // see if maker exist if not than save it.
      let response = await this.vehicleMakerRepository.findOne({
        where: { makerEnglish: makerEnglish },
      });
      if (response == null) {
        response = await this.vehicleMakerRepository.save({
          maker: maker,
          makerEnglish: makerEnglish,
          status: 1,
        });
      }
      console.log(response);
      console.log('this is result of maker saving');
      // see if model exist if not than save it.
      let result = await this.vehicleModelRepository.findOne({
        where: { modelEnglish: modelEnglish },
      });
      if (result == null) {
        result = await this.vehicleModelRepository.save({
          model: model,
          modelEnglish: modelEnglish,
          makerId: response.id,
        });
      }
      console.log(result);
      console.log('this is result of save model');
      result = await this.vehicleModelRepository.findOne({
        where: { modelEnglish: modelEnglish },
      });

      return result.id;
    } catch (err) {
      return null;
    }
  }

  //--D5
  async getModelIdByModelEnglish(modelEnglish: string) {
    const response = await this.vehicleModelRepository.findOne({
      where: {
        modelEnglish: modelEnglish,
      },
    });
    return response.id;
  }

  async registeredThisVehicle(message) {
    console.log('in updateVehicleDetails');
    copyFile;
    console.log(message);
    let { id, isRegistered } = message;
    console.log('in  update inventory ');
    console.log(id);
    console.log(isRegistered);
    // regustered karna sa pehla dekho ka kiya us ka status inactive to nahi,
    // or registered karna sa pehla dekho ka kiya wo pehla sa registered to nahi.
    let updateResponse = await this.vIRepo.update(id, {
      isRegistered: isRegistered,
    });
    console.log(updateResponse);
    let findUpdated = await this.vIRepo.findByIds(id);
    return ResponseHandler.success(findUpdated);
  }
}
