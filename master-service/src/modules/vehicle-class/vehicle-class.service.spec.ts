import { Test, TestingModule } from '@nestjs/testing';
import { VehicleClassService } from './vehicle-class.service';

describe('VehicleClassService', () => {
  let service: VehicleClassService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleClassService],
    }).compile();

    service = module.get<VehicleClassService>(VehicleClassService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
