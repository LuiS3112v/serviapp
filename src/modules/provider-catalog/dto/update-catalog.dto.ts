import { IsString, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCatalogDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() address?: string;
  @Type(() => Number) @IsNumber() @Min(1) @IsOptional() pricePerHour?: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}