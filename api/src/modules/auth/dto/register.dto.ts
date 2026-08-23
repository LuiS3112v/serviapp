import { IsEmail, IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

  @IsString()
  @IsOptional()
  phone?: string;

  // NOVO — categoria de serviço escolhida pelo provider no Passo 2 do
  // registo (web/src/app/(auth)/register/provider/page.tsx). Antes
  // desta alteração, o formulário validava esta escolha como
  // obrigatória mas nunca a enviava ao backend — user.category ficava
  // por preencher até (e só se) o provider completasse o KYC, que é
  // opcional e posterior ao registo. Opcional aqui porque o registo
  // de cliente ("client") nunca envia este campo.
  @IsString()
  @IsOptional()
  category?: string;
}