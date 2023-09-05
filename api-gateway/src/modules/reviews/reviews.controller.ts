import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Put, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ReviewExternalType } from 'src/constants';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';
import { Request } from 'express'
import { RedisUserInterface } from '../captains/captain.interface';
import { ResponseHandler } from 'src/helpers/responseHandler';

@Controller('reviews')
export class ReviewsController {


  constructor(
    private reviewService: ReviewsService
  ) { }

  @Get('rider')
  async getRiderReviews(@Param('id') id: string, @Req() request: Request) {
    if ('user' in request) {
      const userDetails = request.user as RedisUserInterface;
      const response = await this.reviewService.getUserReview(userDetails?.id, ReviewExternalType.Rider)
      return ResponseHandler(response)
    } else {
      return ResponseHandler({ statusCode: HttpStatus.UNAUTHORIZED, message: "Not Authorized" })
    }
  }

  @Get('driver')
  async getDriverReviews(@Param('id') id: string, @Req() request: Request) {
    if ('user' in request) {
      const userDetails = request.user as RedisUserInterface;
      const response = await this.reviewService.getUserReview(userDetails?.id, ReviewExternalType.Captain)
      return ResponseHandler(response)
    } else {
      return ResponseHandler({ statusCode: HttpStatus.UNAUTHORIZED, message: "Not Authorized" })
    }
  }

  @Post('rider')
  @UsePipes(ValidationPipe)
  async createRiderReview(@Body() dto: CreateReviewDto, @Req() request: Request) {
    let externalId: string
    if ('user' in request) {
      const userDetails = request.user as RedisUserInterface;
      externalId = userDetails?.id || '';
    }
    const response = await this.reviewService.createReview({ ...dto, externalId, driverId: null }, ReviewExternalType.Rider)
    return ResponseHandler(response)
  }

  @Post('driver')
  @UsePipes(ValidationPipe)
  async createDriverReview(@Body() dto: CreateReviewDto, @Req() request: Request) {
    let externalId: string
    let driverId: string
    if ('user' in request) {
      const userDetails = request.user as RedisUserInterface;
      externalId = userDetails?.id || '';
      driverId = userDetails?.id || '';
    }
    const response = await this.reviewService.createReview({ ...dto, externalId, driverId }, ReviewExternalType.Captain)
    return ResponseHandler(response)
  }

  @Patch('update/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const response = await this.reviewService.updateReview(id, dto);
    return ResponseHandler(response)
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const response = await this.reviewService.deleteReview(id);
    return ResponseHandler(response)
  }

}
