import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class DeleteAccountDto {
  // MinLength(6) alinhado com RegisterDto.password neste mesmo
  // projecto — não é um número novo inventado, é o mínimo já
  // estabelecido para qualquer password válida na aplicação.
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  // SECURITY/UX FIX: removido @Equals('ELIMINAR'). Antes, uma
  // confirmação errada era rejeitada pelo ValidationPipe com uma
  // mensagem genérica do class-validator, antes de chegar ao
  // controller/service. Agora o DTO só garante que é uma string não
  // vazia — a validação exacta ("tem de ser 'ELIMINAR'") e a mensagem
  // de erro específica passam a viver no SecurityService, como pedido
  // explicitamente: "Validar confirmação... Retornar BadRequestException,
  // Mensagem: Confirmação inválida".
  @IsString()
  @IsNotEmpty()
  confirmation: string;
}