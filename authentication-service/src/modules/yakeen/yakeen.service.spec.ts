import { Test, TestingModule } from '@nestjs/testing';
import { YakeenService } from './yakeen.service';

describe('YakeenService', () => {
  let service: YakeenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YakeenService],
    }).compile();

    service = module.get<YakeenService>(YakeenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
