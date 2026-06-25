import { IsString } from 'class-validator';

export class CreateCompanyServiceDto {
  @IsString()
  label: string;

  @IsString()
  category: string;
}