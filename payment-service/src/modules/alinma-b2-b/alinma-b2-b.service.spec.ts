import { Test, TestingModule } from '@nestjs/testing';
import { AlinmaB2BService } from './alinma-b2-b.service';

describe('AlinmaB2BService', () => {
  let service: AlinmaB2BService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlinmaB2BService],
    }).compile();

    service = module.get<AlinmaB2BService>(AlinmaB2BService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
