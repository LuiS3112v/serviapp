import { IsString } from 'class-validator';

export class SubmitCompanyKycDto {
  @IsString()
  legalName: string;

  @IsString()
  nif: string;

  @IsString()
  representativeFullName: string;

  @IsString()
  representativeBiNumber: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  province: string;
}