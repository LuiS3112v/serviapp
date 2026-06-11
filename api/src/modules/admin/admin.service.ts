import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { Service } from '../../database/entities/service.entity';
import { KycStatus } from '../../common/enums/kyc-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ProviderVerification)
    private readonly verificationRepo: Repository<ProviderVerification>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async getStats() {
    const [totalUsers, activeServices, pendingKyc] = await Promise.all([
      this.userRepo.count(),
      this.serviceRepo.count(),
      this.verificationRepo.count({
        where: { status: KycStatus.PENDING },
      }),
    ]);

    return {
      totalUsers,
      activeServices,
      totalVolume: 0,
      pendingKyc,
    };
  }

  async getRecentUsers() {
    return this.userRepo.find({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 10,
    });
  }

  async getPendingKyc() {
    const list = await this.verificationRepo.find({
      where: {
        status: KycStatus.PENDING,
      },
      relations: {
        provider: true,
      },
      take: 20,
    });

    return list.map((v) => ({
      id: v.id,
      userName:
        v.provider?.fullName ||
        v.provider?.email ||
        'Desconhecido',
      documentStatus: v.status,
    }));
  }

  async approveKyc(id: string) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
    });

    if (!verification) {
      throw new NotFoundException('Verificação não encontrada');
    }

    verification.status = KycStatus.APPROVED;

    await this.verificationRepo.save(verification);

    return {
      success: true,
      id,
      status: KycStatus.APPROVED,
    };
  }

  async rejectKyc(id: string) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
    });

    if (!verification) {
      throw new NotFoundException('Verificação não encontrada');
    }

    verification.status = KycStatus.REJECTED;

    await this.verificationRepo.save(verification);

    return {
      success: true,
      id,
      status: KycStatus.REJECTED,
    };
  }

  async getAllUsers(): Promise<User[]> {
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
      order: {
        createdAt: 'DESC',
      },
    });
  }
}