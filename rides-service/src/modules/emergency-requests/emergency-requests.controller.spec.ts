import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyRequestsController } from './emergency-requests.controller';

describe('EmergencyRequestsController', () => {
  let controller: EmergencyRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmergencyRequestsController],
    }).compile();

    controller = module.get<EmergencyRequestsController>(EmergencyRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
