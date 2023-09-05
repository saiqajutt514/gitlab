import {
  Req,
  Controller,
  Get,
  Body,
  Post,
  Param,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Client, ClientProxy } from '@nestjs/microservices';
import { authTCPMicroServiceConfig } from 'config/authServiceConfig';
import { AppService } from './app.service';
import {
  sendOtp,
  verifyOtp,
  CarInfoDto,
  getCitizenInfoDto,
  getAlienInfoDto,
  getAlienDLInfoByIqama,
  getCitizenDLInfo,
} from './sendotp.dto';
import { Request } from 'express';
import { captainTCPConfig } from './microServiceConfigs/captain.microService.config';
import { AwsS3Service } from './helpers/aws-s3-service';

@Controller()
export class AppController {
  constructor(
    private readonly awsS3Service: AwsS3Service,
    private readonly appService: AppService,
  ) {}

  @Client(authTCPMicroServiceConfig)
  authTcpClient: ClientProxy;

  @Client(captainTCPConfig)
  clientCaptain: ClientProxy;

  @Post('/sendotp')
  @UsePipes(ValidationPipe)
  async test(@Body() body: sendOtp) {
    return await this.authTcpClient
      .send('send-otp', JSON.stringify({ body }))
      .pipe()
      .toPromise();
  }

  @Get('/getuserdetails')
  @UsePipes(ValidationPipe)
  async getuserdetails(@Req() req: Request) {
    const sessionHeader = req?.headers?.sessionid;
    const user: any = req?.user;
    return await this.authTcpClient
      .send(
        'get-user-details',
        JSON.stringify({
          sessionId: sessionHeader,
          syncData: true,
          returnRaw: true,
          userId: user?.id,
        }),
      )
      .pipe()
      .toPromise();
  }

  @Post('/verifyotp')
  @UsePipes(ValidationPipe)
  async verifyotp(@Body() body: verifyOtp) {
    return await this.authTcpClient
      .send('verify-otp', JSON.stringify({ body }))
      .pipe()
      .toPromise();
  }
  //TODO get user N-ID from DB
  @Post('/car-info-by-sequence')
  @UsePipes(ValidationPipe)
  async CAR_INFO_BY_SEQUENCE(@Body() body: CarInfoDto) {
    let resp = await this.authTcpClient
      .send('car-info-by-sequence', JSON.stringify(body))
      .pipe()
      .toPromise();
    if (resp?.statusCode == 200) {
      resp.data.ownerId = body?.userid;
      resp = await this.clientCaptain
        .send('create-car-info', JSON.stringify(resp.data))
        .pipe()
        .toPromise();
      if (resp?.data?.makerIcon != null) {
        await this.awsS3Service.getMakerIcon({
          name: resp.data.makerIcon,
        });
        resp.data.makerIcon = await this.awsS3Service.getMakerIcon({
          name: resp.data.makerIcon,
        });
      }
    }
    return resp;
  }

  @Get('/driver-welcome')
  @UsePipes(ValidationPipe)
  async driverwelcome(@Req() request: Request) {
    const message =
      'Welcome to Ride App. you have successfully registed on Ride App';
    const resp = await this.authTcpClient
      .send('send-sms', JSON.stringify({ ...request.user, message: message }))
      .pipe()
      .toPromise();
    return resp;
  }
}
