import { Test, TestingModule } from "@nestjs/testing";
import { CabTypeService } from "./cab-type.service";

describe("CabTypeService", () => {
  let service: CabTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CabTypeService],
    }).compile();

    service = module.get<CabTypeService>(CabTypeService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
