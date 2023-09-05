import { Test, TestingModule } from '@nestjs/testing';
import { RejectedReasonService } from './rejected-reason.service';

describe('RejectedReasonService', () => {
  let service: RejectedReasonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RejectedReasonService],
    }).compile();

    service = module.get<RejectedReasonService>(RejectedReasonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
