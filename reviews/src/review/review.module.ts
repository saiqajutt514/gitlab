import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ReviewRepository } from './repositories/review.repository';
import { UserRatingMetaRepository } from './repositories/rating-meta.repository';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReviewRepository, UserRatingMetaRepository]), LoggerModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService]
})
export class ReviewModule { }
