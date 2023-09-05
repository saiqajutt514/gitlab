import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { errorMessage, successMessage } from 'src/constants/messages';
import { ResponseData } from 'src/helpers/ResponseHandler';
import { CustomLogger } from 'src/logger/customLogger';

import { CreateReviewDto } from './dto/create-review.dto';
import {
  ExternalReviewDetailDto,
  ExternalReviewsListDto,
} from './dto/external-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRatingMetaEntity } from './entities/ratingMeta.entity';
import { UserRatingMetaRepository } from './repositories/rating-meta.repository';
import { ReviewRepository } from './repositories/review.repository';
import { ReviewExternalType } from 'src/constants';
import { LoggerHandler } from 'src/helpers/logger.handler';
import { StatsParams } from './dto/dash-review-stats.dto';
import { getDateBounds } from 'src/helpers/date-functions';
import { calculatePercentage } from 'utils/math-functions';

@Injectable()
export class ReviewService {
  private customLogger = new LoggerHandler(ReviewService.name).getInstance();

  constructor(
    @InjectRepository(ReviewRepository)
    private reviewRepository: ReviewRepository,

    @InjectRepository(UserRatingMetaRepository)
    private reviewMetaRepository: UserRatingMetaRepository, // private customLogger: CustomLogger,
  ) {
    // this.customLogger.setContext(ReviewService.name);
  }

