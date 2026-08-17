import { IsString, IsNotEmpty } from 'class-validator';

// O frontend nunca nos manda email/nome/foto directamente — só o ID
// token assinado pela Google. É o backend que extrai e valida essa
// informação (GoogleAuthService), nunca confiando em dados vindos
// crus do browser.
export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}