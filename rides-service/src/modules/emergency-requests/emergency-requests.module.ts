import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'src/logger/logger.module';

import { EmergencyRequestsController } from './emergency-requests.controller';
import { EmergencyRequestsService } from './emergency-requests.service';
import { EmergencyRequestsRepository } from './emergency-requests.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyRequestsRepository]), LoggerModule],
  controllers: [EmergencyRequestsController],
  providers: [EmergencyRequestsService],
  exports: [EmergencyRequestsService]
})
export class EmergencyRequestsModule {}
