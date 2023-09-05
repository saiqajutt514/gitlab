import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleTripService } from './schedule-trip.service';

describe('ScheduleTripService', () => {
  let service: ScheduleTripService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleTripService],
    }).compile();

    service = module.get<ScheduleTripService>(ScheduleTripService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
