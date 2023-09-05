import { Test, TestingModule } from "@nestjs/testing";
import { CabTypeController } from "./cab-type.controller";
import { CabTypeService } from "./cab-type.service";

describe("CabTypeController", () => {
  let controller: CabTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CabTypeController],
      providers: [CabTypeService],
    }).compile();

    controller = module.get<CabTypeController>(CabTypeController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
