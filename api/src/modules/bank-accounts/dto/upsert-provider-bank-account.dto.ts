import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpsertProviderBankAccountDto {
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountHolder: string;

  @IsString()
  @IsNotEmpty()
  iban: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;
}