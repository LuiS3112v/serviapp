import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/entities/user.entity';
import { UserSession } from '../../database/entities/user-session.entity';
import { SecurityLog, SecurityLogAction } from '../../database/entities/security-log.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../../common/enums/role.enum';
import { GoogleIdentity } from './google-auth.service';

const REGISTERABLE_ROLES: Role[] = [Role.CLIENT, Role.PROVIDER, Role.COMPANY];

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export interface RequestContext {
  device: string | null;
  browser: string | null;
  ip: string | null;
}

export interface GoogleAuthResult {
  access_token: string;
  user: Partial<User>;
  googlePicture: string | null;
  kycStatus: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
    @InjectRepository(SecurityLog)
    private securityLogRepo: Repository<SecurityLog>,
    @InjectRepository(ProviderVerification)
    private providerVerificationRepo: Repository<ProviderVerification>,
    private jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
    context: RequestContext,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email já registado.');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

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

    if (!user || user.deletedAt) throw new UnauthorizedException('Credenciais inválidas.');

    // NOVO (decisão b): contas criadas via Google não têm password —
    // bcrypt.compare rejeitaria um hash null de forma imprevisível.
    // Recusa explicitamente, com a MESMA mensagem genérica de sempre,
    // para não revelar a outra pessoa que a conta existe mas foi
    // criada por outro método.
    if (!user.password) throw new UnauthorizedException('Credenciais inválidas.');

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

  async validateUser(id: string): Promise<Partial<User> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    if (user.deletedAt) return null;
    return this.sanitize(user);
  }

  // ══════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH
  //
  // Não é um sistema paralelo — reutiliza createSession(),
  // generateToken() e sanitize(), tal como login()/register() já
  // fazem. Só muda a forma como o User é encontrado ou criado.
  //
  //   1. googleId já existe            -> login normal dessa conta
  //   2. email já existe (sem googleId) -> linking: associa googleId,
  //      preserva TUDO o resto (role, KYC, avatar, wallet, etc.)
  //   3. nem googleId nem email existem -> cria conta nova com
  //      role=PENDING e password=null — o Google NUNCA escolhe o role
  // ══════════════════════════════════════════════════════════════════
  async loginOrRegisterWithGoogle(
    identity: GoogleIdentity,
    context: RequestContext,
  ): Promise<GoogleAuthResult> {
    let user = await this.userRepo.findOne({ where: { googleId: identity.googleId } });

    if (!user) {
      const existingByEmail = await this.userRepo.findOne({
        where: { email: identity.email },
      });

      if (existingByEmail && !existingByEmail.deletedAt) {
        // Linking — associa a identidade Google a uma conta já
        // existente, sem tocar em mais nenhum campo (role, KYC,
        // avatar, bio, etc. ficam exactamente como estavam).
        existingByEmail.googleId = identity.googleId;
        user = await this.userRepo.save(existingByEmail);
      } else {
        // Conta genuinamente nova.
        const created = this.userRepo.create({
          fullName: identity.fullName,
          email: identity.email,
          password: null,
          googleId: identity.googleId,
          role: Role.PENDING,
        });
        user = await this.userRepo.save(created);
      }
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Conta não encontrada.');
    }

    const session = await this.createSession(user.id, context);
    const token = this.generateToken(user, session.id);

    await this.logEvent(user.id, SecurityLogAction.LOGIN, context);

    const kycStatus = await this.getKycStatusIfProvider(user);

    return {
      access_token: token,
      user: this.sanitize(user),
      googlePicture: identity.picture,
      kycStatus,
    };
  }

  // Chamado por POST /auth/choose-role. Só funciona enquanto o role
  // ainda é PENDING — depois de escolhido, este endpoint recusa correr
  // de novo, para impedir que alguém troque de tipo de conta à vontade
  // (ex: fugir a um KYC pendente mudando de "provider" para "client").
  //
  // Gera um NOVO token porque o JWT é stateless: o token antigo tinha
  // "role: pending" gravado dentro dele, e o proxy do frontend só lê
  // o token — nunca a base de dados — para decidir para onde
  // encaminhar o utilizador.
  async chooseRole(
    userId: string,
    chosenRole: Role.CLIENT | Role.PROVIDER,
    context: RequestContext,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Utilizador não encontrado.');
    }

    if (user.role !== Role.PENDING) {
      throw new ForbiddenException('O tipo de conta já foi definido.');
    }

    user.role = chosenRole;
    const saved = await this.userRepo.save(user);

    const session = await this.createSession(saved.id, context);
    const token = this.generateToken(saved, session.id);

    return {
      access_token: token,
      user: this.sanitize(saved),
    };
  }

  private async getKycStatusIfProvider(user: User): Promise<string | null> {
    if (user.role !== Role.PROVIDER && user.role !== Role.COMPANY) return null;
    const verification = await this.providerVerificationRepo.findOne({
      where: { providerId: user.id },
    });
    return verification?.status ?? null;
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
      role: user.role,
      sessionId,
    });
  }

  private sanitize(user: User): Partial<User> {
    const { password, twoFactorSecret, twoFactorTempSecret, ...rest } = user;
    return rest;
  }
}