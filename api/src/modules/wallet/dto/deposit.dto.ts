import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

// SECURITY FIX (H-4): antes, o amount era recebido por @Body('amount')
// sem DTO — o ValidationPipe global com whitelist:true só valida
// objectos DTO tipados, não campos soltos lidos por @Body('field').
// Enviar amount:"abc" resultava em NaN, que passa a verificação
// `amount <= 0` (NaN não é <= 0 em JS) e chegava ao TypeORM/Postgres
// podendo causar comportamento indefinido. Com este DTO, o
// ValidationPipe rejeita valores não numéricos com 400 Bad Request
// antes de qualquer lógica de negócio correr.
export class DepositDto {
  @IsNumber()
  @Min(1)
  @Max(10_000_000)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}