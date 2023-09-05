import { Test, TestingModule } from '@nestjs/testing';
import { ProcessPendingTripDriversService } from './process-pending-trip-drivers.service';

describe('ProcessPendingTripDriversService', () => {
  let service: ProcessPendingTripDriversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProcessPendingTripDriversService],
    }).compile();

    service = module.get<ProcessPendingTripDriversService>(ProcessPendingTripDriversService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
