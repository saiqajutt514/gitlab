import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateTripDriverDto, FineOneTripDriverDto, FindByTripAndDriverIdDto, UpdateTripDriverDto } from './dto/trip_driver.dto';
import { TripDriverStatus } from './enum/trip_drivers.enum';
import { TripDriverRepository } from './trip_drivers.repository';

@Injectable()
export class TripDriversService {

  constructor(
    @InjectRepository(TripDriverRepository)
    private tripDriverRepository: TripDriverRepository,
  ) { }

  private readonly logger = new Logger(TripDriversService.name);

  async create(data: CreateTripDriverDto) {
    const tripDriver = this.tripDriverRepository.create(data);
    await this.tripDriverRepository.save(data);
    return tripDriver;
  }

  async findOne(data: FineOneTripDriverDto) {
    const tripDriver = await this.tripDriverRepository.findOne(data)
    if (!tripDriver) {
      throw new HttpException('Trip Driver not found', HttpStatus.NOT_FOUND)
    }
    return tripDriver
  }

  async findByTripAndDriverId(data: FindByTripAndDriverIdDto) {
    return await this.tripDriverRepository.findOne(data)
  }

  async update(id: string, data: UpdateTripDriverDto) {
    return await this.tripDriverRepository.update({ id }, data)
  }

  async findAll(data) {
    return await this.tripDriverRepository.createQueryBuilder("trip_drivers")
      .select(data.select)
      .where(data.where)
      .getRawMany()
  }

  async findAllAndUpdate(find, update) {
    await this.tripDriverRepository.update(find, update);
  }

  async getDelinedCount(startDate: string, endDate: string) {
    return await this.tripDriverRepository.createQueryBuilder("trip_drivers")
      .where("trip_drivers.status = :status", { status: TripDriverStatus.DECLINED })
      .andWhere("DATE_FORMAT(trip_drivers.createdAt, '%Y-%m-%d') >= :startDate", { startDate })
      .andWhere("DATE_FORMAT(trip_drivers.createdAt, '%Y-%m-%d') <= :endDate", { endDate })
      .getCount()
  }

  async findOneRow(data) {
    return await this.tripDriverRepository.findOne(data)
  }

}
