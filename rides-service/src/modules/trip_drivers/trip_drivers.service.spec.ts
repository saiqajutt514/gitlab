import { Test, TestingModule } from '@nestjs/testing';
import { TripDriversService } from './trip_drivers.service';

describe('TripDriversService', () => {
  let service: TripDriversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TripDriversService],
    }).compile();

    service = module.get<TripDriversService>(TripDriversService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
