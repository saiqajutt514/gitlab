import { Module } from '@nestjs/common';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.services';
import { UserService } from '../user/user.service';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { RedisHandler } from 'src/helpers/redis-handler';

@Module({
  imports: [],
  controllers: [TripsController],
  providers: [TripsService, UserService, AwsS3Service, RedisHandler],
})
export class TripsModule { }
