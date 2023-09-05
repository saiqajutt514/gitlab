import { Test, TestingModule } from '@nestjs/testing';
import { VehicleModelService } from './vehicle-model.service';

describe('VehicleModelService', () => {
  let service: VehicleModelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleModelService],
    }).compile();

    service = module.get<VehicleModelService>(VehicleModelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
