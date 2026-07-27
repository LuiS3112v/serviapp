import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response, Request } from 'express';

@Injectable()
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const url = request.url;

    let message = 'Demasiadas tentativas. Tenta novamente mais tarde.';

    if (url.includes('/auth/login')) {
      message = 'Demasiadas tentativas de login. Tenta novamente dentro de 1 hora.';
    } else if (url.includes('/auth/register')) {
      message = 'Demasiadas tentativas de registo. Tenta novamente dentro de 10 minutos.';
    }

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message,
    });
  }
}