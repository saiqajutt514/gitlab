import { Test, TestingModule } from '@nestjs/testing';
import { HighDemandZoneController } from './high-demand-zone.controller';
import { HighDemandZoneService } from './high-demand-zone.service';

describe('HighDemandZoneController', () => {
  let controller: HighDemandZoneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HighDemandZoneController],
      providers: [HighDemandZoneService],
    }).compile();

    controller = module.get<HighDemandZoneController>(HighDemandZoneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
