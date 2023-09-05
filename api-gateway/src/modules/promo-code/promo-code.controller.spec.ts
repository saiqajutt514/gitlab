import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeController } from './promo-code.controller';

describe('PromoCodeController', () => {
  let controller: PromoCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoCodeController],
    }).compile();

    controller = module.get<PromoCodeController>(PromoCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
