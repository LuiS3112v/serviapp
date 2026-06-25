import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreatePortfolioItemDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  client?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  projectDate?: string;
}