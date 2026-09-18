import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubcategoryServiceDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  subcategory: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  // Localização GPS real do cliente no momento da criação.
  // Opcional — se não vier, distribuição fallback sem localização falsa.
  // NÃO gravado na BD — só usado para calcular proximidade.
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientLatitude?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clientLongitude?: number;
}