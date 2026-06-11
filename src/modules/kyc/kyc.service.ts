import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { User } from '../../database/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { KycStatus } from '../../common/enums/kyc-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(ProviderVerification)
    private verificationRepo: Repository<ProviderVerification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  async submit(
    providerId: string,
    dto: SubmitKycDto,
    files: {
      frontBi?: Express.Multer.File[];
      backBi?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ): Promise<ProviderVerification> {
    try {
      const existing = await this.verificationRepo.findOne({
        where: { providerId },
      });

      if (existing?.status === KycStatus.PENDING) {
        throw new BadRequestException('Já tens uma verificação pendente.');
      }

      if (existing?.status === KycStatus.APPROVED) {
        throw new BadRequestException('A tua conta já está verificada.');
      }

      this.validateFiles(files);

      const ref = uuidv4().slice(0, 8);

      const frontFile = files.frontBi?.[0];
      const backFile = files.backBi?.[0];
      const selfieFile = files.selfie?.[0];

      if (!frontFile || !backFile || !selfieFile) {
        throw new BadRequestException('Ficheiros inválidos ou em falta.');
      }

      // upload seguro
      const [frontBiResult, backBiResult, selfieResult] = await Promise.all([
        this.cloudinaryService.uploadBuffer(
          frontFile.buffer,
          'front',
          `${providerId}_front_${ref}`,
        ),
        this.cloudinaryService.uploadBuffer(
          backFile.buffer,
          'back',
          `${providerId}_back_${ref}`,
        ),
        this.cloudinaryService.uploadBuffer(
          selfieFile.buffer,
          'selfie',
          `${providerId}_selfie_${ref}`,
        ),
      ]);

      if (existing?.status === KycStatus.REJECTED) {
        await this.verificationRepo.delete({ providerId }).catch(() => {});
      }

      const verification = this.verificationRepo.create({
        providerId,
        fullName: dto.fullName ?? '',
        biNumber: dto.biNumber ?? '',
        phoneNumber: dto.phoneNumber ?? '',
        province: dto.province ?? '',
        category: dto.category ?? '',
        frontBiUrl: frontBiResult.url,
        frontBiPublicId: frontBiResult.publicId,
        backBiUrl: backBiResult.url,
        backBiPublicId: backBiResult.publicId,
        selfieUrl: selfieResult.url,
        selfiePublicId: selfieResult.publicId,
        status: KycStatus.PENDING,
      });

      return await this.verificationRepo.save(verification);
    } catch (error: any) {
      console.error('❌ KYC SUBMIT ERROR:', error);
      throw new InternalServerErrorException(
        error?.message || 'Erro ao processar KYC',
      );
    }
  }

  async getMyStatus(providerId: string) {
    try {
      return await this.verificationRepo.findOne({
        where: { providerId },
      });
    } catch (e) {
      throw new InternalServerErrorException('Erro ao buscar status KYC');
    }
  }

  async getPending() {
    return this.verificationRepo.find({
      where: { status: KycStatus.PENDING },
      relations: { provider: true },
      order: { createdAt: 'ASC' },
    });
  }

  async getById(id: string) {
    const verification = await this.verificationRepo.findOne({
      where: { id },
      relations: { provider: true },
    });

    if (!verification) {
      throw new NotFoundException('Verificação não encontrada.');
    }

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

    await this.userRepo.update(verification.providerId, {
      isVerified: true,
      profileVisible: true,
    });

    const saved = await this.verificationRepo.save(verification);

    await this.notificationsService
      .notifyKycApproved(verification.providerId)
      .catch(() => {});

    return saved;
  }

  async reject(id: string, adminId: string, dto: RejectKycDto) {
    const verification = await this.getById(id);

    if (verification.status !== KycStatus.PENDING) {
      throw new BadRequestException('Já foi processado.');
    }

    verification.status = KycStatus.REJECTED;
    verification.rejectionReason = dto.reason;
    verification.reviewedByAdminId = adminId;
    verification.reviewedAt = new Date();

    await this.userRepo.update(verification.providerId, {
      isVerified: false,
      profileVisible: false,
    });

    const saved = await this.verificationRepo.save(verification);

    await this.notificationsService
      .notifyKycRejected(verification.providerId, dto.reason)
      .catch(() => {});

    return saved;
  }

  private validateFiles(files: {
    frontBi?: Express.Multer.File[];
    backBi?: Express.Multer.File[];
    selfie?: Express.Multer.File[];
  }) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;

    for (const key of ['frontBi', 'backBi', 'selfie'] as const) {
      const fileArr = files[key];

      if (!fileArr || !fileArr[0]) {
        throw new BadRequestException(`Ficheiro ${key} é obrigatório.`);
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