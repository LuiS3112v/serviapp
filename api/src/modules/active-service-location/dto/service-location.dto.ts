import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class UpdateServiceLocationDto {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;
}

export interface ServiceLocationSnapshot {
  serviceId: string;
  providerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}