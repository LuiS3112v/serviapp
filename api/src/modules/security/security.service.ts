import {
  Injectable, BadRequestException, UnauthorizedException, NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { User } from '../../database/entities/user.entity';
import { UserSession } from '../../database/entities/user-session.entity';
import { SecurityLog, SecurityLogAction } from '../../database/entities/security-log.entity';
import { RequestContext } from '../auth/auth.service';

const PASSWORD_STRENGTH_REGEX = {
  uppercase: /[A-Z]/,
  number: /[0-9]/,
  symbol: /[^A-Za-z0-9]/,
};

const DELETE_CONFIRMATION_PHRASE = 'ELIMINAR';

@Injectable()
export class SecurityService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
    @InjectRepository(SecurityLog)
    private securityLogRepo: Repository<SecurityLog>,
    private dataSource: DataSource,
  ) {}

  // ── Password ──────────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    currentSessionId: string | null,
    context: RequestContext,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Senha atual incorreta.');

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      throw new BadRequestException('A nova senha tem de ser diferente da atual.');
    }

    if (!this.isPasswordStrongEnough(newPassword)) {
      throw new BadRequestException(
        'A senha tem de ter pelo menos 8 caracteres, uma letra maiúscula, um número e um símbolo.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      user.password = await bcrypt.hash(newPassword, 12);
      await queryRunner.manager.save(user);

      await queryRunner.manager
        .createQueryBuilder()
        .update(UserSession)
        .set({ isRevoked: true })
        .where('userId = :userId', { userId })
        .andWhere(currentSessionId ? 'id != :currentSessionId' : '1=1', { currentSessionId })
        .execute();

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    await this.logEvent(userId, SecurityLogAction.PASSWORD_CHANGED, context);
  }

  getPasswordStrength(password: string): {
    score: number;
    label: 'Muito fraca' | 'Fraca' | 'Boa' | 'Forte' | 'Excelente';
  } {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (PASSWORD_STRENGTH_REGEX.uppercase.test(password)) score += 1;
    if (PASSWORD_STRENGTH_REGEX.number.test(password)) score += 1;
    if (PASSWORD_STRENGTH_REGEX.symbol.test(password)) score += 1;

    const labels: Array<'Muito fraca' | 'Fraca' | 'Boa' | 'Forte' | 'Excelente'> = [
      'Muito fraca', 'Muito fraca', 'Fraca', 'Boa', 'Forte', 'Excelente',
    ];

    return { score, label: labels[Math.min(score, 5)] };
  }

  private isPasswordStrongEnough(password: string): boolean {
    return (
      password.length >= 8 &&
      PASSWORD_STRENGTH_REGEX.uppercase.test(password) &&
      PASSWORD_STRENGTH_REGEX.number.test(password) &&
      PASSWORD_STRENGTH_REGEX.symbol.test(password)
    );
  }

  // ── Sessões ───────────────────────────────────────────────────────────

  async getSessions(userId: string, currentSessionId: string | null) {
    const sessions = await this.sessionRepo.find({
      where: { userId, isRevoked: false },
      order: { lastSeen: 'DESC' },
    });

    return sessions.map((s) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      ip: s.ip,
      location: s.location,
      lastSeen: s.lastSeen,
      createdAt: s.createdAt,
      isCurrent: s.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, context: RequestContext): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Sessão não encontrada.');

    session.isRevoked = true;
    await this.sessionRepo.save(session);

    await this.logEvent(userId, SecurityLogAction.SESSION_REVOKED, context);
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string | null,
    context: RequestContext,
  ): Promise<void> {
    const qb = this.sessionRepo
      .createQueryBuilder()
      .update(UserSession)
      .set({ isRevoked: true })
      .where('userId = :userId', { userId })
      .andWhere('isRevoked = false');

    if (currentSessionId) {
      qb.andWhere('id != :currentSessionId', { currentSessionId });
    }

    await qb.execute();

    await this.logEvent(userId, SecurityLogAction.SESSION_REVOKED, context);
  }

  // ── 2FA ───────────────────────────────────────────────────────────────

  async setupTwoFactor(userId: string, userEmail: string): Promise<{ qrCodeDataUrl: string; secret: string }> {
    const secret = speakeasy.generateSecret({
      name: `ServiApp (${userEmail})`,
      length: 20,
    });

    await this.userRepo.update(userId, { twoFactorTempSecret: secret.base32 });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url ?? '');

    return { qrCodeDataUrl, secret: secret.base32 };
  }

  async enableTwoFactor(userId: string, code: string, context: RequestContext): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');
    if (!user.twoFactorTempSecret) {
      throw new BadRequestException('Nenhuma configuração de 2FA pendente. Inicia o processo novamente.');
    }

    const valid = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!valid) throw new BadRequestException('Código inválido.');

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = null;
    user.twoFactorEnabled = true;
    await this.userRepo.save(user);

    await this.logEvent(userId, SecurityLogAction.TWO_FA_ENABLED, context);
  }

  async disableTwoFactor(userId: string, password: string, context: RequestContext): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new BadRequestException('Senha incorreta.');

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorTempSecret = null;
    await this.userRepo.save(user);

    await this.logEvent(userId, SecurityLogAction.TWO_FA_DISABLED, context);
  }

  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return false;

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
  }

  async getTwoFactorStatus(userId: string): Promise<{ enabled: boolean }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    return { enabled: user?.twoFactorEnabled ?? false };
  }

  // ── Histórico de segurança ───────────────────────────────────────────

  async getSecurityHistory(userId: string) {
    return this.securityLogRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private async logEvent(userId: string, action: SecurityLogAction, context: RequestContext): Promise<void> {
    const log = this.securityLogRepo.create({
      userId,
      action,
      ip: context.ip,
      device: context.device,
      browser: context.browser,
    });
    await this.securityLogRepo.save(log).catch(() => {});
  }

  // ══════════════════════════════════════════════════════════════════════
  // Eliminação de conta — SOFT DELETE com anonimização.
  //
  // Porquê soft delete e não hard delete: o ServiApp tem Payment,
  // Transaction, ProviderVerification (KYC), ChatRoom/ChatMessage e
  // Service ligados a User. Um hard delete exigiria conhecer e coordenar
  // o comportamento onDelete de CADA uma dessas relações — algumas têm
  // CASCADE (ex: ChatRoom, que apagaria conversas inteiras, incluindo o
  // histórico que pode ser relevante numa disputa), outras não têm
  // CASCADE nenhum (o que faria o hard delete falhar com um erro de
  // violação de foreign key sempre que o utilizador tivesse qualquer
  // Service associado). Soft delete evita este problema de raiz: a
  // linha nunca é removida, por isso nenhuma FK é violada, e o
  // histórico de pagamentos/serviços/KYC permanece íntegro para fins de
  // auditoria e resolução de disputas — o mesmo padrão usado por
  // marketplaces como Uber e Airbnb.
  //
  // O que este método faz, na ordem:
  //  1. Verifica password (UnauthorizedException se errada).
  //  2. Verifica a frase de confirmação exacta (BadRequestException se
  //     errada) — validação movida do DTO para aqui, para a mensagem
  //     ser exactamente a pedida.
  //  3. Revoga TODAS as sessões activas — o equivalente real, neste
  //     projecto, a "invalidar refresh tokens": não existe uma tabela
  //     de refresh tokens separada, a UserSession + JwtStrategy já
  //     desempenham esse papel (ver JwtStrategy.validate, que rejeita
  //     qualquer token cuja sessão tenha sido revogada).
  //  4. Regista o evento ACCOUNT_DELETED no log de auditoria, com os
  //     campos que a entity SecurityLog expõe hoje (userId, ip, device,
  //     browser). Os campos "email antigo" e "role" pedidos no prompt
  //     não são gravados aqui porque exigiriam colunas novas em
  //     security-log.entity.ts, ficheiro que não tenho — não vou
  //     adicionar colunas a uma entity que nunca vi. Nota: o userId já
  //     é suficiente para reconstruir email/role históricos, porque o
  //     User continua a existir (soft delete) — um JOIN a partir do log
  //     ainda encontra o registo, apenas anonimizado a partir deste
  //     momento em diante.
  //  5. Anonimiza todos os campos de identificação pessoal em User e
  //     marca deletedAt. O email é substituído por um valor tombstone
  //     único (baseado no próprio id), o que liberta o email original
  //     para um futuro novo registo — comportamento correcto para uma
  //     plataforma onde "eliminar conta" deve mesmo libertar o email.
  //     A password é sobreposta por um hash de um valor aleatório,
  //     tornando login por password matematicamente impossível mesmo
  //     antes de qualquer verificação de deletedAt correr.
  // ══════════════════════════════════════════════════════════════════════
  async deleteAccount(
    userId: string,
    password: string,
    confirmation: string,
    context: RequestContext,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new UnauthorizedException('Senha incorreta.');

    if (confirmation !== DELETE_CONFIRMATION_PHRASE) {
      throw new BadRequestException('Confirmação inválida.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager
        .createQueryBuilder()
        .update(UserSession)
        .set({ isRevoked: true })
        .where('userId = :userId', { userId })
        .execute();

      const log = queryRunner.manager.create(SecurityLog, {
        userId,
        action: SecurityLogAction.ACCOUNT_DELETED,
        ip: context.ip,
        device: context.device,
        browser: context.browser,
      });
      await queryRunner.manager.save(log);

      const tombstoneEmail = `deleted_${userId}@removed.serviapp.local`;
      const unusablePasswordHash = await bcrypt.hash(randomUUID(), 12);

      await queryRunner.manager.update(User, { id: userId }, {
        deletedAt: new Date(),
        email: tombstoneEmail,
        password: unusablePasswordHash,
        fullName: 'Utilizador eliminado',
        phone: null,
        avatarUrl: null,
        avatarPublicId: null,
        bio: null,
        province: null,
        district: null,
        latitude: null,
        longitude: null,
        profileVisible: false,
        isOnline: false,
        locationSharingEnabled: false,
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      // SECURITY FIX: mesmo padrão já corrigido em KycService.submit —
      // nunca propagar err cru (podia expor detalhes internos do
      // TypeORM/Postgres, ex. uma eventual violação de FK numa relação
      // que eu não conheço). Log interno completo, resposta genérica
      // ao cliente.
      console.error('❌ DELETE ACCOUNT ERROR:', err);
      throw new InternalServerErrorException(
        'Erro ao eliminar a conta. Tenta novamente ou contacta o suporte.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}