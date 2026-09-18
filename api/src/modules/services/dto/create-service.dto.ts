import {
  IsString, IsNotEmpty, IsNumber,
  IsOptional, IsDateString, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  province?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  budget: number;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  targetProviderId?: string;

  @IsString()
  @IsOptional()
  catalogItemId?: string;

  // Localização GPS real do cliente no momento da criação.
  // Opcional — se não vier (sem permissão / sem GPS), o sistema usa
  // fallback sem inventar localização.
  // NÃO é gravado na tabela services — só usado para distribuição.
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientLatitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientLongitude?: number;
}