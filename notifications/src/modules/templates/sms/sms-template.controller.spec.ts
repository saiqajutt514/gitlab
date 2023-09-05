import { Test, TestingModule } from '@nestjs/testing';
import { SmsTemplateController } from './sms-template.controller';
import { SmsTemplateService } from './sms-template.service';

describe('SmsTemplateController', () => {
  let controller: SmsTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsTemplateController],
      providers: [SmsTemplateService],
    }).compile();

    controller = module.get<SmsTemplateController>(SmsTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
