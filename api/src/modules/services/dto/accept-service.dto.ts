import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AcceptServiceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  agreedPrice: number;
}