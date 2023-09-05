import { Test, TestingModule } from "@nestjs/testing";
import { CarInfoController } from "./car-info.controller";
import { CarInfoService } from "./car-info.service";

describe("CarInfoController", () => {
  let controller: CarInfoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarInfoController],
      providers: [CarInfoService],
    }).compile();

    controller = module.get<CarInfoController>(CarInfoController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
