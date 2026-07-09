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

  // Preenchido quando o pedido nasce de um "Solicitar" na página de
  // pesquisa — liga o Service à entrada de catálogo que o originou.
  @IsString()
  @IsOptional()
  catalogItemId?: string;
}