import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCatalogDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsString() @IsNotEmpty()
  category: string;

  @IsString() @IsOptional()
  address?: string;

  @Type(() => Number) @IsNumber() @Min(1) @IsOptional()
  pricePerHour?: number;
}