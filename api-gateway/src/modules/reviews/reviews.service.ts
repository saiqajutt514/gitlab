import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, ClientKafka, ClientProxy } from '@nestjs/microservices';
import { reviewsKafkaConfig, reviewsTCPConfig, tripKafkaMicroServiceConfig, tripTCPMicroServiceConfig } from 'src/microServiceConfigs';
import { CreateReviewDto, ExternalIdDto, DriverIdDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  CAN_REVIEW,
  GET_REVIEWS_BY_EXTERNAL,
  CREATE_TRIP_REVIEW,
  UPDATE_REVIEW,
  DELETE_REVIEW,
  reviewRequestPattern,
  tripRequestPatterns
} from './constants/kafka-constants';
import { ReviewExternalType } from './constants/reviews.enum'

@Injectable()
export class ReviewsService implements OnModuleInit {

  constructor(
    @Inject('CLIENT_REVIEW_SERVICE_TCP') private clientReviewTCP: ClientProxy
  ) { }

  // @Client(reviewsKafkaConfig)
  // reviewClientKafka: ClientKafka;

  // @Client({
  //   ...tripKafkaMicroServiceConfig,
  //   options: {
  //     ...tripKafkaMicroServiceConfig.options,
  //     consumer: {
  //       groupId: 'trip-consumer-review',
  //     }
  //   }
  // })
  // tripKafkaClient: ClientKafka

  @Client(tripTCPMicroServiceConfig)
  tripTcpClient: ClientProxy;

  onModuleInit() {
    // reviewRequestPattern.forEach(pattern => {
    //   this.reviewClientKafka.subscribeToResponseOf(pattern);
    // });
    // tripRequestPatterns.forEach(pattern => {
    //   this.tripKafkaClient.subscribeToResponseOf(pattern);
    // });
  }

  async getUserReview(externalId: string, externalType: ReviewExternalType) {
    return await this.clientReviewTCP.send(GET_REVIEWS_BY_EXTERNAL, JSON.stringify({ externalId, externalType })).pipe().toPromise()
  }

  async createReview(createReviewDto: CreateReviewDto & ExternalIdDto & DriverIdDto, externalType: ReviewExternalType) {
    Logger.log({ createReviewDto }, 'createReviewDto')
    // const tripId = await this.tripTcpClient.send(CAN_REVIEW, JSON.stringify({
    //   externalType: externalType,
    //   externalId: createReviewDto.externalId,
    //   driverId: createReviewDto.driverId,
    // })).pipe().toPromise()
    return await this.tripTcpClient.send(CREATE_TRIP_REVIEW, JSON.stringify({ ...createReviewDto, externalType })).pipe().toPromise();
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto) {
    return await this.clientReviewTCP.send(UPDATE_REVIEW, JSON.stringify({ id, data: updateReviewDto })).pipe().toPromise()
  }

  async deleteReview(id: string) {
    return await this.clientReviewTCP.send(DELETE_REVIEW, JSON.stringify({ id })).pipe().toPromise()
  }

}