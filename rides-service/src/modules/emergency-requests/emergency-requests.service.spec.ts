import { Test, TestingModule } from '@nestjs/testing';
import { EmergencyRequestsService } from './emergency-requests.service';

describe('EmergencyRequestsService', () => {
  let service: EmergencyRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmergencyRequestsService],
    }).compile();

    service = module.get<EmergencyRequestsService>(EmergencyRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
