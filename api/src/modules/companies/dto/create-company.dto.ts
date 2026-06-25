import { IsString, IsOptional, IsNumber, IsEmail, IsUrl, Min, Max } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  mainCategory: string;

  @IsNumber()
  @Min(1900)
  @Max(2100)
  foundedYear: number;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsString()
  @IsOptional()
  headquarters?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  municipality?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  sector?: string;
}