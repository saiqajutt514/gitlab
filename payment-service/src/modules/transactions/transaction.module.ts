import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionRepository } from './transaction.repository';
import { ClientsModule } from '@nestjs/microservices';
import { captainTCPConfig } from 'src/microServicesConfigs';
import { RedisHandler } from 'src/helpers/redis-handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionRepository]),
    ClientsModule.register([
      {
        ...captainTCPConfig,
        name: 'CLIENT_CAPTAIN_SERVICE_TCP',
      },
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, RedisHandler],
  exports: [TransactionService],
})
export class TransactionModule {}
