import { IsString, IsNotEmpty, IsNumber, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePricedServiceDto {
  @IsString() @IsNotEmpty() @MaxLength(120)
  name: string;

  @Type(() => Number) @IsNumber() @Min(0)
  price: number;
}