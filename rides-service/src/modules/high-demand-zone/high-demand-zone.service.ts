import { HttpCode, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import appConfig from 'config/appConfig';
import { errorMessage } from 'src/constants/errorMessage';
import { successMessage } from 'src/constants/successMessage';
import { getPastTime } from 'src/helpers/date-functions';
import { RedisHandler } from 'src/helpers/redis-handler';
import { ResponseData } from 'src/helpers/responseHandler';
import { getIsoDateTime } from 'src/utils/get-timestamp';
import { Brackets, Repository } from 'typeorm';
import { CustomerService } from '../customer/customer.service';
import {
  createDto,
  highDemandZoneListSort,
  ListSearchSortDto,
} from './dto/create.dto';
import { highDemandZoneEntity } from './entities/high-demand-zone.entity';

@Injectable()
export class HighDemandZoneService {
  private logger = new Logger(CustomerService.name);
  constructor(
    @InjectRepository(highDemandZoneEntity)
    private highDemandZoneRepository: Repository<highDemandZoneEntity>,
    private redisHandler: RedisHandler,
    private customerService: CustomerService,
  ) {}

  async create(params: createDto) {
    try {
      if (
        !(await this.highDemandZoneRepository
          .createQueryBuilder('hd')
          .select('hd.id')
          .where('latitude = :latitude and longitude = :longitude', {
            latitude: params.latitude,
            longitude: params.longitude,
          })
          .getRawOne())
      ) {
        const createZone = await this.highDemandZoneRepository.create(params);
        await this.highDemandZoneRepository.save(createZone);
        return ResponseData.success(
          HttpStatus.OK,
          successMessage.HIGH_DEMAND_ZONE.CREATE,
        );
      } else {
        return ResponseData.error(
          HttpStatus.METHOD_NOT_ALLOWED,
          errorMessage.HIGH_DEMAND_ZONE.ALREADY_EXIST,
        );
      }
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async remove(id: string) {
    try {
      await this.highDemandZoneRepository.delete(id);
      return ResponseData.success(HttpStatus.OK, '');
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll(params: ListSearchSortDto) {
    try {
      const riderQryInstance = this.highDemandZoneRepository.createQueryBuilder(
        'users',
      );
      if (params?.filters?.longitude) {
        riderQryInstance.andWhere('users.longitude = :longitude', {
          longitude: params?.filters?.longitude,
        });
      }
      if (params?.filters?.latitude) {
        riderQryInstance.andWhere('users.latitude = :longitulatitudede', {
          latitude: params?.filters?.latitude,
        });
      }
      if (params?.filters?.addressInArabic) {
        riderQryInstance.andWhere(
          'users.addressInArabic LIKE :addressInArabic',
          {
            addressInArabic: `${params?.filters?.addressInArabic}%`,
          },
        );
      }
      if (params?.filters?.address) {
        riderQryInstance.andWhere('users.address LIKE :address', {
          address: `${params?.filters?.address}%`,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[0]) {
        const fromDate = getIsoDateTime(
          new Date(params?.filters?.createdAt[0]),
        );
        riderQryInstance.andWhere('users.createdAt >= :fromDate', {
          fromDate,
        });
      }
      if (params?.filters?.createdAt && params?.filters?.createdAt[1]) {
        const toDate = getIsoDateTime(
          new Date(
            new Date(params?.filters?.createdAt[1]).setUTCHours(
              23,
              59,
              59,
              999,
            ),
          ),
        );
        riderQryInstance.andWhere('users.createdAt <= :toDate', { toDate });
      }
      if (params?.keyword) {
        riderQryInstance.andWhere(
          new Brackets((sqb) => {
            sqb.where('users.addressInArabic LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
            sqb.orWhere('users.addressInArabic LIKE :keyword', {
              keyword: `%${params?.keyword}%`,
            });
          }),
        );
      }
      if (params?.sort?.field && params?.sort?.order) {
        const sortField = highDemandZoneListSort[params?.sort?.field];
        if (sortField) {
          const sortOrder =
            params?.sort?.order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
          riderQryInstance.orderBy(sortField, sortOrder);
        }
      } else {
        riderQryInstance.orderBy('users.createdAt', 'DESC');
      }
      riderQryInstance.skip(params.skip);
      riderQryInstance.take(params.take);
      const [result, total] = await riderQryInstance.getManyAndCount();
      const totalCount: number = total;
      const zones: any = result;
      this.logger.debug('[findAll] results: ' + zones.length);
      // .getManyAndCount();
      return ResponseData.success(HttpStatus.OK, { zones, totalCount });
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async demandZonesByAdmin(userId: string) {
    try {
      let latitude, longitude, radius;
      const demandZones = await this.highDemandZoneRepository
        .createQueryBuilder('hd')
        .select(
          'hd.*',
          'GeoDistMiles(' +
            latitude +
            ',' +
            longitude +
            ",hd.latitude,hd.longitude,'km') AS distance",
        )
        .groupBy('id')
        .having('distance <= :radius', {
          radius: radius,
        })
        .getRawMany();

      return demandZones;
    } catch (err) {
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        err?.message || errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getAllAdminHZD(userId: string) {
    try {
      //get time from env and convert to db date time format.
      const highDemandZoneTimeLimit = 30; //
      const dbTime = getPastTime(highDemandZoneTimeLimit);

      //get radius from radis
      // const radius =
      //   (await this.redisHandler.getRedisKey('HIGH_DEMAND_ZONE_RADIUS')) || 10;

      //get user high demand zone result.
      let userHDZ = await this.customerService.getAllUsersInZone(userId);
      // console.log('0000000000000');
      // console.log(userHDZ);
      const radius = userHDZ?.data?.radius;
      this.logger.log(`high demand zone radius range in km: ${radius}`);
      const userLAt = userHDZ.data.user?.latitude;
      const userLong = userHDZ.data.user?.longitude;

      //get admin high demand zone result.
      if (userHDZ.statusCode === HttpStatus.OK && userLAt && userLong) {
        const demandZones = await this.highDemandZoneRepository
          .createQueryBuilder('hd')
          .select([
            'GeoDistMiles(' +
              userLAt +
              ',' +
              userLong +
              ",hd.latitude,hd.longitude,'km') AS distance",
          ])
          .addSelect(['hd.latitude as lat', 'hd.longitude as lng'])
          .having('distance <= :radius', {
            radius: radius,
          })
          .where('hd.latitude IS NOT NULL')
          .andWhere('hd.longitude IS NOT NULL')
          .getRawMany();

        console.log(demandZones);

        //omit distance key:value
        demandZones.map((o) => delete o.distance);

        //merger both user and admin response.
        const userAndAdminRes = {
          ...userHDZ.data,
          adminCoordinates: demandZones,
        };

        //return response
        return ResponseData.success(HttpStatus.OK, userAndAdminRes);
      } else {
        return ResponseData.error(HttpStatus.NOT_FOUND, 'userid not found');
      }
    } catch (err) {
      console.log('_________Error___________getAllAdminHZD___________________');
      this.logger.error(`getAllUsersInZone -> error -> ${err.message}`);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}
