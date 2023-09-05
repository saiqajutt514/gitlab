import { Test, TestingModule } from '@nestjs/testing';
import { VehicleClassController } from './vehicle-class.controller';

describe('VehicleClassController', () => {
  let controller: VehicleClassController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleClassController],
    }).compile();

    controller = module.get<VehicleClassController>(VehicleClassController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
