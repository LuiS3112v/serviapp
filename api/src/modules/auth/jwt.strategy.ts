import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Role } from '../../common/enums/role.enum';
import { isSuperAdminEmail } from '../../common/super-admin.config';

/**
 * JwtStrategy — runs on every authenticated request.
 *
 * Key security properties:
 *
 * 1. ALWAYS fetches user from DB (payload.role is never used for authorisation).
 *    This means a stale 7-day token can never carry a wrong role through the guards.
 *    The DB is the single source of truth for roles.
 *
 * 2. NEVER falls back to payload.role (the old `user.role ?? payload.role` pattern
 *    was removed — it allowed a spoofed or stale JWT role to slip through if the DB
 *    returned a nullish value).
 *
 * 3. Injects isSuperAdmin from SUPER_ADMIN_EMAILS env var, not from the token.
 *    Super admins always receive role: Role.ADMIN on req.user regardless of DB value,
 *    so they cannot be locked out by an accidental DB change.
 *
 * Place this file at: src/modules/auth/jwt.strategy.ts
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // No fallback — if JWT_SECRET is missing the app should crash on boot, not at runtime
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    // Always hit the DB — this is the authoritative role check
    const user = await this.authService.validateUser(payload.sub);
    if (!user) throw new UnauthorizedException('Utilizador não encontrado.');

    const superAdmin = isSuperAdminEmail(user.email, this.configService);

    return {
      id: user.id,
      email: user.email,
      // Super admin always gets Role.ADMIN, regardless of what the DB holds.
      // For everyone else, the DB role is used — never the JWT payload role.
      role: superAdmin ? Role.ADMIN : user.role,
      fullName: user.fullName,
      isVerified: user.isVerified,
      // isSuperAdmin is computed here from env, not stored in the token.
      // RolesGuard reads this flag to grant unconditional access.
      isSuperAdmin: superAdmin,
    };
  }
}