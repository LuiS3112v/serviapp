import { IsString, IsNotEmpty } from 'class-validator';

// O frontend nunca nos manda email/nome/foto directamente — só o ID
// token assinado pela Google. É o backend que extrai e valida essa
// informação (GoogleAuthService), nunca confiando em dados vindos
// crus do browser.
//
// Reutilizado por DOIS endpoints agora:
//   POST /auth/google         (login/register do LOGIN — loginOrRegisterWithGoogle)
//   POST /auth/google/verify  (NOVO — só verifica identidade para o REGISTER)
// Ambos só precisam do idToken; não há razão para dois DTOs idênticos.
export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;
}