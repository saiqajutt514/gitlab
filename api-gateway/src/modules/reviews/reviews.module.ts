import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { reviewsTCPConfig } from 'src/microServiceConfigs';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [ClientsModule.register([
    {
      ...reviewsTCPConfig,
      name: 'CLIENT_REVIEW_SERVICE_TCP'
    }
  ])],
  controllers: [ReviewsController],
  providers: [ReviewsService]
})
export class ReviewsModule { }
