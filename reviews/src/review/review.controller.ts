import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { ReviewService } from './review.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  CREATE_REVIEW,
  DELETE_REVIEW,
  UPDATE_REVIEW,
  GET_REVIEWS,
  GET_REVIEWS_BY_EXTERNAL,
  GET_META_REVIEWS,
  GET_META_REVIEW_BY_EXTERNAL,
  GET_RATING_COUNTS_BY_EXTERNAL,
  DASHBOARD_REVIEW_STATS,
} from 'src/constants';
import { LoggerHandler } from 'src/helpers/logger.handler';

@Controller('review')
export class ReviewController {
  private customLogger = new LoggerHandler(ReviewController.name).getInstance();
  constructor(
    private readonly reviewService: ReviewService, // private customLogger: CustomLogger,
  ) {
    // this.customLogger.setContext(ReviewController.name);
  }

  @MessagePattern(CREATE_REVIEW, Transport.TCP)
  async createReviewHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(CREATE_REVIEW);
    return await this.reviewService.createReview(message.value);
  }

  @MessagePattern(GET_REVIEWS, Transport.TCP)
  async getReviewsHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(GET_REVIEWS);
    return await this.reviewService.getReviews(message.value);
  }

  @MessagePattern(GET_REVIEWS_BY_EXTERNAL, Transport.TCP)
  async getReviewsByExternal(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    return await this.reviewService.getReviewsByExternal(message.value);
  }

  @MessagePattern(GET_META_REVIEWS, Transport.TCP)
  async getMetaReviewsHandler(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(GET_META_REVIEWS);
    return await this.reviewService.getMetaReviews(message.value);
  }

  @MessagePattern(GET_META_REVIEW_BY_EXTERNAL, Transport.TCP)
  async getMetaReviewByExternal(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(GET_META_REVIEW_BY_EXTERNAL);
    return await this.reviewService.getMetaReviewByExternal(message.value);
  }

  @MessagePattern(GET_RATING_COUNTS_BY_EXTERNAL, Transport.TCP)
  async getRatingCountsByExternal(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(GET_RATING_COUNTS_BY_EXTERNAL);
    return await this.reviewService.getRatingCountsByExternal(message.value);
  }

  @MessagePattern(UPDATE_REVIEW, Transport.TCP)
  async update(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(UPDATE_REVIEW);
    const id: string = message.value?.id;
    const data: UpdateReviewDto = message.value?.data;
    return await this.reviewService.updateReview(id, data);
  }

  @MessagePattern(DELETE_REVIEW, Transport.TCP)
  async remove(@Payload() payload) {
    const message = { value: JSON.parse(payload) };
    this.customLogger.msgPattern(DELETE_REVIEW);
    const id: string = message.value?.id;
    return await this.reviewService.removeReview(id);
  }

  @MessagePattern(DASHBOARD_REVIEW_STATS, Transport.TCP)
  async getTotalReviewsForDash(@Payload() payload) {
    this.customLogger.msgPattern(DASHBOARD_REVIEW_STATS);
    const message = JSON.parse(payload);
    return await this.reviewService.getTotalReviewsForDash(message);
  }
}
