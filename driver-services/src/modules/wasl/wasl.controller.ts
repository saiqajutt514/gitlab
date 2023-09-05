import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { MessagePattern, Payload, Transport } from "@nestjs/microservices";
import { WASL_TRIP_CHECK } from "src/constants/kafka-constant";
import { DriverVehicleRegistrationDto } from "./dto/driver-vehicle-registration.dto";
import { TripRegistrationDto } from "./dto/trip-registration.dto";
import { UpdateCurrentLocationDto } from "./dto/update-current-location.dto";
import { RegistrationInterface } from "./interface/wasl.request.interface";
import { WASLService } from "./wasl.service";

@Controller("wasl")
export class WASLController {
  constructor(private waslService: WASLService) {}

  @Post("driver")
  @UsePipes(ValidationPipe)
  async registerDriverVehicle(@Body() registerDto: any) {
    console.log("i'm in register drver")
    // need to change later and make registerDto according to api-gateway input
    
      
    return await this.waslService.registerDriverVehicle(registerDto);
  }

  @Post("drivers/eligibility")
  async getAllDriversEligibility(@Body() driverIds: string[]) {
    return await this.waslService.getAllDriversEligibility(driverIds);
  }

  @Get("drivers/eligibility/:driverIdentityNumber")
  async getDriverEligibility(
    @Param("driverIdentityNumber") driverIdentityNumber: string
  ) {
    return await this.waslService.getDriversEligibility(driverIdentityNumber);
  }

  @Post("trips")
  @UsePipes(ValidationPipe)
  async registerTrip(@Body() registerTripDto: TripRegistrationDto) {
    return await this.waslService.registerTrip(registerTripDto);
  }

  @Post("locations")
  @UsePipes(ValidationPipe)
  async updateCurrentLocation(
    @Body() updateCurrentLocationDto: UpdateCurrentLocationDto
  ) {
    return await this.waslService.updateCurrentLocation(
      updateCurrentLocationDto
    );
  }

  @MessagePattern(WASL_TRIP_CHECK, Transport.TCP)
  async waslTripCheck(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    return await this.waslService.registerTrip(message.value);
  }
}
