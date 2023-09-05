import { Test, TestingModule } from '@nestjs/testing';
import { VehicleModelController } from './vehicle-model.controller';

describe('VehicleModelController', () => {
  let controller: VehicleModelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleModelController],
    }).compile();

    controller = module.get<VehicleModelController>(VehicleModelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
