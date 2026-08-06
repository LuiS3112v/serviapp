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

const REGISTERABLE_ROLES: Role[] = [Role.CLIENT, Role.PROVIDER, Role.COMPANY];

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export interface RequestContext {
  device: string | null;
  browser: string | null;
  ip: string | null;
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

    // SECURITY FIX: rejeita contas soft-deleted. Na prática o email
    // original já foi libertado por SecurityService.deleteAccount
    // (substituído por um tombstone), por isso este caminho raramente
    // é alcançado por essa via — mas fica como segunda camada de
    // defesa caso a estratégia de anonimização mude no futuro, ou
    // haja uma janela de corrida entre confirmar deletedAt e o
    // tombstone do email ainda não ter propagado.
    if (!user || user.deletedAt) throw new UnauthorizedException('Credenciais inválidas.');

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

  // SECURITY FIX (já aplicado antes nesta conversa) + FIX NOVO: agora
  // também rejeita contas soft-deleted (deletedAt preenchido). Como
  // JwtStrategy.validate() trata `null` devolvido aqui como
  // "utilizador não encontrado" (UnauthorizedException), qualquer
  // token emitido antes da eliminação da conta deixa de funcionar
  // imediatamente — mesmo que, por alguma razão, a sessão associada
  // ainda não tivesse sido revogada (defesa em profundidade, dado que
  // deleteAccount já revoga todas as sessões de qualquer forma).
  async validateUser(id: string): Promise<Partial<User> | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    if (user.deletedAt) return null;
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
      role: user.role,
      sessionId,
    });
  }

  private sanitize(user: User): Partial<User> {
    const { password, twoFactorSecret, twoFactorTempSecret, ...rest } = user;
    return rest;
  }
}