import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
  Req,
} from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserService } from './modules/user/user.service';
import { AdminService } from './modules/admin/admin.service';

import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { AdminMiddleware } from 'src/middleware/admin.middleware';

import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromoCodeModule } from './modules/promo-code/promo-code.module';
import { TripsModule } from './modules/trips/trips.module';
import { CaptainModule } from './modules/captains/captains.module';
import { AdminModule } from './modules/admin/admin.module';
import { UserModule } from './modules/user/user.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { ChatModule } from './modules/chat/chat.module';

import { AppLoggerMiddleware } from './middleware/logger.middleware';
import { LoggerModule } from 'nestjs-pino';
import { RedisHandler } from './helpers/redis-handler';
import { AwsS3Service } from './helpers/aws-s3-service';
import { ClientsModule } from '@nestjs/microservices';
import { reviewsTCPConfig } from './microServiceConfigs';
import { authTCPMicroServiceConfig } from 'config/authServiceConfig';

@Module({
  imports: [
    ReviewsModule,
    PromoCodeModule,
    TripsModule,
    CaptainModule,
    AdminModule,
    UserModule,
    SubscriptionModule,
    ChatModule,
    ClientsModule.register([
      {
        ...reviewsTCPConfig,
        name: 'CLIENT_REVIEW_SERVICE_TCP',
      },
      {
        ...authTCPMicroServiceConfig,
        name: 'CLIENT_AUTH_SERVICE_TCP',
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'api-gateway',
        level: 'debug',
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserService,
    AdminService,
    RedisHandler,
    AwsS3Service,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    try {
      // App Logger Middleware
      consumer.apply(AppLoggerMiddleware).forRoutes('*');

      // Admin MiddleWare
      consumer
        .apply(AdminMiddleware)
        .exclude(
          { path: 'admin/login', method: RequestMethod.ALL },
          { path: 'admin/forgot-password', method: RequestMethod.POST },
          { path: 'admin/set-password/(.*)', method: RequestMethod.POST },
          { path: 'admin/reset-password', method: RequestMethod.POST },
          { path: 'admin/test-push', method: RequestMethod.POST },
        )
        .forRoutes('admin/*');

      // Auth MiddleWare
      consumer
        .apply(AuthMiddleware)
        .exclude(
          { path: 'admin/(.*)', method: RequestMethod.ALL },
          'trips/syncCustomerDetails',
          'master/cab-type/:id',
          'sendotp',
          'verifyotp',
          'user/clickpay-callback',
          'user/info',
          'trips/invoice/:tripId',
          { path: 'master/pages/:pageCode/:lang', method: RequestMethod.GET },
          { path: 'master/pages/:pageCode', method: RequestMethod.POST },
          { path: 'master/setting/:name', method: RequestMethod.GET },
        )
        .forRoutes('*');

      // Rider Auth Middleware
      // consumer.apply(RiderAuthMiddleware).forRoutes(
      //   // Trip Service
      //   { path: 'trips', method: RequestMethod.POST },
      //   { path: 'trips/schedule', method: RequestMethod.POST },
      //   { path: 'trips/change-destination/*', method: RequestMethod.PATCH },
      //   { path: 'trips/rider-cancelled/*', method: RequestMethod.PATCH },
      //   { path: 'trips/confirm-schedule/*', method: RequestMethod.POST },
      //   { path: 'trips/decline-schedule/*', method: RequestMethod.POST },
      //   { path: 'trips/rider-recent-addresses', method: RequestMethod.GET },
      //   { path: 'trips/rider-future-trips', method: RequestMethod.GET },
      //   { path: 'trips/rider-completed-trips', method: RequestMethod.GET },
      //   { path: 'trips/rider-cancelled-trips', method: RequestMethod.GET },
      //   { path: 'trips/rider', method: RequestMethod.GET },

      //   // Promo-Code Service
      //   { path: 'promo-code/validate', method: RequestMethod.POST },
      // );

      // Driver Auth Middleware
      // consumer.apply(DriverAuthMiddleware)
      // .exclude(
      //   { path: 'captains/wasl-check', method: RequestMethod.POST },
      //   { path: 'captains/become-captain', method: RequestMethod.POST }
      // )
      // .forRoutes(
      //   // Trip Service
      //   { path: 'trips/driver-accepted/*', method: RequestMethod.PATCH },
      //   { path: 'trips/driver-rejected/*', method: RequestMethod.PATCH },
      //   { path: 'trips/driver-cancelled/*', method: RequestMethod.PATCH },
      //   { path: 'trips/driver-reached-at-pickup-point/*', method: RequestMethod.PATCH },
      //   { path: 'trips/started/*', method: RequestMethod.PATCH },
      //   { path: 'trips/completed/*', method: RequestMethod.PATCH },
      //   { path: 'trips/driver-completed-trips', method: RequestMethod.GET },
      //   { path: 'trips/driver-cancelled-trips', method: RequestMethod.GET },
      //   { path: 'trips/driver', method: RequestMethod.GET },

      //   // Captain Service
      //   { path: 'captains', method: RequestMethod.ALL },
      //   { path: 'subscription/activate', method: RequestMethod.PUT },
      //   { path: 'subscription/cancel', method: RequestMethod.PUT },
      // );
    } catch (err) {
      return;
    }
  }
}
