import { Test, TestingModule } from '@nestjs/testing';
import { EwalletService } from './ewallet.service';

describe('EwalletService', () => {
  let service: EwalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EwalletService],
    }).compile();

    service = module.get<EwalletService>(EwalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
