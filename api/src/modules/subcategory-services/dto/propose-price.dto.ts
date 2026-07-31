import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ProposePriceDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  proposedPrice: number;
}