import { Test, TestingModule } from '@nestjs/testing';
import { RejectedReasonController } from './rejected-reason.controller';
import { RejectedReasonService } from './rejected-reason.service';

describe('RjectedReasonController', () => {
  let controller: RejectedReasonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RejectedReasonController],
      providers: [RejectedReasonService],
    }).compile();

    controller = module.get<RejectedReasonController>(RejectedReasonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
