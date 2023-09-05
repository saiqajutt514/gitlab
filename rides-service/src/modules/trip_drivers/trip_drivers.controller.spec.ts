import { Test, TestingModule } from '@nestjs/testing';
import { TripDriversController } from './trip_drivers.controller';
import { TripDriversService } from './trip_drivers.service';

describe('TripDriversController', () => {
  let controller: TripDriversController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripDriversController],
      providers: [TripDriversService],
    }).compile();

    controller = module.get<TripDriversController>(TripDriversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
