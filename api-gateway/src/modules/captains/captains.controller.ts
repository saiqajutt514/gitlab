import {
  Req,
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
  Logger,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { Request } from 'express';

import { CaptainService } from './captains.services';
import {
  BecomeCaptainDto,
  BecomeCaptainWASLDto,
} from './dto/become-captain.dto';
import { RedisUserInterface } from './captain.interface';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { PaginationCommonDto } from 'src/helpers/dto/pagination';
import { subscriptionEarningDto } from './dto/subscription-earning.dto';
import { LoggerHandler } from 'src/helpers/logger-handler';
import { AwsS3Service } from '../../helpers/aws-s3-service';
import {
  purchaseSubscriptionDto,
  updateSubsriptionPackageDto,
  userDto,
} from './dto/purchase-subscription.dto';
@Controller('captains')
export class CaptainController {
  constructor(
    private readonly captainService: CaptainService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  private readonly logger = new LoggerHandler(
    CaptainController.name,
  ).getInstance();

  // Captain APIs

  @Post('find-nearest-drivers')
  async findNearestDriversHandler(@Body() body) {
    this.logger.log(`find-nearest-drivers -> body -> ${JSON.stringify(body)}`);
    const response = await this.captainService.findNearestDriversService(body);
    return ResponseHandler(response);
  }

  @Post('wasl-check')
  @UsePipes(ValidationPipe)
  async waslCaptainCheck(
    @Body() becomeCaptain: BecomeCaptainWASLDto,
    @Req() request: Request,
  ) {
    this.logger.log(`wasl-check -> body -> ${JSON.stringify(becomeCaptain)}`);
    const checkPlatNo = becomeCaptain.carPlateNo.split('-');
    if (checkPlatNo?.length === 2 && checkPlatNo[1]?.length === 3) {
      const response = await this.captainService.waslCheck(
        becomeCaptain,
        request.user as RedisUserInterface,
      );
      return ResponseHandler(response);
    } else {
      return ResponseHandler({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Please enter carPlatNo in right format',
      });
    }
  }

  @Post('become-captain')
  @UsePipes(ValidationPipe)
  async becomeCaptain(
    @Body() becomeCaptain: BecomeCaptainDto,
    @Req() request: Request,
  ) {
    this.logger.log(
      `become-captain -> body -> ${JSON.stringify(becomeCaptain)}`,
    );
    const checkPlatNo = becomeCaptain.carPlateNo.split('-');
    if (checkPlatNo?.length === 2 && checkPlatNo[1]?.length === 3) {
      const sessionId = request?.headers?.sessionid || '';
      const response = await this.captainService.becomeCaptain(
        becomeCaptain,
        request.user as RedisUserInterface,
        String(sessionId),
      );
      return ResponseHandler(response);
    } else {
      return ResponseHandler({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Please enter carPlatNo in right format',
      });
    }
  }

  @Post('change-driver-mode')
  @UsePipes(ValidationPipe)
  async changeDriverMode(@Req() request) {
    const driverId: string = request?.user?.driverId;
    this.logger.log(`change-driver-mode -> id -> ${JSON.stringify(driverId)}`);
    const response = await this.captainService.changeDriverMode(driverId);
    return ResponseHandler(response);
  }

  @Get()
  @UsePipes(ValidationPipe)
  async findOneCaptain(@Req() request) {
    const id: string = request?.user?.id;
    this.logger.log(`captain-details -> id -> ${JSON.stringify(id)}`);
    const response = await this.captainService.getCaptain(id);
    if (response?.statusCode === HttpStatus.OK) {
      if (response?.data?.cab) {
        if (response?.data?.cab?.categoryIcon) {
          response['data']['cab'][
            'categoryIcon'
          ] = await this.awsS3Service.getCabTypeFile({
            name: response?.data?.cab?.categoryIcon,
          });
        }
      }
    }
    return ResponseHandler(response);
  }

  // Captain renewal subscriptions
  @Post('subscriptions')
  @UsePipes(ValidationPipe)
  async findAllSubscriptions(
    @Body() body: PaginationCommonDto,
    @Req() request,
  ) {
    const userId: string = request?.user?.id;
    this.logger.log(
      `[findAllSubscriptions] | driverId: ${userId} | pagination: ${JSON.stringify(
        body,
      )}`,
    );

    const response = await this.captainService.findAllSubscriptions(
      userId,
      body,
    );
    return ResponseHandler(response);
  }

  // Captain earnings
  @Post('earnings')
  async findAllEarnings(@Body() body: subscriptionEarningDto, @Req() request) {
    const userId: string = request?.user?.id;
    const response = await this.captainService.findAllEarnings(userId, body);
    return ResponseHandler(response);
  }

  // Subscription Cancel
  @Put('subscription/cancel')
  async cancel(@Req() request) {
    const userId: string = request?.user?.id;
    const response = await this.captainService.cancel(userId);
    return ResponseHandler(response);
  }

  // Subscription Active
  @Put('subscription/activate')
  async activate(@Req() request) {
    const userId: string = request?.user?.id;
    const response = await this.captainService.activate(userId);
    return ResponseHandler(response);
  }

  @Post('subscription/purchase')
  async purchase(
    @Req() request,
    @Body() body: purchaseSubscriptionDto & userDto,
  ) {
    const userId: string = request?.user?.id;
    body = { ...body, userId };
    const response = await this.captainService.purchase(body);
    return ResponseHandler(response);
  }

  @Get('subscription/invoice')
  async getSubInvoice(@Req() request) {
    const userId: string = request?.user?.id;
    const response = await this.captainService.getSubInvoice(userId);
    return ResponseHandler(response);
  }

  @Post('subscription/update')
  async updateSubsriptionPackage(
    @Req() request,
    @Body() body: updateSubsriptionPackageDto,
  ) {
    const userId: string = request?.user?.id;
    const data = { subscriptionId: body.subscriptionId, userId: userId };
    const response = await this.captainService.updateSubsriptionPackage(data);
    return ResponseHandler(response);
  }

  @Post('subscription/change-renwal-status')
  async changeAutoRenewalStatus(@Req() request) {
    const userId: string = request?.user?.id;
    const response = await this.captainService.changeAutoRenewalStatus(userId);
    return ResponseHandler(response);
  }
  @Post('verify-subscription')
  async verifySubscription(@Req() request, @Body() body) {
    const id: string = request?.user?.id;
    this.logger.log(
      `verify-subscription -> id -> ${JSON.stringify({ id, body })}`,
    );
    const response = await this.captainService.verifySubscription(id, body);
    return ResponseHandler(response);
  }
}
