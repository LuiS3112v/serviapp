import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../common/enums/role.enum';
 
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
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
        id: true,
        fullName: true,
        email: true,
        role: true,
        isVerified: true,
        profileVisible: true,
        createdAt: true,
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
 
    return results.map(r => ({
      category: r.category,
      count: Number(r.count),
    }));
  }
 
  async findProviders(category?: string): Promise<Partial<User>[]> {
    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', { roles: [Role.PROVIDER, Role.COMPANY] })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.profileVisible = :visible', { visible: true })
      .select([
        'user.id', 'user.fullName', 'user.email', 'user.phone',
        'user.category', 'user.province', 'user.avatarUrl', 'user.bio',
        'user.isOnline', 'user.latitude', 'user.longitude',
      ]);
 
    if (category && category !== 'Todos') {
      query.andWhere('user.category = :category', { category });
    }
 
    return query.orderBy('user.isOnline', 'DESC').getMany();
  }
}