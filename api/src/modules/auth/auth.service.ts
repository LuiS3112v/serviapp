import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/entities/user.entity';
import { UserSession } from '../../database/entities/user-session.entity';
import { SecurityLog, SecurityLogAction } from '../../database/entities/security-log.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../../common/enums/role.enum';

/**
 * Roles a user may self-assign at registration.
 * ADMIN is intentionally excluded — it can only be granted via direct DB update
 * or by being in the SUPER_ADMIN_EMAILS env var.
 */
const REGISTERABLE_ROLES: Role[] = [Role.CLIENT, Role.PROVIDER, Role.COMPANY];

// Tempo de vida de uma sessão. Ajusta se o teu JwtModule usar um expiresIn
// diferente — idealmente os dois devem ficar alinhados.
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export interface RequestContext {
  device: string | null;
  browser: string | null;
  ip: string | null;
}

/**
 * Place this file at: src/modules/auth/auth.service.ts
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
    @InjectRepository(SecurityLog)
    private securityLogRepo: Repository<SecurityLog>,
    private jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
    context: RequestContext,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já registado.');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Whitelist: even if the client sends role: 'admin', it is silently downgraded
    // to Role.CLIENT. Admin can only be granted through the DB directly.
    const safeRole = REGISTERABLE_ROLES.includes(dto.role as Role)
      ? (dto.role as Role)
      : Role.CLIENT;

    const user = this.userRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      password: hashedPassword,
      role: safeRole,
      phone: dto.phone,
    });

    const saved = await this.userRepo.save(user);
    const session = await this.createSession(saved.id, context);
    const token = this.generateToken(saved, session.id);

    return {
      access_token: token,
      user: this.sanitize(saved),
    };
  }

  async login(
    dto: LoginDto,
    context: RequestContext,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');

    const session = await this.createSession(user.id, context);
    const token = this.generateToken(user, session.id);

    await this.logEvent(user.id, SecurityLogAction.LOGIN, context);

    return {
      access_token: token,
      user: this.sanitize(user),
    };
  }

  async logout(
    userId: string,
    sessionId: string | null,
    context: RequestContext,
  ): Promise<void> {
    if (sessionId) {
      await this.sessionRepo.update({ id: sessionId, userId }, { isRevoked: true });
    }
    await this.logEvent(userId, SecurityLogAction.LOGOUT, context);
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) return false;
    if (session.isRevoked) return false;
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) return false;
    return true;
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.sessionRepo
      .update({ id: sessionId }, { lastSeen: new Date() })
      .catch(() => {});
  }

  // SECURITY FIX: antes devolvia `Promise<User | null>` — a entidade
  // completa da base de dados, incluindo password (hash) e os dois
  // segredos de 2FA. Se este método for usado por um JwtStrategy para
  // hidratar req.user (padrão comum no NestJS), qualquer controller que
  // devolva @CurrentUser() directamente — como AuthController.me() —
  // ficaria a expor esses campos na resposta HTTP. Passa a devolver
  // Partial<User> já sanitizado. A assinatura muda de User para
  // Partial<User>; nenhum consumidor que já dependesse apenas de campos
  // não-sensíveis (id, email, role, fullName, etc.) é afectado.
  async validateUser(id: string): Promise<Partial<User> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    return this.sanitize(user);
  }

  private async createSession(userId: string, context: RequestContext): Promise<UserSession> {
    const session = this.sessionRepo.create({
      userId,
      device: context.device,
      browser: context.browser,
      ip: context.ip,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    return this.sessionRepo.save(session);
  }

  private async logEvent(
    userId: string,
    action: SecurityLogAction,
    context: RequestContext,
  ): Promise<void> {
    const log = this.securityLogRepo.create({
      userId,
      action,
      ip: context.ip,
      device: context.device,
      browser: context.browser,
    });
    await this.securityLogRepo.save(log).catch(() => {});
  }

  private generateToken(user: User, sessionId: string): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      // Role is embedded in the token for audit/logging purposes only.
      // Guards ALWAYS re-fetch from DB via JwtStrategy — this value is never
      // used as the authoritative role in access decisions.
      role: user.role,
      sessionId,
    });
  }

  // SECURITY FIX: agora remove também twoFactorSecret e
  // twoFactorTempSecret, não só password. Antes, se um utilizador
  // tivesse 2FA activo, os dois segredos passavam intactos na resposta
  // de /auth/register e /auth/login.
  private sanitize(user: User): Partial<User> {
    const { password, twoFactorSecret, twoFactorTempSecret, ...rest } = user;
    return rest;
  }
}