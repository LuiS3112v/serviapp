import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { Service } from '../../database/entities/service.entity';
import { KycStatus } from '../../common/enums/kyc-status.enum';
import { CompanyKycService } from '../companies/company-kyc.service';
import { RejectCompanyKycDto } from '../companies/dto/reject-company-kyc.dto';
import { ServiceStatus } from '../../common/enums/service-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ProviderVerification)
    private verificationRepo: Repository<ProviderVerification>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private companyKycService: CompanyKycService,
  ) {}

  async getStats() {
    const [totalUsers, pendingKyc, allServices] = await Promise.all([
      this.userRepo.count(),
      this.verificationRepo.count({ where: { status: KycStatus.PENDING } }),
      this.serviceRepo.find(),
    ]);

    const activeServices = allServices.filter(s =>
      [ServiceStatus.ACCEPTED, ServiceStatus.IN_PROGRESS].includes(s.status as any),
    ).length;

    const totalVolume = allServices
      .filter(s => s.status === ServiceStatus.COMPLETED)
      .reduce((sum, s) => sum + Number(s.agreedPrice ?? 0), 0);

    return { totalUsers, activeServices, totalVolume, pendingKyc };
  }

  async getRecentUsers() {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
      take: 10,
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });
  }

  async getAllUsers() {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
      select: { id: true, fullName: true, email: true, role: true, isVerified: true, createdAt: true },
    });
  }

  // ── KYC individual ─────────────────────────────────────────────────────────

  async getPendingKyc() {
    const list = await this.verificationRepo.find({
      where: { status: KycStatus.PENDING },
      relations: { provider: true },
      order: { createdAt: 'ASC' },
    });

    // Normaliza para o formato que o frontend espera: { id, userName, documentStatus, type }
    return list.map(v => ({
      id: v.id,
      userName: v.provider?.fullName ?? v.fullName ?? '—',
      documentStatus: 'BI + Selfie',
      type: 'individual' as const,
      createdAt: v.createdAt,
    }));
  }

  async approveKyc(id: string) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
      relations: { provider: true },
    });
    if (!verification) throw new Error('Verificação não encontrada.');
    verification.status = KycStatus.APPROVED;
    verification.reviewedAt = new Date();
    await this.verificationRepo.save(verification);
    await this.userRepo.update(verification.providerId, {
      isVerified: true,
      profileVisible: true,
    });
    return verification;
  }

  async rejectKyc(id: string) {
    const verification = await this.verificationRepo.findOne({ where: { id } });
    if (!verification) throw new Error('Verificação não encontrada.');
    verification.status = KycStatus.REJECTED;
    verification.reviewedAt = new Date();
    await this.verificationRepo.save(verification);
    await this.userRepo.update(verification.providerId, {
      isVerified: false,
      profileVisible: false,
    });
    return verification;
  }

  // ── KYC empresarial ────────────────────────────────────────────────────────

  async getPendingCompanyKyc() {
    const list = await this.companyKycService.getPending();

    // Normaliza para o mesmo formato AdminKyc do frontend
    return list.map(v => ({
      id: v.id,
      userName: v.company?.name ?? v.legalName ?? '—',
      documentStatus: 'NIF + Alvará + Certidão + BI Rep.',
      type: 'company' as const,
      companyId: v.companyId,
      createdAt: v.createdAt,
    }));
  }

  async approveCompanyKyc(id: string, adminId: string) {
    return this.companyKycService.approve(id, adminId);
  }

  async rejectCompanyKyc(id: string, adminId: string, dto: RejectCompanyKycDto) {
    return this.companyKycService.reject(id, adminId, dto);
  }
}