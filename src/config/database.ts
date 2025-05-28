import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

/**
 * Configuración asíncrona para TypeORM usando NestJS.
 *
 * Esta función obtiene la configuración de la base de datos a partir de variables de entorno
 * usando el ConfigService. Permite definir el host, puerto, usuario, contraseña, nombre de la base de datos,
 * entidades a cargar, y opciones como sincronización y logging.
 *
 * - type: Tipo de base de datos (PostgreSQL).
 * - host: Dirección del host de la base de datos.
 * - port: Puerto de conexión.
 * - username: Usuario de la base de datos.
 * - password: Contraseña del usuario.
 * - database: Nombre de la base de datos.
 * - entities: Ruta donde buscar las entidades de TypeORM.
 * - synchronize: Si se debe sincronizar el esquema automáticamente (solo en desarrollo).
 * - logging: Si se deben mostrar logs de las consultas (solo en desarrollo).
 */
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
