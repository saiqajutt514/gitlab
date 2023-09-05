import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailTemplateService } from './email-template.service';
import { EmailTemplateController } from './email-template.controller';
import { EmailTemplateRepository } from './repositories/email-template.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EmailTemplateRepository])],
  controllers: [EmailTemplateController],
  providers: [EmailTemplateService],
  exports: [EmailTemplateService]
})
export class EmailTemplateModule { }
