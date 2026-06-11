import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @Length(14, 14, { message: 'BI deve ter 14 caracteres' })
  biNumber: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  category: string;
}