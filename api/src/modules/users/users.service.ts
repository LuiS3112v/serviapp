import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Company } from '../../database/entities/company.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
  ) {}

  async findById(id: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');
    const { password, ...rest } = user;
    return rest;
  }

  async updateById(id: string, dto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    const { password, ...rest } = saved;
    return rest;
  }

  async findAll(): Promise<Partial<User>[]> {
    return this.userRepo.find({
      select: {
        id: true, fullName: true, email: true, role: true,
        isVerified: true, profileVisible: true, createdAt: true,
      },
    });
  }

  async getCategoryCounts(): Promise<{ category: string; count: number }[]> {
    const results = await this.userRepo
      .createQueryBuilder('user')
      .select('user.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('user.role IN (:...roles)', { roles: [Role.PROVIDER, Role.COMPANY] })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.category IS NOT NULL')
      .groupBy('user.category')
      .getRawMany();
    return results.map(r => ({ category: r.category, count: Number(r.count) }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // findProviders — devolve 2 tipos COMPLETAMENTE SEPARADOS:
  //
  //  cardType: 'provider'
  //    → perfil individual do prestador
  //    → só aparece se não tiver serviços no catálogo
  //    → nunca tem info de empresa
  //
  //  cardType: 'company'
  //    → card da empresa verificada (nome e logo da empresa)
  //    → aparece sempre que a empresa estiver verificada
  //    → nunca mostra serviços — só "Ver empresa"
  //    → completamente independente do provider individual
  //
  // Um provider que criou empresa aparece como:
  //   1. Os seus serviços individuais (via /catalog, NÃO aqui)
  //   2. A empresa (cardType:'company', aqui)
  // NUNCA se misturam. NUNCA.
  // ══════════════════════════════════════════════════════════════════════
  async findProviders(category?: string): Promise<any[]> {

    // ── PARTE 1: Providers individuais ────────────────────────────────────
    const providerQuery = this.userRepo
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: [Role.PROVIDER, Role.COMPANY] })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.profileVisible = :visible', { visible: true })
      .select([
        'user.id', 'user.fullName', 'user.email', 'user.phone',
        'user.category', 'user.province', 'user.avatarUrl', 'user.bio',
        'user.isOnline', 'user.latitude', 'user.longitude', 'user.role',
      ]);

    if (category && category !== 'Todos') {
      providerQuery.andWhere('user.category = :category', { category });
    }

    const users = await providerQuery
      .orderBy('user.isOnline', 'DESC')
      .getMany();

    // Provider cards — sem qualquer info de empresa
    const providerCards = users.map(u => ({
      ...u,
      cardType: 'provider',
      isCompany: false,
      companyId: null,
    }));

    // ── PARTE 2: Empresas verificadas ─────────────────────────────────────
    // Query completamente separada — usa string literal 'verified' para
    // evitar qualquer problema de mapeamento de enum no TypeORM
    let companyQb = this.companyRepo
      .createQueryBuilder('company')
      .where("company.verificationStatus = 'verified'");

    if (category && category !== 'Todos') {
      companyQb = companyQb.andWhere(
        'company.mainCategory = :cat',
        { cat: category },
      );
    }

    const companies = await companyQb
      .select([
        'company.id',
        'company.ownerId',
        'company.name',
        'company.mainCategory',
        'company.about',
        'company.logoUrl',
        'company.verificationStatus',
      ])
      .getMany();

    // Company cards — nome e logo DA EMPRESA, nunca do provider dono
    const companyCards = companies.map(c => ({
      id: c.ownerId,           // userId do dono (para chat/convite)
      fullName: c.name,        // nome DA EMPRESA
      avatarUrl: c.logoUrl ?? null,
      category: c.mainCategory,
      bio: c.about ?? null,
      isOnline: false,
      role: 'company',
      province: null,
      email: null,
      phone: null,
      latitude: null,
      longitude: null,
      cardType: 'company',     // distinção clara
      isCompany: true,         // flag redundante para segurança no frontend
      companyId: c.id,         // UUID real da empresa → /company/[id]
    }));

    return [...providerCards, ...companyCards];
  }

  // ── Pesquisa para modal de convite ────────────────────────────────────────
  async searchUsers(q: string): Promise<Partial<User>[]> {
    if (!q || q.trim().length < 2) return [];
    const term = `%${q.trim().toLowerCase()}%`;
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role NOT IN (:...excluded)', { excluded: [Role.ADMIN] })
      .andWhere(
        '(LOWER(user.fullName) LIKE :term OR LOWER(user.email) LIKE :term OR user.phone LIKE :term)',
        { term },
      )
      .select([
        'user.id', 'user.fullName', 'user.email',
        'user.phone', 'user.avatarUrl', 'user.role',
      ])
      .take(10)
      .getMany();
  }
}