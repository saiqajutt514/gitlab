import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';

import { TripDestinationDto } from './dto/trip-destination.dto';
import {
  CabCalcParams,
  CabIdDto,
  DistanceDto,
  TimeDto,
} from './dto/estimate-cost.dto';
import {
  DeclineReasonDto,
  RiderTripCancelDto,
} from './dto/trip-cancel-reject.dto';
import { TripScheduleRiderDto } from './dto/trip-schedule-rider.dto';
import { TripStartedBodyDto } from './dto/trip-started.dto';
import {
  ScheduleTripsCreateDTO,
  TripIdParamDto,
  TripsCreateDTO,
  TripImageDto,
  TripPhotoDto,
  TRIP_IMAGE_BY,
} from './dto/trips.dto';
import { CreateEmergencyRequestDto } from './dto/trip-emergency-request.dto';
import { TripsService } from './trips.services';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { LoggerHandler } from 'src/helpers/logger-handler';

import { Request } from 'express';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripService: TripsService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  private readonly logger = new LoggerHandler(
    TripsController.name,
  ).getInstance();

  // ---------------------------------------------- Rider's Action -------------------------------------------------------- //

  // Create Trip
  @Post()
  @UsePipes(ValidationPipe)
  async createTrip(@Body() body: TripsCreateDTO, @Req() request) {
    const response = await this.tripService.createTrip(body, request?.user?.id);
    return ResponseHandler(response);
  }

  // Trip Request Cancel
  @Put('cancel-trip-request/:tripId')
  @UsePipes(ValidationPipe)
  async tripReqCancelByRider(@Param() param: TripIdParamDto, @Req() request) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.tripReqCancelByRider({
      ...param,
      riderId,
    });
    return ResponseHandler(response);
  }

  // Create Schedule Trip
  @Post('schedule')
  @UsePipes(ValidationPipe)
  async createScheduleTip(
    @Body() body: ScheduleTripsCreateDTO,
    @Req() request,
  ) {
    const response = await this.tripService.createScheduleTip(
      body,
      request?.user?.id,
    );
    return ResponseHandler(response);
  }

  // Find Trip With All Cabs ( Accept )
  @Patch('accept-trip-all-cab/:tripId')
  @UsePipes(ValidationPipe)
  async acceptTripWithAllCabs(@Param() param: TripIdParamDto, @Req() request) {
    const riderId: string = request?.user?.id;

    const response = await this.tripService.acceptTripWithAllCabs(
      param.tripId,
      riderId,
    );
    return ResponseHandler(response);
  }

  // Find Trip With All Cabs ( Decline )
  @Patch('decline-trip-all-cab/:tripId')
  @UsePipes(ValidationPipe)
  async declineTripWithAllCabs(@Param() param: TripIdParamDto, @Req() request) {
    const riderId: string = request?.user?.id;

    const response = await this.tripService.declineTripWithAllCabs(
      param.tripId,
      riderId,
    );
    return ResponseHandler(response);
  }

  // Trip Change Destination Location
  @Patch('change-destination/:tripId')
  @UsePipes(ValidationPipe)
  async changeTripDestination(
    @Param() param: TripIdParamDto,
    @Body() body: TripDestinationDto,
    @Req() request,
  ) {
    const riderId: string = request?.user?.id;
    const sessionId = request?.headers?.sessionid || '';
    const response = await this.tripService.changeTripDestination({
      ...param,
      ...body,
      riderId,
      sessionId,
    });
    return ResponseHandler(response);
  }

  // Trip Request Cancel
  @Patch('rider-cancelled/:tripId')
  @UsePipes(ValidationPipe)
  async tripCancelledByRider(
    @Param() param: TripIdParamDto,
    @Body() body: RiderTripCancelDto,
    @Req() request,
  ) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.tripCancelledByRider({
      ...param,
      ...body,
      riderId,
    });
    return ResponseHandler(response);
  }

  // Confirm Schedule Trip
  @Post('confirm-schedule/:tripId')
  @UsePipes(ValidationPipe)
  async confirmScheduleTip(@Param() param: TripIdParamDto, @Req() request) {
    const riderId: string = request?.user?.id;

    const response = await this.tripService.confirmScheduleTip({
      ...param,
      riderId,
    });
    return ResponseHandler(response);
  }

  // Confirm Schedule Trip
  @Post('decline-schedule/:tripId')
  @UsePipes(ValidationPipe)
  async declineScheduleTrip(@Param() param: TripIdParamDto, @Req() request) {
    const riderId: string = request?.user?.id;

    const response = await this.tripService.declineScheduleTrip({
      ...param,
      riderId,
    });
    return ResponseHandler(response);
  }

  // Get Recent Addresses
  @Get('rider-recent-addresses')
  @UsePipes(ValidationPipe)
  async getRecentAddresses(@Req() request) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.getRecentAddresses({ riderId });
    return ResponseHandler(response);
  }

  // Get Future Scheduled Trips
  @Get('rider-future-trips')
  @UsePipes(ValidationPipe)
  async getRiderFutureTrips(@Req() request) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.getRiderFutureTrips({ riderId });
    return ResponseHandler(response);
  }

  // Get Completed Trips
  @Get('rider-completed-trips')
  @UsePipes(ValidationPipe)
  async getCompletedTripsByRider(@Req() request) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.getCompletedTripsByRider({
      riderId,
    });
    return ResponseHandler(response);
  }

  // Get Cancelled Trips
  @Get('rider-cancelled-trips')
  @UsePipes(ValidationPipe)
  async getCancelledTripsByRider(@Req() request) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.getCancelledTripsByRider({
      riderId,
    });
    return ResponseHandler(response);
  }

  // Get All Trips
  @Get('rider')
  @UsePipes(ValidationPipe)
  async getAllTripsOfRider(@Req() request) {
    const riderId: string = request?.user?.id;
    const response = await this.tripService.getAllTripsOfRider({ riderId });
    return ResponseHandler(response);
  }

  @Post('emergency-request')
  @UsePipes(ValidationPipe)
  async createEmergencyRequest(
    @Body() params: CreateEmergencyRequestDto,
    @Req() request,
  ) {
    this.logger.log(`emergency-requests -> body -> ${JSON.stringify(params)}`);
    params.rider = request?.user?.id;
    const response = await this.tripService.createEmergencyRequest(params);
    return ResponseHandler(response);
  }

  // ---------------------------------------------- Rider's Action -------------------------------------------------------- //

  // ---------------------------------------------- Driver's Action -------------------------------------------------------- //
  //high demand zone
  @Get('high-demand_zones')
  async highDemandZones(@Req() request) {
    this.logger.log(` allDemandZone -> `);
    const userId: string = request?.user?.id;
    const response = await this.tripService.highDemandZones(userId);
    return ResponseHandler(response);
  }
  // Trip Request Accept
  @Patch('driver-accepted/:tripId')
  @UsePipes(ValidationPipe)
  async tripAcceptedByDriver(@Param() param: TripIdParamDto, @Req() request) {
    const driverId: string = request?.user?.id;
    const sessionId = request?.headers?.sessionid || '';
    const response = await this.tripService.tripAcceptedByDriver({
      ...param,
      driverId,
      sessionId,
    });
    return ResponseHandler(response);
  }

  // Trip Request Reject
  @Patch('driver-rejected/:tripId')
  @UsePipes(ValidationPipe)
  async tripRejectedByDriver(
    @Param() param: TripIdParamDto,
    @Body() body: DeclineReasonDto,
    @Req() request,
  ) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.tripRejectedByDriver({
      ...param,
      ...body,
      driverId,
    });
    return ResponseHandler(response);
  }

  // Trip Request Cancel
  @Patch('driver-cancelled/:tripId')
  @UsePipes(ValidationPipe)
  async tripCancelledByDriver(
    @Param() param: TripIdParamDto,
    @Body() body: DeclineReasonDto,
    @Req() request,
  ) {
    const driverId: string = request?.user?.id;
    const sessionId = request?.headers?.sessionid || '';
    const response = await this.tripService.tripCancelledByDriver({
      ...param,
      ...body,
      driverId,
      sessionId,
    });
    return ResponseHandler(response);
  }

  // Reached At Pick-Up Point
  @Patch('driver-reached-at-pickup-point/:tripId')
  @UsePipes(ValidationPipe)
  async driverReachedAtPickUpPoint(
    @Param() param: TripIdParamDto,
    @Req() request,
  ) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.driverReachedAtPickUpPoint({
      ...param,
      driverId,
    });
    return ResponseHandler(response);
  }

  // Trip Start With OTP Verification
  @Patch('started/:tripId')
  @UsePipes(ValidationPipe)
  async tripStartedByDriver(
    @Param() param: TripIdParamDto,
    @Body() body: TripStartedBodyDto,
    @Req() request,
  ) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.tripStartedByDriver({
      ...param,
      ...body,
      driverId,
    });
    return ResponseHandler(response);
  }

  // Trip Finish
  @Patch('completed/:tripId')
  @UsePipes(ValidationPipe)
  async tripCompleted(
    @Param() param: TripIdParamDto,
    @Body() body: TripDestinationDto,
    @Req() request,
  ) {
    const driverId: string = request?.user?.id;
    const sessionId = request?.headers?.sessionid || '';
    const response = await this.tripService.tripCompleted({
      ...param,
      ...body,
      driverId,
      sessionId,
    });
    return ResponseHandler(response);
  }

  // Get Completed Trips
  @Get('driver-completed-trips')
  @UsePipes(ValidationPipe)
  async getCompletedTripsByDriver(@Req() request) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.getCompletedTripsByDriver({
      driverId,
    });
    return ResponseHandler(response);
  }

  // Get Cancelled Trips
  @Get('driver-cancelled-trips')
  @UsePipes(ValidationPipe)
  async getCancelledTripsByDriver(@Req() request) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.getCancelledTripsByDriver({
      driverId,
    });
    return ResponseHandler(response);
  }

  // Get All Trips
  @Get('driver')
  @UsePipes(ValidationPipe)
  async getAllTripsOfDriver(@Req() request) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.getAllTripsOfDriver({ driverId });
    return ResponseHandler(response);
  }

  // ---------------------------------------------- Driver's Action -------------------------------------------------------- //

  // ---------------------------------------------- Common Action -------------------------------------------------------- //

  @Get('socket/:tripId')
  @UsePipes(ValidationPipe)
  async getSocketTripDetailById(
    @Param() param: TripIdParamDto,
    @Req() request,
  ) {
    const driverId: string = request?.user?.id;
    const response = await this.tripService.getSocketTripDetailById({
      ...param,
      driverId,
    });
    return ResponseHandler(response);
  }

  @Get('exists')
  @UsePipes(ValidationPipe)
  async checkTripExists(@Req() request) {
    const riderId: string = request?.user?.id;
    const driverId: string = request?.user?.id;
    const response = await this.tripService.checkTripExists({
      riderId,
      driverId,
    });
    return ResponseHandler(response);
  }

  @Get(':tripId')
  @UsePipes(ValidationPipe)
  async getTripDetailById(@Param() param: TripIdParamDto) {
    const response = await this.tripService.getTripDetailById(param);
    return ResponseHandler(response);
  }

  @Get('invoice/:tripId')
  @UsePipes(ValidationPipe)
  async getTripInvoiceById(@Param() param: TripIdParamDto) {
    const response = await this.tripService.getTripInvoiceById(param);
    return ResponseHandler(response);
  }

  @Post('estimate-cost/:cabId')
  @UsePipes(ValidationPipe)
  async estimateFareAmount(
    @Param() param: CabIdDto,
    @Body() body: DistanceDto & TimeDto & CabCalcParams,
  ) {
    const response = await this.tripService.estimateFareAmount({
      ...param,
      ...body,
    });
    return ResponseHandler(response);
  }

  @Post('syncCustomerDetails')
  @UsePipes(ValidationPipe)
  async syncCustomerDetails(@Req() request: Request) {
    return await this.tripService.syncCustomerDetails(request);
  }

  @Patch('upload-photo/:tripId')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'riderPhoto',
          maxCount: 1,
        },
        {
          name: 'driverPhoto',
          maxCount: 1,
        },
      ],
      {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
          }
          cb(null, true);
        },
      },
    ),
  )
  async uploadTripPhoto(
    @Param() param: TripIdParamDto,
    @Body() body: TripPhotoDto,
    @UploadedFiles() files,
  ) {
    let imgParams: TripImageDto[] = [];
    const riderPhoto = files.riderPhoto?.[0];
    const driverPhoto = files.driverPhoto?.[0];
    if (riderPhoto) {
      const s3ImageLink = this.awsS3Service.uploadTripFile({
        id: param.tripId,
        type: `trip-rider-photo-${body.type}`,
        file: riderPhoto,
      });
      imgParams.push({ ...s3ImageLink, imageBy: TRIP_IMAGE_BY.RIDER });
    }
    if (driverPhoto) {
      const s3ImageLink = this.awsS3Service.uploadTripFile({
        id: param.tripId,
        type: `trip-driver-photo-${body.type}`,
        file: driverPhoto,
      });
      imgParams.push({ ...s3ImageLink, imageBy: TRIP_IMAGE_BY.DRIVER });
    }
    const response = await this.tripService.uploadTripPhoto({
      ...param,
      ...body,
      images: imgParams,
    });
    return ResponseHandler(response);
  }

  // ---------------------------------------------- Common Action -------------------------------------------------------- //
}
