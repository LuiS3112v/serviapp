import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Role } from '../../common/enums/role.enum';
import { isSuperAdminEmail } from '../../common/super-admin.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; sessionId?: string }) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) throw new UnauthorizedException('Utilizador não encontrado.');

    // FIX: tokens emitidos antes desta mudança não têm sessionId no
    // payload — para não deslogar imediatamente todos os utilizadores já
    // autenticados no momento do deploy, um token sem sessionId ainda é
    // aceite (comportamento antigo). Qualquer token novo, emitido a
    // partir de agora, sempre tem sessionId e passa pela verificação de
    // revogação — que é o que torna "Terminar sessão" um efeito real e
    // não só cosmético.
    if (payload.sessionId) {
      const sessionValid = await this.authService.isSessionValid(payload.sessionId);
      if (!sessionValid) {
        throw new UnauthorizedException('Sessão terminada. Inicia sessão novamente.');
      }
      await this.authService.touchSession(payload.sessionId);
    }

    const superAdmin = isSuperAdminEmail(user.email, this.configService);

    return {
      id: user.id,
      email: user.email,
      role: superAdmin ? Role.ADMIN : user.role,
      fullName: user.fullName,
      isVerified: user.isVerified,
      isSuperAdmin: superAdmin,
      sessionId: payload.sessionId ?? null,
    };
  }
}