import { IsNumber, Max, Min } from 'class-validator';

// SECURITY FIX: antes, commissionPercentage era recebido via
// @Body('commissionPercentage') solto — o ValidationPipe global com
// whitelist:true nao valida campos individuais, apenas objectos DTO
// tipados. Enviar "abc" resultava em NaN, que chegava ao service antes
// de qualquer validacao de tipo. Com este DTO, o ValidationPipe rejeita
// valores nao numericos com 400 Bad Request imediatamente.
export class UpdateCommissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercentage: number;
}