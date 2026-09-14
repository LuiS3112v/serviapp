import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisputeEvidence } from '../../database/entities/dispute-evidence.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { Role } from '../../common/enums/role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_TYPES = ['pdf', 'png', 'jpg', 'jpeg'];

const ALLOWED_MIME_BY_EXT: Record<string, string[]> = {
  pdf:  ['application/pdf'],
  png:  ['image/png'],
  jpg:  ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  pdf:  'application/pdf',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
};

const MAX_EVIDENCES_PER_ROLE = 10;

@Injectable()
export class DisputeEvidenceService {
  constructor(
    @InjectRepository(DisputeEvidence)
    private evidenceRepo: Repository<DisputeEvidence>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async upload(
    serviceId: string,
    userId: string,
    userRole: Role,
    file: Express.Multer.File,
    description?: string,
  ): Promise<DisputeEvidence> {
    // FIX: validação extra — garante que buffer existe (memoryStorage obrigatório)
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Ficheiro inválido ou vazio.');
    }

    const service = await this.getServiceOrFail(serviceId);

    const isClient   = service.clientId   === userId;
    const isProvider = service.providerId === userId;
    if (!isClient && !isProvider) {
      throw new ForbiddenException('Sem permissão para enviar evidências neste serviço.');
    }

    if (service.status !== ServiceStatus.DISPUTED) {
      throw new BadRequestException('Só é possível enviar evidências quando o serviço está em disputa.');
    }

    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      throw new BadRequestException(`Formato inválido. Aceites: ${ALLOWED_TYPES.join(', ').toUpperCase()}.`);
    }
    const allowedMimes = ALLOWED_MIME_BY_EXT[ext] ?? [];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('O tipo real do ficheiro não corresponde à extensão indicada.');
    }

    const uploaderRole = isClient ? 'client' : 'provider';
    const count = await this.evidenceRepo.count({ where: { serviceId, uploaderRole } });
    if (count >= MAX_EVIDENCES_PER_ROLE) {
      throw new BadRequestException(
        `Limite de ${MAX_EVIDENCES_PER_ROLE} evidências por parte atingido.`,
      );
    }

    const isPdf = ext === 'pdf';
    const publicId = `dispute_${serviceId}_${userId}_${Date.now()}`;

    // FIX: try/catch explícito no upload Cloudinary para retornar erro legível
    let uploaded: { url: string; publicId: string };
    try {
      uploaded = isPdf
        ? await this.cloudinaryService.uploadRawFile(
            file.buffer,
            'serviapp/dispute-evidences',
            `${publicId}.pdf`,
          )
        : await this.cloudinaryService.uploadPublicImage(
            file.buffer,
            'serviapp/dispute-evidences',
            publicId,
          );
    } catch (err: any) {
      throw new BadRequestException(
        `Erro ao fazer upload para o Cloudinary: ${err?.message ?? 'erro desconhecido'}`,
      );
    }

    const evidence = this.evidenceRepo.create({
      serviceId,
      uploadedByUserId: userId,
      uploaderRole,
      fileUrl: uploaded.url,
      filePublicId: uploaded.publicId,
      fileType: ext,
      description: description?.trim() || null,
    });

    return this.evidenceRepo.save(evidence);
  }

  async listMine(serviceId: string, userId: string): Promise<DisputeEvidence[]> {
    await this.assertParticipant(serviceId, userId);
    return this.evidenceRepo.find({
      where: { serviceId, uploadedByUserId: userId },
      order: { createdAt: 'ASC' },
    });
  }

  async listForAdmin(serviceId: string): Promise<DisputeEvidence[]> {
    return this.evidenceRepo.find({
      where: { serviceId },
      order: { uploaderRole: 'ASC', createdAt: 'ASC' },
      relations: { uploadedBy: true },
      select: {
        id: true,
        serviceId: true,
        uploadedByUserId: true,
        uploaderRole: true,
        fileUrl: true,
        filePublicId: true,
        fileType: true,
        description: true,
        createdAt: true,
        uploadedBy: { id: true, fullName: true },
      },
    });
  }

  async getFile(
    evidenceId: string,
    userId: string,
    userRole: Role,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const evidence = await this.evidenceRepo.findOne({
      where: { id: evidenceId },
      relations: { service: true },
    });
    if (!evidence) throw new NotFoundException('Evidência não encontrada.');

    const isAdmin = userRole === Role.ADMIN;
    const isOwner = evidence.uploadedByUserId === userId;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Sem permissão para ver esta evidência.');
    }

    const isPdf = evidence.fileType === 'pdf';
    let downloadUrl = evidence.fileUrl;

    if (isPdf && evidence.filePublicId) {
      try {
        downloadUrl = cloudinary.utils.private_download_url(
          evidence.filePublicId,
          'pdf',
          {
            resource_type: 'raw',
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 300,
          },
        );
      } catch {
        downloadUrl = evidence.fileUrl;
      }
    }

    // FIX: timeout no fetch para não bloquear o servidor indefinidamente
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: globalThis.Response;
    try {
      response = await fetch(downloadUrl, { signal: controller.signal });
    } catch (err: any) {
      throw new NotFoundException('Timeout ao obter o ficheiro da Cloudinary.');
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new NotFoundException(`Não foi possível obter o ficheiro (${response.status}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = CONTENT_TYPE_MAP[evidence.fileType] ?? 'application/octet-stream';
    return { buffer, contentType, filename: `evidencia.${evidence.fileType}` };
  }

  private async getServiceOrFail(serviceId: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    return service;
  }

  private async assertParticipant(serviceId: string, userId: string): Promise<Service> {
    const service = await this.getServiceOrFail(serviceId);
    if (service.clientId !== userId && service.providerId !== userId) {
      throw new ForbiddenException('Sem permissão.');
    }
    return service;
  }
}