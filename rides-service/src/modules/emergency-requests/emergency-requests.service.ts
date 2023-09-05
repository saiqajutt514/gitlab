import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets } from 'typeorm';

import { AddressType } from '../trip_address/trip_address.enum'
import { EmergencyRequestsRepository } from './emergency-requests.repository';
import { EmergencyRequestListingSort } from './enums/emergency-request.enum';
import { CreateEmergencyRequestDto, UpdateEmergencyRequestDto, ListSearchSortDto } from './interface/emergency-requests.interface';

import { getTripNumber, setTripNumber } from 'src/utils/generate-trn';
import { errorMessage } from 'src/constants/errorMessage';
import { successMessage } from 'src/constants/successMessage';
import { ResponseData } from 'src/helpers/responseHandler';
import { LoggerHandler } from 'src/helpers/logger.handler';
import { getIsoDateTime } from '../../utils/get-timestamp';
@Injectable()
export class EmergencyRequestsService {

  private logger = new LoggerHandler(EmergencyRequestsService.name).getInstance();

  constructor(
    @InjectRepository(EmergencyRequestsRepository)
    private emergencyRequestRepository: EmergencyRequestsRepository,
  ){}

  async findAll(params: ListSearchSortDto) {
    this.logger.log(`[findAll] params: ${JSON.stringify(params)}`);
    const fields = [
      'emergency.id', 'emergency.tripId', 'emergency.createdAt', 'emergency.reason',
      'emergency.location', 'emergency.tripStatus', 'emergency.issueStatus', 'trip.tripNo',
      'rider.userId', 'rider.firstName', 'rider.lastName', 'rider.mobileNo'
    ];

    const emergencyQryInstance = this.emergencyRequestRepository.createQueryBuilder("emergency");
    emergencyQryInstance.select(fields);
    emergencyQryInstance.leftJoin('emergency.trip', 'trip');
    emergencyQryInstance.leftJoin('emergency.rider', 'rider');

    // TODO: Admin Filters
    if (params?.filters?.tripNo) {
      emergencyQryInstance.andWhere("trip.tripNo = :tripNo", { tripNo: setTripNumber(params?.filters?.tripNo) });
    }
    if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
      const fromDate = getIsoDateTime(new Date(params?.filters?.createdAt[0]));
      emergencyQryInstance.andWhere("emergency.createdAt >= :fromDate", { fromDate });
    }
    if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
      const toDate = getIsoDateTime(new Date(new Date(params?.filters?.createdAt[1]).setHours(23, 59, 59, 999)));
      emergencyQryInstance.andWhere("emergency.createdAt <= :toDate", { toDate });
    }
    if (params?.filters?.reason) {
      emergencyQryInstance.andWhere("emergency.reason LIKE :reason", { reason: `%${params?.filters?.reason}%` });
    }
    if (params?.filters?.location) {
      emergencyQryInstance.andWhere("emergency.location LIKE :location", { location: `%${params?.filters?.location}%` });
    }
    if (params?.filters?.tripStatus) {
      emergencyQryInstance.andWhere("emergency.tripStatus = :tripStatus", { tripStatus: params?.filters?.tripStatus });
    }
    if (params?.filters?.issueStatus) {
      emergencyQryInstance.andWhere("emergency.issueStatus = :issueStatus", { issueStatus: params?.filters?.issueStatus });
    }
    if (params?.filters?.riderName) {
      emergencyQryInstance.andWhere(new Brackets(sqb => {
        sqb.where("rider.firstName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
        sqb.orWhere("rider.lastName LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
        sqb.orWhere("CONCAT_WS(' ', rider.firstName, rider.lastName) LIKE :riderName", { riderName: `${params?.filters?.riderName}%` });
      }));
    }
    if (params?.filters?.assignedById) {
      emergencyQryInstance.andWhere(new Brackets(sqb => {
        sqb.where("emergency.modifiedBy = :assignedById", { assignedById: params?.filters?.assignedById });
        sqb.orWhere("emergency.assignedBy = :assignedById", { assignedById: params?.filters?.assignedById });
        sqb.orWhere("emergency.resolvedBy = :assignedById", { assignedById: params?.filters?.assignedById });
      }));
    }
    // TODO: Assigned Name Filter

    // Admin Sort
    if(params?.sort?.field && params?.sort?.order) {
      const sortField = EmergencyRequestListingSort[params?.sort?.field];
      if (sortField) {
        const sortOrder = (params?.sort?.order.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
        emergencyQryInstance.orderBy(sortField, sortOrder);
      }
    } else {
      emergencyQryInstance.orderBy('emergency.updatedAt', 'DESC');
    }
    emergencyQryInstance.skip(params.skip);
    emergencyQryInstance.take(params.take);

    const [result, total] = await   emergencyQryInstance.getManyAndCount();

    const totalCount: number = total;
    const requests: any = result;

    requests.map((data) => {
      if (data.trip) {
        data['trip']['tripNo'] = getTripNumber(data['trip']['tripNo']);
      } else {
        data['trip'] = {}
      }
      if (data.rider) {
        data['rider']['fullName'] = `${data['rider']['firstName']} ${data['rider']['lastName']}`;
        delete data['rider']['firstName'];
        delete data['rider']['lastName'];
      } else {
        data['rider'] = {}
      }
      // TODO: Get admin details
      data['assignedBy'] = 'Admin';
    });
    this.logger.log(`[findAll] success`);
    return ResponseData.success(HttpStatus.OK, { requests, totalCount })
  }

  async findOne(id: string) {
    try {
      const emergencyQryInstance = this.emergencyRequestRepository.createQueryBuilder("emergency");
      const fields = [
        'emergency.id', 'emergency.createdAt', 'emergency.updatedAt', 'emergency.reason', 'emergency.comments',
        'emergency.location', 'emergency.latitude', 'emergency.longitude', 'emergency.remarks',
        'emergency.tripStatus', 'emergency.issueStatus', 'emergency.resolvedAt',
        'trip.id', 'trip.tripNo',
        'rider.id', 'rider.userId', 'rider.firstName', 'rider.lastName', 'rider.mobileNo',
        'driver.id', 'driver.userId', 'driver.firstName', 'driver.lastName', 'driver.mobileNo',
        'pickup.address', 'pickup.addressType', 'pickup.latitude', 'pickup.longitude',
        'dropoff.address', 'dropoff.addressType', 'dropoff.latitude', 'dropoff.longitude'
      ];
      emergencyQryInstance.select(fields);
      emergencyQryInstance.leftJoin('emergency.trip', 'trip');
      emergencyQryInstance.leftJoin('trip.rider', 'rider');
      emergencyQryInstance.leftJoin('trip.driver', 'driver');
      emergencyQryInstance.leftJoin("trip.pickup", "pickup", "pickup.addressType = :pickupType", { pickupType: AddressType.PICK_UP });
      emergencyQryInstance.leftJoin("trip.dropoff", "dropoff", "dropoff.addressType = :dropoffType", { dropoffType: AddressType.DESTINATION });
      emergencyQryInstance.where("emergency.id = :id", { id : id });
      const results:any = await emergencyQryInstance.getOne();

      Logger.log(JSON.stringify(results));
      if(!results) {
        this.logger.log(`[findOne] No data found`);
        throw new Error(errorMessage.EMERGENCY.NOT_FOUND);
      }

      // TODO: Get admin details
      results['resolvedBy'] = 'Admin';
      if (results?.trip) {
        results['trip']['tripNo'] = getTripNumber(results['trip']['tripNo']);
        if(results?.trip?.rider) {
          results['trip']['rider']['fullName'] = `${results['trip']['rider']['firstName']} ${results['trip']['rider']['lastName']}`;
          delete results['trip']['rider']['firstName'];
          delete results['trip']['rider']['lastName'];
        } else {
          results['trip']['rider'] = {};
        }
        if(results?.trip?.driver) {
          results['trip']['driver']['fullName'] = `${results['trip']['driver']['firstName']} ${results['trip']['driver']['lastName']}`;
          delete results['trip']['driver']['firstName'];
          delete results['trip']['driver']['lastName'];
        } else {
          results['trip']['driver'] = {};
        }
      } else {
        results['trip'] = {}
      }

      this.logger.log(`[findOne] success`);
      return ResponseData.success(HttpStatus.OK, { request: results })
    } catch (error) {
      this.logger.error(`[findOne] Some error occurred in catch | ${error.message}`)
      return ResponseData.error(HttpStatus.BAD_REQUEST, error.message || errorMessage.EMERGENCY.NOT_FOUND)
    }
  }

  async create(data: CreateEmergencyRequestDto) {
    try {
      const emergencyRequestRow = await this.emergencyRequestRepository.create(data);
      const result = await this.emergencyRequestRepository.save(emergencyRequestRow);
      this.logger.log(`[craate] Request created successfully | id => ${result.id}`)
      return ResponseData.success(HttpStatus.OK, { id: result.id, message: successMessage.EMERGENCY.CREATE })
    } catch (error) {
      this.logger.error(`[craate] Some error occurred in catch | ${error.message}`)
      return ResponseData.error(HttpStatus.BAD_REQUEST, error.message || errorMessage.SOMETHING_WENT_WRONG)
    }
  }

  async update(id: string, data: UpdateEmergencyRequestDto) {
    try {
      await this.emergencyRequestRepository.update(id, data);
      this.logger.log(`[update] Request updated successfully | id => ${id}`)
      return ResponseData.success(HttpStatus.OK, { id: id, message: successMessage.EMERGENCY.UPDATE })
    }
    catch (error) {
      this.logger.error(`[update] Some error occurred in catch | ${error.message}`)
      return ResponseData.error(HttpStatus.BAD_REQUEST, error.message || errorMessage.SOMETHING_WENT_WRONG)
    }
  }

}
