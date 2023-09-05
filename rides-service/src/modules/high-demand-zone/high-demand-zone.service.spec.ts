import { Test, TestingModule } from '@nestjs/testing';
import { HighDemandZoneService } from './high-demand-zone.service';

describe('HighDemandZoneService', () => {
  let service: HighDemandZoneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HighDemandZoneService],
    }).compile();

    service = module.get<HighDemandZoneService>(HighDemandZoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
