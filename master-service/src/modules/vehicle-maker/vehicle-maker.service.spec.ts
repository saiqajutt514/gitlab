import { Test, TestingModule } from '@nestjs/testing';
import { VehicleMakerService } from './vehicle-maker.service';

describe('VehicleMakerService', () => {
  let service: VehicleMakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleMakerService],
    }).compile();

    service = module.get<VehicleMakerService>(VehicleMakerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
