import { Test, TestingModule } from '@nestjs/testing';
import { IbanController } from './iban.controller';
import { IbanService } from './iban.service';

describe('IbanController', () => {
  let controller: IbanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IbanController],
      providers: [IbanService],
    }).compile();

    controller = module.get<IbanController>(IbanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
