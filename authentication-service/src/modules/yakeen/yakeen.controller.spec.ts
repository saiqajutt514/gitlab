import { Test, TestingModule } from '@nestjs/testing';
import { YakeenController } from './yakeen.controller';

describe('YakeenController', () => {
  let controller: YakeenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YakeenController],
    }).compile();

    controller = module.get<YakeenController>(YakeenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
