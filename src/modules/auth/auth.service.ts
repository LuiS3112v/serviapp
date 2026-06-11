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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../../common/enums/role.enum';

/**
 * Roles a user may self-assign at registration.
 * ADMIN is intentionally excluded — it can only be granted via direct DB update
 * or by being in the SUPER_ADMIN_EMAILS env var.
 */
const REGISTERABLE_ROLES: Role[] = [Role.CLIENT, Role.PROVIDER, Role.COMPANY];

/**
 * Place this file at: src/modules/auth/auth.service.ts
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(
    dto: RegisterDto,
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
    const token = this.generateToken(saved);

    return {
      access_token: token,
      user: this.sanitize(saved),
    };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; user: Partial<User> }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');

    return {
      access_token: this.generateToken(user),
      user: this.sanitize(user),
    };
  }

  async validateUser(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  private generateToken(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      // Role is embedded in the token for audit/logging purposes only.
      // Guards ALWAYS re-fetch from DB via JwtStrategy — this value is never
      // used as the authoritative role in access decisions.
      role: user.role,
    });
  }

  private sanitize(user: User): Partial<User> {
    const { password, ...rest } = user;
    return rest;
  }
}