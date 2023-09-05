import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import appConfiguration from 'config/appConfig';
import { typeOrmConfig } from 'config/typeOrmConfig';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RejectedReasonModule } from './modules/reasons/rejected-reason.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { RoleModule } from './modules/role/role.module';
import { CategoryModule } from './modules/category/category.module';
import { PermissionModule } from './modules/permission/permission.module';
import { MiscModule } from './modules/misc/misc.module';
import { LoggerModule } from 'nestjs-pino';
import { PagesModule } from './modules/pages/pages.module';
import { VehicleMakerModule } from './modules/vehicle-maker/vehicle-maker.module';
import { VehicleModelModule } from './modules/vehicle-model/vehicle-model.module';
import { VehicleClassModule } from './modules/vehicle-class/vehicle-class.module';
import { RarModule } from './modules/rar/rar.module';

console.log('in app module', typeOrmConfig);
@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ConfigModule.forRoot({
      load: [appConfiguration],
    }),
    RejectedReasonModule,
    AdminUserModule,
    RoleModule,
    CategoryModule,
    PermissionModule,
    MiscModule,
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'admin-service',
        level: 'debug',
        formatters: {
          level: (label) => {
            return { level: label };
          },
        },
      },
    }),
    PagesModule,
    VehicleMakerModule,
    VehicleModelModule,
    VehicleClassModule,
    RarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
////////////////
export class AppModule {}
