import { TypeOrmModuleOptions } from '@nestjs/typeorm';
require('dotenv').config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.MYSQL_DB_HOST,
  port: Number(process.env.MYSQL_DB_PORT),
  username: process.env.MYSQL_DB_USER,
  password: process.env.MYSQL_DB_PASSWORD,
  database: process.env.MYSQL_DB,
  entities: ['dist/**/**.entity{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
  logging: true,
  migrations: [__dirname + '/migrations/*.ts'],
};
