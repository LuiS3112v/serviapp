import { IsString, IsOptional, IsNumber, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePricedServiceDto {
  @IsString() @IsOptional() @MaxLength(120)
  name?: string;

  @Type(() => Number) @IsNumber() @Min(0) @IsOptional()
  price?: number;
}