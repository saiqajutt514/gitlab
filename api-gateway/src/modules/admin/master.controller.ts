import {  Body, Controller, Get, HttpStatus, Param, Patch, Post, Query,UsePipes, ValidationPipe } from '@nestjs/common';
import { ResponseHandler } from 'src/helpers/responseHandler';
import { AdminService } from './admin.service';
import { AddSlaDto, UpdateSlaDto } from './dto/pages.dto';
import { REASON_TYPE } from './enum/rejected-reason.enum';
import { GetCabTypeQueryDto } from '../captains/dto/get-cab-type.dto';
import { AwsS3Service } from '../../helpers/aws-s3-service';

@Controller('master')
export class MasterController {
  
  constructor(
    private adminService: AdminService,
    private readonly awsS3Service: AwsS3Service
    ) { }
    
    // Rejected Reason
    
    @Get('rejected-reason/type/:type')
    async findAllReasonWithType(@Param('type') type: REASON_TYPE) {
      const response = await this.adminService.findAllReasonWithType(type);
      return ResponseHandler(response)
    }
    
    @Get('settings')
    async findSettings() {
      const response = await this.adminService.getAllSettings({ master: true })
      return ResponseHandler(response)
    }

    // Getting terms and coditions for SLA
    @Get('pages/:pageCode/:lang')
    async getSLAContent(@Param() params) {
      const response = await this.adminService.getSLAContent(params);
      return ResponseHandler(response)
    }
    
    @Post('pages/:pageCode')
    @UsePipes(ValidationPipe)
    async addSLAContent(@Body() params) {
      const response = await this.adminService.addSLAContent(params);
      return ResponseHandler(response)
    }

    @Patch('terms-conditions/:id')
    async updateSLAContent(@Param('id') id: string, @Body() body: UpdateSlaDto) {
      const response = await this.adminService.updateSLAContent(body, id);
      return ResponseHandler(response)
    }

    @Get('cab-type/:id')
    @UsePipes(ValidationPipe)
    async getCabType(@Param('id') id: string, @Query() query: GetCabTypeQueryDto) {
      // this.logger.log(`cab-type/:id -> get -> ${JSON.stringify(id)}`);
      const result = await this.adminService.getCabType(id, query);
      if (result.statusCode == HttpStatus.OK && result.data) {
        if (result.data?.categoryIcon) {
          result.data.categoryIconUrl = await this.awsS3Service.getCabTypeFile({ name: result.data?.categoryIcon });
        }
      }
      return ResponseHandler(result);
    }
    

  }
  