import { IsString, IsNotEmpty } from 'class-validator';

export class RejectProofDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}