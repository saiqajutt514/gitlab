import { Controller, Get, Body, Patch, Param, Logger } from '@nestjs/common';
import { TripDriversService } from './trip_drivers.service';
import { UpdateTripDriverDto } from './dto/trip_driver.dto';

@Controller('trip-drivers')
export class TripDriversController {
  constructor(
    private tripDriversService: TripDriversService,
  ) { }

  private readonly logger = new Logger(TripDriversController.name);

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripDriversService.findOne({ id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTripDriverDto: UpdateTripDriverDto) {
    return this.tripDriversService.update(id, updateTripDriverDto);
  }
}
