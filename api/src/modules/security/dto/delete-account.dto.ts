import { IsString, Equals } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  password: string;

  @IsString()
  @Equals('ELIMINAR')
  confirmation: string;
}