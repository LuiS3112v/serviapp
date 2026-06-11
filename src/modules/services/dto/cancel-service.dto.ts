import { IsString, IsNotEmpty } from 'class-validator';

export class CancelServiceDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}