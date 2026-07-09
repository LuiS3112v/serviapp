import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpsertPlatformBankAccountDto {
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

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}