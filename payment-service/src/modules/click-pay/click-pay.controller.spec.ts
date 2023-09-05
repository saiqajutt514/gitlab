import { Test, TestingModule } from '@nestjs/testing';
import { ClickPayController } from './click-pay.controller';
import { ClickPayService } from './click-pay.service';

describe('ClickPayController', () => {
  let controller: ClickPayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClickPayController],
      providers: [ClickPayService],
    }).compile();

    controller = module.get<ClickPayController>(ClickPayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
