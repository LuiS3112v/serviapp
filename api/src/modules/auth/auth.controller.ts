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

  // INTOCADO — fluxo de Login com Google. Continua a autenticar/criar
  // sessão exatamente como já funcionava. Usado apenas por /login.
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async google(@Body() dto: GoogleAuthDto, @Req() req: Request) {
    const identity = await this.googleAuthService.verifyIdToken(dto.idToken);
    const context = this.buildContext(req);
    return this.authService.loginOrRegisterWithGoogle(identity, context);
  }

  // NOVO — usado exclusivamente por /register/client e /register/provider.
  // Só valida o idToken junto da Google e devolve a identidade
  // (nome/email/foto). NÃO cria User, NÃO cria sessão, NÃO gera token,
  // NÃO faz login. A conta só passa a existir quando o utilizador
  // submeter o formulário normal (POST /auth/register).
  //
  // Mesmo throttle do endpoint /google — continua a ser um endpoint
  // público que aceita input externo (idToken), por isso mantém-se
  // protegido contra abuso da mesma forma.
  @Post('google/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  async googleVerify(@Body() dto: GoogleAuthDto) {
    return this.authService.verifyGoogleIdentity(dto.idToken);
  }

  // Nota: googleVerify() delega toda a validação do idToken (assinatura,
  // audiência, expiração) para dentro de AuthService.verifyGoogleIdentity(),
  // que por sua vez usa GoogleAuthService internamente — o mesmo padrão
  // que google() já usa chamando primeiro este.googleAuthService.
  // GoogleAuthService continua injectado no controller só porque google()
  // (login) precisa dele diretamente; não há duplicação de verificação.

  // NOVO — não removido: mantido por compatibilidade com o fluxo PENDING
  // ainda existente no backend (Role.PENDING, chooseRole()). O Register
  // deixa de usar este caminho, mas o endpoint continua disponível caso
  // outro ponto do sistema dependa dele.
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