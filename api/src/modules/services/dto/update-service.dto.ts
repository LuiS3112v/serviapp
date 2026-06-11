import {
  IsString, IsOptional, IsNumber,
  IsDateString, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  budget?: number;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}