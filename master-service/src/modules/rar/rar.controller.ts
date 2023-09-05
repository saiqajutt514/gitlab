// import { Test, TestingModule } from '@nestjs/testing';
// import { RarController } from './rar.controller';
// import { RarService } from './rar.service';

// describe('RarController', () => {
//   let controller: RarController;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [RarController],
//       providers: [RarService],
//     }).compile();

//     controller = module.get<RarController>(RarController);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });
// });

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MessagePattern, Transport, Payload } from '@nestjs/microservices';
import { LoggerHandler } from 'src/helpers/logger-handler';
import {
  ADD_MAKER_MODEL_INVENTORY,
  ADD_MAKER_MODEL_INVENTORY_VIA_CSV,
  ADD_TO_INVENTORY,
  FIND_ALL_FOR_DASHBOARD,
  GET_SELECTED_VEHICLE_DETAILS_FOR_APP,
  SET_VEHICLE_AVALIABILITY,
  SHOW_SELECT_MENU_FOR_APP,
  UPDATE_INVENTORY,
  // UPDATE_VEHICLE_DETAILS_INTO_COMPANY_INVENTORY,
} from 'src/constants/kafka-constant';
import { RarService } from './rar.service';

@Controller('company-inventory')
export class RarController {
  constructor(private rarService: RarService) {}

  private readonly logger = new LoggerHandler(RarController.name).getInstance();

  // D1 ADD ONLY TO INVENOTRY
  @MessagePattern(ADD_TO_INVENTORY, Transport.TCP)
  async addToInventry(@Payload() message) {
    this.logger.log(`[addToInventry] -> ${ADD_TO_INVENTORY} | ${message}`);
    message = JSON.parse(message);
    message = message.paramDTO;
    return await this.rarService.addToInventry(message);
  }

  //D2 ADD_MAKER_MODEL_INVENTORY
  @MessagePattern(ADD_MAKER_MODEL_INVENTORY, Transport.TCP)
  async addMakerModelInventry(@Payload() payload) {
    this.logger.log(
      `[addMakerModelInventry] -> ${ADD_MAKER_MODEL_INVENTORY} | ${payload}`,
    );
    payload = JSON.parse(payload);
    payload = payload.paramDTO;
    return await this.rarService.addMakerModelInventry(payload);
  }

  //D3 ADD_MAKER_MODEL_INVENTORY_VIA_CSV
  @MessagePattern(ADD_MAKER_MODEL_INVENTORY_VIA_CSV, Transport.TCP)
  async addMakerModelInventryViaCsv(@Payload() file: any) {
    this.logger.log(
      `[rar-controller] -> ${ADD_MAKER_MODEL_INVENTORY_VIA_CSV} | ${file}`,
    );

    return await this.rarService.addMakerModelInventryViaCsv(file);
  }

  //D4 show full inventory for dashboard
  @MessagePattern(FIND_ALL_FOR_DASHBOARD, Transport.TCP)
  async findAllForDashboard(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.logger.log(
      `kafka::captain::${FIND_ALL_FOR_DASHBOARD}::recv -> ${JSON.stringify(
        message.value,
      )}`,
    );
    return await this.rarService.findAllForDashboard(message?.value?.criteria);
  }

  //D5 set vehicle avalibility from dashboard
  @MessagePattern(SET_VEHICLE_AVALIABILITY, Transport.TCP)
  async setVehiclesAvalibility(@Payload() message) {
    console.log('set vehicle avalibility master controller');
    this.logger.log(
      `[setVehiclesAvalibility] -> ${SET_VEHICLE_AVALIABILITY} | ${message}`,
    );
    message = JSON.parse(message);
    message = message.paramDTO;
    return await this.rarService.setVehiclesAvalibility(message);
  }

  //D6
  @MessagePattern(UPDATE_INVENTORY, Transport.TCP)
  async updateInventory(@Payload() message) {
    console.log('UPDATE_INVENTORY');
    this.logger.log(`[updateInventory] -> ${UPDATE_INVENTORY} | ${message}`);
    console.log(message);
    message = JSON.parse(message);
    message = message.updateData;
    console.log(message);
    return await this.rarService.updateInventory(message);
  }

  //A1 Show list of vehicle in apps
  @MessagePattern(SHOW_SELECT_MENU_FOR_APP, Transport.TCP)
  async showSelectMenuForApp() {
    this.logger.log(
      ` showSelectMenuForApp -> ${SHOW_SELECT_MENU_FOR_APP} | ${'message'}`,
    );
    let response = await this.rarService.showSelectMenuForApp();
    return response;
  }

  //A2 show selected vehicle details.
  @MessagePattern(GET_SELECTED_VEHICLE_DETAILS_FOR_APP, Transport.TCP)
  async getSelectedVehicleDetailsForApp(@Payload() body) {
    console.log('getSelectedVehicleDetailsForApp');
    this.logger.log(
      `[getSelectedVehicleDetailsForApp] -> ${GET_SELECTED_VEHICLE_DETAILS_FOR_APP} | ${body}`,
    );
    body = JSON.parse(body);
    body = body.body;
    return await this.rarService.getSelectedVehicleDetailsForApp(body);
  }

