import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceStatus } from '../../../common/enums/service-status.enum';

export class FilterServicesDto {
  @IsEnum(ServiceStatus)
  @IsOptional()
  status?: ServiceStatus;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minBudget?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxBudget?: number;
}