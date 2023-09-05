import { Test, TestingModule } from '@nestjs/testing';
import { SmsTemplateService } from './sms-template.service';

describe('SmsTemplateService', () => {
  let service: SmsTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsTemplateService],
    }).compile();

    service = module.get<SmsTemplateService>(SmsTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
