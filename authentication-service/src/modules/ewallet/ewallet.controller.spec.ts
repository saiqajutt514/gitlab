import { Test, TestingModule } from '@nestjs/testing';
import { EwalletController } from './ewallet.controller';

describe('EwalletController', () => {
  let controller: EwalletController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EwalletController],
    }).compile();

    controller = module.get<EwalletController>(EwalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
