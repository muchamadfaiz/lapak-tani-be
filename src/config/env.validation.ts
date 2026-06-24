import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  APP_PORT: number;

  @IsString()
  @IsNotEmpty()
  APP_CORS_ORIGINS: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRATION: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRATION: string;

  @IsOptional()
  @IsString()
  SWAGGER_ENABLED: string;

  @IsOptional()
  @IsString()
  FILE_UPLOAD_DEST: string;

  @IsOptional()
  @IsNumber()
  FILE_UPLOAD_MAX_SIZE: number;

  @IsOptional()
  @IsString()
  EMAIL_ENABLED: string;

  @IsOptional()
  @IsString()
  EMAIL_HOST: string;

  @IsOptional()
  @IsNumber()
  EMAIL_PORT: number;

  @IsOptional()
  @IsString()
  EMAIL_USER: string;

  @IsOptional()
  @IsString()
  EMAIL_PASSWORD: string;

  @IsOptional()
  @IsString()
  EMAIL_FROM: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL: string;
}

export function validate(config: Record<string, unknown>) {
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
