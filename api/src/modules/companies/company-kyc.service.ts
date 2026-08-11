import {
  Injectable, BadRequestException, NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyVerification } from '../../database/entities/company-verification.entity';
import { Company } from '../../database/entities/company.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SubmitCompanyKycDto } from './dto/submit-company-kyc.dto';
import { RejectCompanyKycDto } from './dto/reject-company-kyc.dto';
import { KycStatus } from '../../common/enums/kyc-status.enum';
import { CompanyVerificationStatus } from '../../common/enums/company-verification-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyKycService {
  constructor(
    @InjectRepository(CompanyVerification)
    private verificationRepo: Repository<CompanyVerification>,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  async submit(
    companyId: string,
    dto: SubmitCompanyKycDto,
    files: {
      nifDoc?: Express.Multer.File[];
      commercialLicense?: Express.Multer.File[];
      commercialRegistry?: Express.Multer.File[];
      representativeId?: Express.Multer.File[];
    },
  ): Promise<CompanyVerification> {
    try {
      const existing = await this.verificationRepo.findOne({ where: { companyId } });

      if (existing?.status === KycStatus.PENDING) {
        throw new BadRequestException('Já tens uma verificação de empresa pendente.');
      }
      if (existing?.status === KycStatus.APPROVED) {
        throw new BadRequestException('Esta empresa já está verificada.');
      }

      this.validateFiles(files);

      const ref = uuidv4().slice(0, 8);
      const nifFile = files.nifDoc?.[0];
      const licenseFile = files.commercialLicense?.[0];
      const registryFile = files.commercialRegistry?.[0];
      const repIdFile = files.representativeId?.[0];

      if (!nifFile || !licenseFile || !registryFile || !repIdFile) {
        throw new BadRequestException('Ficheiros inválidos ou em falta.');
      }

      const [nifResult, licenseResult, registryResult, repIdResult] = await Promise.all([
        this.cloudinaryService.uploadBuffer(nifFile.buffer, 'company-nif', `${companyId}_nif_${ref}`),
        this.cloudinaryService.uploadBuffer(licenseFile.buffer, 'company-license', `${companyId}_license_${ref}`),
        this.cloudinaryService.uploadBuffer(registryFile.buffer, 'company-registry', `${companyId}_registry_${ref}`),
        this.cloudinaryService.uploadBuffer(repIdFile.buffer, 'company-rep-id', `${companyId}_repid_${ref}`),
      ]);

      if (existing?.status === KycStatus.REJECTED) {
        await this.verificationRepo.delete({ companyId }).catch(() => {});
      }

      const verification = this.verificationRepo.create({
        companyId,
        legalName: dto.legalName,
        nif: dto.nif,
        representativeFullName: dto.representativeFullName,
        representativeBiNumber: dto.representativeBiNumber,
        phoneNumber: dto.phoneNumber,
        province: dto.province,
        nifDocUrl: nifResult.url,
        nifDocPublicId: nifResult.publicId,
        commercialLicenseUrl: licenseResult.url,
        commercialLicensePublicId: licenseResult.publicId,
        commercialRegistryUrl: registryResult.url,
        commercialRegistryPublicId: registryResult.publicId,
        representativeIdUrl: repIdResult.url,
        representativeIdPublicId: repIdResult.publicId,
        status: KycStatus.PENDING,
      });

      return await this.verificationRepo.save(verification);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ COMPANY KYC SUBMIT ERROR:', error);
      throw new InternalServerErrorException(
        'Erro ao processar a verificação da empresa. Tenta novamente.',
      );
    }
  }

  async getMyStatus(companyId: string) {
    return this.verificationRepo.findOne({ where: { companyId } });
  }

  // Lista separada da de providers individuais — admin vê isto numa secção
  // própria do painel, claramente identificada como "verificações de empresa".
  async getPending() {
    return this.verificationRepo.find({
      where: { status: KycStatus.PENDING },
      relations: { company: true },
      order: { createdAt: 'ASC' },
    });
  }

  async getById(id: string) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
      relations: { company: true },
    });
    if (!verification) throw new NotFoundException('Verificação de empresa não encontrada.');
    return verification;
  }

  async approve(id: string, adminId: string) {
    const verification = await this.getById(id);
    if (verification.status !== KycStatus.PENDING) {
      throw new BadRequestException('Já foi processado.');
    }

    verification.status = KycStatus.APPROVED;
    verification.reviewedByAdminId = adminId;
    verification.reviewedAt = new Date();

    await this.companyRepo.update(verification.companyId, {
      verificationStatus: CompanyVerificationStatus.VERIFIED,
      verifiedAt: new Date(),
    });

    const saved = await this.verificationRepo.save(verification);

    const company = await this.companyRepo.findOne({ where: { id: verification.companyId } });
    if (company) {
      await this.notificationsService
        .notifyCompanyKycApproved(company.ownerId)
        .catch(() => {});
    }

    return saved;
  }

  async reject(id: string, adminId: string, dto: RejectCompanyKycDto) {
    const verification = await this.getById(id);
    if (verification.status !== KycStatus.PENDING) {
      throw new BadRequestException('Já foi processado.');
    }

    verification.status = KycStatus.REJECTED;
    verification.rejectionReason = dto.reason;
    verification.reviewedByAdminId = adminId;
    verification.reviewedAt = new Date();

    await this.companyRepo.update(verification.companyId, {
      verificationStatus: CompanyVerificationStatus.PENDING,
    });

    const saved = await this.verificationRepo.save(verification);

    const company = await this.companyRepo.findOne({ where: { id: verification.companyId } });
    if (company) {
      await this.notificationsService
        .notifyCompanyKycRejected(company.ownerId, dto.reason)
        .catch(() => {});
    }

    return saved;
  }

  private validateFiles(files: {
    nifDoc?: Express.Multer.File[];
    commercialLicense?: Express.Multer.File[];
    commercialRegistry?: Express.Multer.File[];
    representativeId?: Express.Multer.File[];
  }) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    for (const key of ['nifDoc', 'commercialLicense', 'commercialRegistry', 'representativeId'] as const) {
      const fileArr = files[key];
      if (!fileArr || !fileArr[0]) {
        throw new BadRequestException(`Documento "${key}" é obrigatório.`);
      }
      const file = fileArr[0];
      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException(`${key}: formato inválido.`);
      }
      if (file.size > maxSize) {
        throw new BadRequestException(`${key}: ficheiro muito grande.`);
      }
    }
  }
}