  async createReview(createReviewDto: CreateReviewDto) {
    try {
      const { externalIdFor, externalIdBy, externalType } = createReviewDto;
      this.customLogger.start(
        `[createReview] | externalIdFor: ${externalIdFor} | externalIdBy: ${externalIdBy} | externalType: ${externalType}`,
      );

      const reviewToCreate = this.reviewRepository.create(createReviewDto);
      const review = await this.reviewRepository.save(reviewToCreate);

      let metaExteralType;
      if (ReviewExternalType.Rider === externalType) {
        metaExteralType = ReviewExternalType.Captain;
      } else {
        metaExteralType = ReviewExternalType.Rider;
      }
      let reviewMeta: UserRatingMetaEntity = await this.reviewMetaRepository.findOne(
        {
          where: {
            externalId: externalIdFor,
            externalType: metaExteralType,
          },
        },
      );
      if (reviewMeta) {
        const newReviewCount: number = reviewMeta.reviewCount + 1;
        const newRating: number =
          (reviewMeta.rating * reviewMeta.reviewCount + review.rating) /
          newReviewCount;
        reviewMeta.reviewCount = newReviewCount;
        reviewMeta.rating = Math.round(newRating * 100) / 100 || 0;
        await reviewMeta.save();
        this.customLogger.log(`[createReview] => Meta record updated`);
      } else {
        reviewMeta = this.reviewMetaRepository.create({
          externalId: externalIdFor,
          externalType: metaExteralType,
          rating: review.rating,
          reviewCount: 1,
        });
        await this.reviewMetaRepository.save(reviewMeta);
        this.customLogger.log(`[createReview] => Meta record created`);
      }
      this.customLogger.end(`[createReview] | externalId: ${externalIdFor}`);
      return ResponseData.success(review);
    } catch (e) {
      this.customLogger.catchError('createReview', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getReviews(reviewIds) {
    try {
      this.customLogger.start(
        `[getReviews] | reviewIds: ${JSON.stringify(reviewIds)}`,
      );
      if (reviewIds.length <= 0) {
        return ResponseData.success([]);
      }
      const reviews = await this.reviewRepository
        .createQueryBuilder('trip_feedback')
        .where('trip_feedback.id IN (:...reviewIds)', { reviewIds })
        .getMany();
      this.customLogger.end(
        `[getReviews] | reviewIds: ${JSON.stringify(reviewIds)}`,
      );
      return ResponseData.success(reviews);
    } catch (e) {
      this.customLogger.catchError('getReviews', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getReviewsByExternal(dto: ExternalReviewDetailDto) {
    try {
      const { externalId, externalType } = dto;
      this.customLogger.start(
        '[getReviewsByExternal] | externalId: ' + externalId,
      );
      const reviews = await this.reviewRepository
        .createQueryBuilder('trip_feedback')
        .where({
          externalIdBy: externalId,
          externalType: externalType,
        })
        .getMany();
      // const ratingArray = reviews.map((review) => review.rating)
      // let ratings = 0;
      // if (ratingArray && ratingArray.length > 0) {
      //   ratings = ratingArray.reduce((a, b) => a + b)
      // }
      // const overallRating = ratings / ratingArray.length
      this.customLogger.end(
        '[getReviewsByExternal] | externalId: ' + externalId,
      );
      return ResponseData.success({ reviews });
    } catch (e) {
      this.customLogger.catchError('getReviewsByExternal', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getMetaReviews(dto: ExternalReviewsListDto) {
    try {
      const { externalIds, externalType } = dto;
      this.customLogger.start(
        'In Get Meta Reviews By ExternalId -----externalId: ' +
          JSON.stringify(externalIds),
      );
      const metaReviews = await this.reviewMetaRepository
        .createQueryBuilder('user_ratings_meta')
        .where('user_ratings_meta.externalId IN (:...externalIds)', {
          externalIds,
        })
        .andWhere('user_ratings_meta.externalType = :externalType ', {
          externalType,
        })
        .getMany();
      this.customLogger.end(
        'Get Meta Reviews By ExternalId has success -----externalId: ' +
          externalIds,
      );
      return ResponseData.success(metaReviews);
    } catch (err) {
      this.customLogger.catchError(
        'Get Meta Reviews by external has error: ',
        err.message,
      );
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getMetaReviewByExternal(dto: ExternalReviewDetailDto) {
    try {
      const { externalId, externalType } = dto;
      this.customLogger.start(
        '[getMetaReviewByExternal] | externalId: ' + externalId,
      );
      const metaReview = await this.reviewMetaRepository.findOne({
        externalType,
        externalId,
      });
      this.customLogger.end(
        '[getMetaReviewByExternal] | externalId: ' + externalId,
      );
      return ResponseData.success({
        overallRating: metaReview?.rating,
        overallReviews: metaReview?.reviewCount,
      });
    } catch (e) {
      this.customLogger.catchError('getMetaReviewByExternal', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async getRatingCountsByExternal(dto: ExternalReviewDetailDto) {
    try {
      const { externalId, externalType } = dto;
      this.customLogger.start(
        '[getRatingCountsByExternal] | externalId: ' + externalId,
      );
      const reviews = await this.reviewRepository
        .createQueryBuilder('trip_feedback')
        .select([
          'COUNT(CASE WHEN (rating >= 0.5 AND rating < 1.5) THEN 1 END) as star_1',
          'COUNT(CASE WHEN (rating >= 1.5 AND rating < 2.5) THEN 1 END) as star_2',
          'COUNT(CASE WHEN (rating >= 2.5 AND rating < 3.5) THEN 1 END) as star_3',
          'COUNT(CASE WHEN (rating >= 3.5 AND rating < 4.5) THEN 1 END) as star_4',
          'COUNT(CASE WHEN (rating >= 4.5) THEN 1 END) as star_5',
        ])
        .where({
          externalIdFor: externalId,
          externalType: externalType,
        })
        .getRawMany();
      this.customLogger.log(JSON.stringify(reviews));
      this.customLogger.end(
        '[getRatingCountsByExternal] | externalId: ' + externalId,
      );
      return ResponseData.success(reviews);
    } catch (e) {
      this.customLogger.catchError('getRatingCountsByExternal', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findAll() {
    try {
      this.customLogger.start('[findAll]');
      const results = await this.reviewRepository.findAndCount();
      this.customLogger.end('[findAll]');
      return ResponseData.success(results);
    } catch (e) {
      this.customLogger.catchError('findAll', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async findOne(id: string) {
    try {
      this.customLogger.start('[findOne] | id: ' + id);
      const result = await this.reviewRepository.findOne(id);
      if (!result) {
        throw new HttpException(
          errorMessage.REVIEW_NOT_FOUND,
          HttpStatus.BAD_REQUEST,
        );
      }
      this.customLogger.end('[findOne] | id: ' + id);
      return ResponseData.success(result);
    } catch (e) {
      this.customLogger.catchError('findOne', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto) {
    try {
      this.customLogger.start('[updateReview] | id: ' + id);
      await this.findOne(id);
      await this.reviewRepository.update(id, updateReviewDto);
      this.customLogger.end('[updateReview] | id: ' + id);
      return ResponseData.success({
        id,
        message: successMessage.RECORD_UPDATED,
      });
    } catch (e) {
      this.customLogger.catchError('updateReview', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  async removeReview(id: string) {
    try {
      this.customLogger.start('[removeReview] | id: ' + id);
      await this.findOne(id);
      await this.reviewRepository.delete(id);
      this.customLogger.end('[removeReview] | id: ' + id);
      return ResponseData.success({
        id,
        message: successMessage.RECORD_REMOVED,
      });
    } catch (e) {
      this.customLogger.catchError('removeReview', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }

  // for dashboard ratingsor reviews
  async getTotalReviewsForDash(params: StatsParams) {
    try {
      console.log(params);
      let { fromDate, toDate, entity } = params;
      const type: string = params.type || 'week';

      let startDate, endDate;
      if (type === 'custom') {
        startDate = fromDate;
        endDate = toDate;
      } else {
        [startDate, endDate] = getDateBounds(type, 'blocks');
      }
      console.log(entity);

      this.customLogger.start('[getRatingCountsByExternal] | externalId: ');

      const dbResponse = this.reviewRepository.createQueryBuilder(
        'trip_feedback',
      );
      dbResponse.select([
        'COUNT(CASE WHEN (rating >= 0.5 AND rating < 1.5) THEN 1 END) as poor',
        'COUNT(CASE WHEN (rating >= 1.5 AND rating < 2.5) THEN 1 END) as average',
        'COUNT(CASE WHEN (rating >= 2.5 AND rating < 3.5) THEN 1 END) as good',
        'COUNT(CASE WHEN (rating >= 3.5 AND rating < 4.5) THEN 1 END) as best',
        'COUNT(CASE WHEN (rating >= 4.5) THEN 1 END) as excelent',
      ]);

      if (params.entity == 'rider') {
        console.log('------s-------------s------------s-----------');
        dbResponse.andWhere('trip_feedback.externalType = :externalType', {
          externalType: '2',
        });
      } else {
        dbResponse.andWhere('trip_feedback.externalType = :externalType', {
          externalType: '1',
        });
      }
      //dbResponse.where("trip_feedback.externalType != :externalType",{externalType: externalType});

      if (endDate && startDate) {
        console.log('chal gae');
        dbResponse.andWhere(
          "DATE_FORMAT(trip_feedback.createdAt, '%Y-%m-%d') >= :startDate",
          { startDate },
        );
        dbResponse.andWhere(
          "DATE_FORMAT(trip_feedback.createdAt, '%Y-%m-%d') <= :endDate",
          { endDate },
        );
      }
      let reviews = await dbResponse.getRawMany();

      let total = Math.round(
        parseInt(reviews[0].excelent) +
          parseInt(reviews[0].best) +
          parseInt(reviews[0].average) +
          parseInt(reviews[0].poor) +
          parseInt(reviews[0].good),
      );
      let excelentP: number = Math.round(
        calculatePercentage(reviews[0].excelent, total),
      );
      let bestP: number = Math.round(
        calculatePercentage(reviews[0].best, total),
      );
      let goodP: number = Math.round(
        calculatePercentage(reviews[0].good, total),
      );
      let averageP: number = Math.round(
        calculatePercentage(reviews[0].average, total),
      );
      let poorP: number = Math.round(
        calculatePercentage(reviews[0].poor, total),
      );
      const finalResponse = {
        total: total,
        percentage: {
          excelent: excelentP,
          best: bestP,
          good: goodP,
          average: averageP,
          poor: poorP,
        },
        count: {
          excelent: parseInt(reviews[0].excelent),
          best: parseInt(reviews[0].best),
          good: parseInt(reviews[0].good),
          average: parseInt(reviews[0].average),
          poor: parseInt(reviews[0].poor),
        },
      };
      this.customLogger.log(
        'getTotalReviewsForDash' + JSON.stringify(finalResponse),
      );
      return ResponseData.success(finalResponse);
    } catch (e) {
      this.customLogger.catchError('getTotalReviewsForDash', e.message);
      return ResponseData.error(
        HttpStatus.BAD_REQUEST,
        errorMessage.SOMETHING_WENT_WRONG,
      );
    }
  }
}
