import { IsString, IsOptional } from 'class-validator';

export class CreateCertificationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  issuer?: string;

  @IsString()
  @IsOptional()
  year?: string;
}