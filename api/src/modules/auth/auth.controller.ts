import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { parseUserAgent, extractClientIp } from '../../common/utils/parse-user-agent';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // FIX: limite de 3 pedidos por 10 minutos por IP, específico para
  // registo — mais apertado que o limite global de 60/60s, para impedir
  // criação em massa de contas automatizada (bots, testes de fraude).
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const context = this.buildContext(req);
    return this.authService.register(dto, context);
  }

  // FIX: limite de 5 tentativas por 60 segundos por IP — protege contra
  // força bruta de password sem afectar um utilizador legítimo que erre
  // a senha uma ou duas vezes.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const context = this.buildContext(req);
    return this.authService.login(dto, context);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async logout(@CurrentUser() user: any, @Req() req: Request) {
    const context = this.buildContext(req);
    await this.authService.logout(user.id, user.sessionId, context);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtGuard)
  me(@CurrentUser() user: Record<string, unknown>) {
    return user;
  }

  private buildContext(req: Request) {
    const { device, browser } = parseUserAgent(req.headers['user-agent']);
    return { device, browser, ip: extractClientIp(req) };
  }
}