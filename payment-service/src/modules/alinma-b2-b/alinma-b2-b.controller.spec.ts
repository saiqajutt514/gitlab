import { Test, TestingModule } from '@nestjs/testing';
import { AlinmaB2BController } from './alinma-b2-b.controller';
import { AlinmaB2BService } from './alinma-b2-b.service';

describe('AlinmaB2BController', () => {
  let controller: AlinmaB2BController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlinmaB2BController],
      providers: [AlinmaB2BService],
    }).compile();

    controller = module.get<AlinmaB2BController>(AlinmaB2BController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
