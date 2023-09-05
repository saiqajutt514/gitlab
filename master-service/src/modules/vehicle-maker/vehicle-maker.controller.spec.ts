import { Test, TestingModule } from '@nestjs/testing';
import { VehicleMakerController } from './vehicle-maker.controller';

describe('VehicleMakerController', () => {
  let controller: VehicleMakerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleMakerController],
    }).compile();

    controller = module.get<VehicleMakerController>(VehicleMakerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
