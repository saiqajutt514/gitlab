import { Test, TestingModule } from '@nestjs/testing';
import { RarService } from './rar.service';

describe('RarService', () => {
  let service: RarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RarService],
    }).compile();

    service = module.get<RarService>(RarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
