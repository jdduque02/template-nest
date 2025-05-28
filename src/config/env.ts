import { plainToInstance } from 'class-transformer';
import { IsString, IsOptional, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  JOB_NAME: string;

  @IsString()
  APP_PORT: string;

  @IsString()
  HASH_KEY_USER: string;

  @IsString()
  HASH_KEY_JWT: string;

  @IsString()
  VERSION: string;

  @IsString()
  @IsOptional()
  SALT = 10;

  @IsString()
  APP_DEV = 'false';

  @IsString()
  DATABASE_HOST: string;

  @IsString()
  DATABASE_PORT: string;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  RATE_LIMIT_TTL = 60;

  @IsString()
  RATE_LIMIT_MAX = 100;
}
/**
 * Valida las variables de entorno usando class-validator y class-transformer.
 *
 * - Convierte el objeto de configuración recibido en una instancia de EnvironmentVariables,
 *   permitiendo la conversión implícita de tipos.
 * - Valida la instancia creada, asegurando que todas las propiedades requeridas estén presentes
 *   y cumplan con las reglas definidas en la clase.
 * - Si hay errores de validación, lanza una excepción con los detalles.
 * - Si todo es válido, retorna la configuración validada (validatedConfig).
 */
export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
