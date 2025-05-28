import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

export const getDatabaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigService],
  useFactory: (configService: ConfigService): DataSourceOptions => ({
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', ''),
    database: configService.get<string>('DATABASE_DATABASE', 'dbTest'),
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    synchronize: configService.get<string>('APP_DEV', 'true') === 'true',
    logging: configService.get<string>('APP_DEV', 'true') === 'true',
  }),
  inject: [ConfigService],
};
