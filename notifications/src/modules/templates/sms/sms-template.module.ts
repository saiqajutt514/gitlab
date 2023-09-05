import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SmsTemplateService } from './sms-template.service';
import { SmsTemplateController } from './sms-template.controller';
import { SmsTemplateRepository } from './repositories/sms-template.repository';

@Module({
  imports: [TypeOrmModule.forFeature([SmsTemplateRepository])],
  controllers: [SmsTemplateController],
  providers: [SmsTemplateService],
  exports: [SmsTemplateService]
})
export class SmsTemplateModule { }
