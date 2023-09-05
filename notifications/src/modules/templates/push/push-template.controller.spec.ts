import { Test, TestingModule } from '@nestjs/testing';
import { PushTemplateController } from './push-template.controller';
import { PushTemplateService } from './push-template.service';

describe('PushTemplateController', () => {
  let controller: PushTemplateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushTemplateController],
      providers: [PushTemplateService],
    }).compile();

    controller = module.get<PushTemplateController>(PushTemplateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
