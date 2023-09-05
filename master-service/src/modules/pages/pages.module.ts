import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisHandler } from 'src/helpers/redis-handler';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import {PagesRepository} from './repositories/pages.repository'

@Module({
  imports: [TypeOrmModule.forFeature([PagesRepository])],
  controllers: [PagesController],
  providers: [PagesService,RedisHandler]
})

export class PagesModule {}
