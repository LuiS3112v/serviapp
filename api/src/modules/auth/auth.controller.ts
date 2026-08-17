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
import { GoogleAuthService } from './google-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { ChooseRoleDto } from './dto/choose-role.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { parseUserAgent, extractClientIp } from '../../common/utils/parse-user-agent';
import { Role } from '../../common/enums/role.enum';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 600000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const context = this.buildContext(req);
    return this.authService.register(dto, context);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const context = this.buildContext(req);
    return this.authService.login(dto, context);
  }

  // NOVO — mesma taxa de tentativas do login tradicional. O idToken
  // já vem validado pela Google no frontend (assinatura garantida por
  // eles), mas isto não impede tentativas de spam ao nosso endpoint,
  // por isso mantém-se throttled como qualquer outro endpoint de auth.
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async google(@Body() dto: GoogleAuthDto, @Req() req: Request) {
    const identity = await this.googleAuthService.verifyIdToken(dto.idToken);
    const context = this.buildContext(req);
    return this.authService.loginOrRegisterWithGoogle(identity, context);
  }

  // NOVO — só acessível com uma sessão válida (JwtGuard), já que só
  // faz sentido para alguém que acabou de autenticar via Google e
  // ainda está com role=PENDING.
  @Post('choose-role')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async chooseRole(@CurrentUser() user: any, @Body() dto: ChooseRoleDto, @Req() req: Request) {
    const context = this.buildContext(req);
    const role = dto.role === 'provider' ? Role.PROVIDER : Role.CLIENT;
    return this.authService.chooseRole(user.id, role, context);
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