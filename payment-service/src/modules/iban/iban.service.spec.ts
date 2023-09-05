import { Test, TestingModule } from '@nestjs/testing';
import { IbanService } from './iban.service';

describe('IbanService', () => {
  let service: IbanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IbanService],
    }).compile();

    service = module.get<IbanService>(IbanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
