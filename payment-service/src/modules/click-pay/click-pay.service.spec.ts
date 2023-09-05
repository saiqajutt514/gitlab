import { Test, TestingModule } from '@nestjs/testing';
import { ClickPayService } from './click-pay.service';

describe('ClickPayService', () => {
  let service: ClickPayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClickPayService],
    }).compile();

    service = module.get<ClickPayService>(ClickPayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
