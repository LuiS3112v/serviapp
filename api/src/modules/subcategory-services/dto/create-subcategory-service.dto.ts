import { IsString, IsNotEmpty } from 'class-validator';

// Nada além disto — o prompt exige explicitamente que o pedido inicial
// não tenha descrição, orçamento, ou fotografias. category e
// subcategory vêm de listas fechadas no frontend, address é o único
// campo de texto livre.
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
}