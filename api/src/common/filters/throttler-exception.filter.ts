import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

// @Injectable() é obrigatório para que o NestJS consiga instanciar este
// filtro dentro do contentor de DI quando registado via APP_FILTER no
// AppModule. Sem @Injectable(), o NestJS não consegue resolver as
// dependências e o filtro é ignorado silenciosamente em alguns cenários.
@Injectable()
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Demasiadas tentativas. Tenta novamente dentro de instantes.',
    });
  }
}