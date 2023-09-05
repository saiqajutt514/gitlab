import { Test, TestingModule } from '@nestjs/testing';
import { PushTemplateService } from './push-template.service';

describe('PushTemplateService', () => {
  let service: PushTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushTemplateService],
    }).compile();

    service = module.get<PushTemplateService>(PushTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
