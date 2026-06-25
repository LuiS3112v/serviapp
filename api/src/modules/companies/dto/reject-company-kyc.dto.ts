import { IsString } from 'class-validator';

export class RejectCompanyKycDto {
  @IsString()
  reason: string;
}