  //UPDATE_VEHICLE_DETAILS_INTO_COMPANY_INVENTORY

  // //5
  // @MessagePattern(REMOVE_VEHICLE_FROM_COMPANY_INVENTORY, Transport.TCP)
  // async removeVehicleFromCompanyInventary(@Payload() id) {
  //   console.log("1111111111 + inventry del");
  //   console.log(id)
  //   this.logger.log(
  //     `[removeVehicleFromCompanyInventary] -> ${REMOVE_VEHICLE_FROM_COMPANY_INVENTORY} | ${id}`
  //   );
  //   id = JSON.parse(id)
  //   console.log("22222222222 + inventry del");
  //   id = id.id;
  //   console.log(id)
  //   console.log(id)
  //   return await this.riideService.deleteDetailsById(
  //     id
  //   );
  // }

  // @MessagePattern(SET_VEHICLE_AVALIABILITY,Transport.TCP )
  // async setVehiclesAvalibility(@Payload() message) {
  //   console.table(message);
  //   console.log("00000000000000");
  //   this.logger.log(`[setVehiclesAvalibility] -> ${SET_VEHICLE_AVALIABILITY} | ${message}`);
  //   console.log("111111" + message);
  //   console.log("222222" + message.paramDTO);
  //   message = JSON.parse(message);
  //   console.log("33333");
  //   console.log(message);
  //   console.log("444444444");
  //   console.log(message.paramDTO);
  //   console.log("555555555")
  //   message = message.paramDTO;
  //   return await this.riideService.setVehiclesAvalibility(message);
  // }
}

/*


@MessagePattern(DELETE_COMPANY_VEHICLE,Transport.TCP )
async deleteCompanyVehicleDetails(@Payload() id ) {
  console.log("111111111111111");
  console.log(id)
;
  this.logger.log(`[deleteCompanyOwnVehicleDetails] -> ${DELETE_COMPANY_VEHICLE} | ${id}`);
  id = JSON.parse(id)
;
  console.log(id)
;
  id = id.paramDto.id;
  console.log("2222222222222222");
  console.log(id)
;
  return await this.rideARideService.deleteCompanyVehicleDetails(id)
;
}







//4
@MessagePattern(ADD_VEHICLE_TO_COMPANY_INVENTORY, Transport.TCP)
async addVehicleToCompanyInventry(@Payload() details) {
  console.log("11111111111");
  console.log(details);
  this.logger.log(
    `[addCompanyOwnVehicleDetails] -> ${ADD_VEHICLE_TO_COMPANY_INVENTORY} | ${details}`
  );
  details = JSON.parse(details);
  console.log("22222222222");
  console.log(details.paramDto);
  details = details.paramDto;
  return await this.rideARideService.addVehicleToCompanyInventry(
    details
  );
}

//5
@MessagePattern(REMOVE_VEHICLE_FROM_COMPANY_INVENTORY, Transport.TCP)
async removeVehicleFromCompanyInventary(@Payload() id) {
  console.log("1111111111 + inventry del");
  console.log(id)
;
  this.logger.log(
    `[removeVehicleFromCompanyInventary] -> ${REMOVE_VEHICLE_FROM_COMPANY_INVENTORY} | ${id}`
  );
  id = JSON.parse(id)
;
  console.log("22222222222 + inventry del");
  id = id.id;
  console.log(id)
;
  console.log(id)
;
  return await this.rideARideService.removeVehicleFromCompanyInventary(
    id
  );
}

//6
@MessagePattern(UPDATE_VEHICLE_DETAILS_INTO_COMPANY_INVENTORY, Transport.TCP)
async updateVehicleFromCompanyInventary(@Payload() message) {
  this.logger.log(
    `[GET_ALL_VEHICLES_FROM_COMPANY_INVENTARY] -> ${UPDATE_VEHICLE_DETAILS_INTO_COMPANY_INVENTORY} | ${message}`
  );
  message = JSON.parse(message).body;
  return await this.rideARideService.updateVehicleFromCompanyInventary(
    message
  );
}

//7
@MessagePattern(
  GET_ALL_VEHICLES_DETAILS_FROM_COMPANY_INVENTORY,
  Transport.TCP
)
async showAllCompanyVehicle(@Payload() message) {
  this.logger.log(
    `[GET_ALL_VEHICLES_FROM_COMPANY_INVENTARY] -> ${GET_ALL_VEHICLES_DETAILS_FROM_COMPANY_INVENTORY} | ${message}`
  );
  message = JSON.parse(message).body;
  return await this.rideARideService.showAllCompanyVehicle();
}

//8
@MessagePattern(
  GET_SINGLE_VEHICLE_DETAILS_FROM_COMPANY_INVENTORY,
  Transport.TCP
)
async getSingleVehicleDetails(@Payload() id) {
  console.log("1111111111 + CONTROLLER INVENTRY");
  console.log(id)
;

  this.logger.log(
    `[getSingleVehicleDetails] -> ${GET_SINGLE_VEHICLE_DETAILS_FROM_COMPANY_INVENTORY} | ${id}`
  );
  id = JSON.parse(id)
;
    console.log("22222222222222 + controller inventory")
  return await this.rideARideService.getSingleVehicleDetails(id)
;
}
*/
