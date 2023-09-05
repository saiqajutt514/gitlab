import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PushTemplateService } from './push-template.service';
import { PushTemplateController } from './push-template.controller';
import { PushTemplateRepository } from './repositories/push-template.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PushTemplateRepository])],
  controllers: [PushTemplateController],
  providers: [PushTemplateService],
  exports: [PushTemplateService]
})
export class PushTemplateModule { }
