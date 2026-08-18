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
import { GoogleAuthService, GoogleIdentity } from './google-auth.service';

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

// NOVO — resultado de verifyGoogleIdentity(). Deliberadamente SEM
// access_token e SEM user: não há sessão nem conta criada, é só
// identidade verificada para pré-preencher um formulário.
export interface GoogleIdentityPreview {
  email: string;
  fullName: string;
  picture: string | null;
  googleId: string;
  // Avisa o frontend que este email já pertence a uma conta existente,
  // para poder mostrar mensagem clara ANTES do utilizador preencher
  // todo o formulário e só falhar no passo final. Não expõe o role.
  emailAlreadyRegistered: boolean;
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
    private googleAuthService: GoogleAuthService,
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

    // Contas criadas via Google não têm password — bcrypt.compare
    // rejeitaria um hash null de forma imprevisível. Recusa
    // explicitamente, com a MESMA mensagem genérica de sempre, para
    // não revelar a outra pessoa que a conta existe mas foi criada por
    // outro método.
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
  // GOOGLE OAUTH — LOGIN
  //
  // INTOCADO. Continua a ser o único método usado por /login (via
  // POST /auth/google). Não é chamado pelo novo fluxo de Register.
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

  // ══════════════════════════════════════════════════════════════════
  // GOOGLE OAUTH — REGISTER (NOVO)
  //
  // Usado exclusivamente por /register/client e /register/provider.
  // Verifica a identidade junto da Google e devolve os dados para
  // pré-preencher o formulário. Deliberadamente NÃO:
  //   - cria User
  //   - cria UserSession
  //   - gera token
  //   - regista SecurityLog de login
  //
  // A conta só passa a existir quando o utilizador submeter o
  // formulário normal (register()), com o role já definido pela
  // própria página (/register/client ou /register/provider) e com
  // password preenchida manualmente — exactamente como o cadastro
  // tradicional já exige.
  //
  // A verificação de "email já registado" aqui é só informativa (dá
  // ao frontend a possibilidade de mostrar um aviso cedo); a garantia
  // real de unicidade continua a ser a constraint `unique: true` em
  // User.email, aplicada no momento do register() — não há forma de
  // contornar isso só porque este método devolveu um resultado
  // desatualizado por causa de uma corrida entre pedidos.
  // ══════════════════════════════════════════════════════════════════
  async verifyGoogleIdentity(idToken: string): Promise<GoogleIdentityPreview> {
    const identity = await this.googleAuthService.verifyIdToken(idToken);

    const existing = await this.userRepo.findOne({
      where: { email: identity.email },
    });

    return {
      email: identity.email,
      fullName: identity.fullName,
      picture: identity.picture,
      googleId: identity.googleId,
      emailAlreadyRegistered: !!(existing && !existing.deletedAt),
    };
  }

  // Chamado por POST /auth/choose-role. Mantido por compatibilidade
  // com o fluxo PENDING ainda existente (ver nota no controller) — o
  // novo Register deixa de o usar, mas continua funcional para quem
  // ainda dependa dele. Só funciona enquanto o role ainda é PENDING —
  // depois de escolhido, este endpoint recusa correr de novo, para
  // impedir que alguém troque de tipo de conta à vontade.
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