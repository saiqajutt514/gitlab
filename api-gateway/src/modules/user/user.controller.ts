import {
  UsePipes,
  ValidationPipe,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Put,
  UseInterceptors,
  UploadedFile,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { PaginationCommonDto } from 'src/helpers/dto/pagination';
import { GetNotificationsDto } from './dto/get-notifications';
import { LoggerHandler } from 'src/helpers/logger-handler';
import {
  ListSearchSortDto,
  UpdateCustomerDto,
} from './dto/update-customer.dto';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenPayloadInterface } from '../admin/interfaces/token-payload.interface';
import {
  ClickPayCallBackResponseDto,
  customerKycDto,
  kycDto,
  UpdatePictureDto,
  userInfoDto,
} from '../admin/dto/admin-user.dto';
import { AwsS3Service } from 'src/helpers/aws-s3-service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  private readonly logger = new LoggerHandler(
    UserController.name,
  ).getInstance();

  @Get('get-balance')
  async getBalance(@Req() request) {
    this.logger.log(`[getBalance] ->`);
    const externalId: string = request?.user?.id;
    const response = await this.userService.getBalance(externalId);
    return ResponseHandler(response);
  }
  @Post('top-up-history')
  async topUpHistoryByUserId(@Req() request, @Body() body: ListSearchSortDto) {
    this.logger.log(`[top-up-history] ->`);
    const userId: string = request?.user?.id;
    body.filters.userId = userId;
    const response = await this.userService.topUpHistoryByUserId(body);
    return ResponseHandler(response);
  }

  @Get('validate-iban/:iban')
  async validateIban(@Req() request, @Param('iban') iban: string) {
    this.logger.log(`[validateIban] ->`);
    const externalId: string = request?.user?.id;
    const response = await this.userService.validateIban({ iban, externalId });
    return ResponseHandler(response);
  }

  @Get('get-iban')
  async getIban(@Req() request) {
    this.logger.log(`[validateIban] ->`);
    const externalId: string = request?.user?.id;
    const response = await this.userService.getIban({ iban: '0', externalId });
    return ResponseHandler(response);
  }

  @Post('clickpay-hosted-method-top-up')
  async HostedPaymentRequest(@Req() request, @Body() body) {
    this.logger.log(`[HostedPaymentRequest] -> ${JSON.stringify(body)}`);
    const externalId: string = request?.user?.id;
    const params = {
      userId: externalId,
      amount: body.amount,
      applePayToken: body?.applePayToken,
    };
    this.logger.log(
      `[HostedPaymentRequest] params-> ${JSON.stringify(params)}`,
    );

    const response = await this.userService.HostedPaymentRequest(params);
    return ResponseHandler(response);
  }

  @Post('clickpay-callback')
  async clickPayCallBack(@Body() body: ClickPayCallBackResponseDto) {
    this.logger.log(`[HostedPaymentRequest] -> ${JSON.stringify(body)}`);
    this.logger.log(`[HostedPaymentRequest] params-> ${JSON.stringify(body)}`);
    const response = await this.userService.clickPayCallBack(body);
    return ResponseHandler(response);
  }

  @Get('notifications')
  async getNotifications(
    @Query() params: PaginationCommonDto & GetNotificationsDto,
    @Req() request,
  ) {
    this.logger.log(
      `[getNotifications] -> params -> ${JSON.stringify(params)}`,
    );
    const externalId: string = request?.user?.id;
    const response = await this.userService.getNotifications(
      externalId,
      params,
    );
    return ResponseHandler(response);
  }

  @Post('sendSMTPEmail')
  async sendSMTPEmailHandler() {
    this.logger.log(`[sendSMTPEmail] Inside controller`);
    return await this.userService.sendSMTPEmailHandler();
  }

  @Get('get-all-active-users-locations')
  async getAllLocationsWithInDesireTime() {
    this.logger.log(`[getAllLocationsWithInDesireTime] Inside controller`);
    return await this.userService.getAllLocationsWithInDesireTime();
  }

  @Post('update-customer')
  @UsePipes(ValidationPipe)
  async updateCustomer(
    @Body() data: UpdateCustomerDto,
    @Req() request: Request,
  ) {
    this.logger.log(`[updateCustomer] body data: ${JSON.stringify(data)}`);
    const user: any = request?.user;
    let payload: UpdateCustomerDto = {
      deviceToken: data?.deviceToken,
      deviceName: data?.deviceName,
      latitude: data?.latitude,
      longitude: data?.longitude,
      deviceId: data?.deviceId,
      userId: user?.id,
      emailId: data?.email,
      mobileNo: data?.mobileNo,
      prefferedLanguage: data?.prefferedLanguage,
    };
    if (data?.profileImage == 'clear') {
      payload.profileImage = null;
    }

    this.logger.log(`[updateCustomer] payload: ${JSON.stringify(payload)}`);
    const response = await this.userService.updateCustomer(payload);
    return ResponseHandler(response);
  }

  @Post('/kyc')
  @UsePipes(ValidationPipe)
  async kyc(@Req() request, @Body() body: kycDto) {
    const externalId: string = request?.user?.id;
    const mobileNo: string = request?.user?.mobileNo;
    // console.log(request.user);
    const payload: customerKycDto = {
      userid: body.userId,
      mobileNo: mobileNo,
      dateOfBirth: body.dateOfBirth,
    };
    const response = await this.userService.customerKyc(payload);
    return ResponseHandler(response);
  }

  @Get('/kyc-status-check')
  @UsePipes(ValidationPipe)
  async kycStatusCheck(@Req() request) {
    this.logger.log(`[kycStatusCheck] ${request.user}`);
    const userId: string = request?.user?.id;
    const response = await this.userService.kycStatusCheck(userId);
    return ResponseHandler(response);
  }
  @Post('info')
  async userInfo(@Req() request, @Body() body: userInfoDto) {
    this.logger.log(`[info] ->`);
    const mobileNo: string = body?.phoneNumber;
    const response = await this.userService.userInfoForCustomerCare({
      mobileNo,
    });
    return ResponseHandler(response);
  }
  @Put('update-picture')
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async updateAdminPicture(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // const payload =
    const user: any = request?.user;
    let data: UpdatePictureDto = { profileImage: 'null' };
    const imgObject: any = file;
    if (imgObject?.fieldname === 'profileImage') {
      data = this.awsS3Service.uploadCustomerImage({ file: imgObject });
      console.log('Uploading images');
    }
    data = { ...data, userId: user?.id };
    console.log(data);
    const response = await this.userService.updatePicture(data);
    return ResponseHandler(response);
  }
}
