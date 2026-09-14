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

// Máximo de evidências por parte por serviço — evita abusos de armazenamento.
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

  // ── Upload ─────────────────────────────────────────────────────────────────

  async upload(
    serviceId: string,
    userId: string,
    userRole: Role,
    file: Express.Multer.File,
    description?: string,
  ): Promise<DisputeEvidence> {
    const service = await this.getServiceOrFail(serviceId);

    // Só cliente ou prestador do serviço podem enviar evidências.
    const isClient   = service.clientId   === userId;
    const isProvider = service.providerId === userId;
    if (!isClient && !isProvider) {
      throw new ForbiddenException('Sem permissão para enviar evidências neste serviço.');
    }

    // Só faz sentido durante uma disputa activa.
    if (service.status !== ServiceStatus.DISPUTED) {
      throw new BadRequestException('Só é possível enviar evidências quando o serviço está em disputa.');
    }

    // Tipo de ficheiro
    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      throw new BadRequestException(`Formato inválido. Aceites: ${ALLOWED_TYPES.join(', ').toUpperCase()}.`);
    }
    const allowedMimes = ALLOWED_MIME_BY_EXT[ext] ?? [];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('O tipo real do ficheiro não corresponde à extensão indicada.');
    }

    // Limite por parte
    const uploaderRole = isClient ? 'client' : 'provider';
    const count = await this.evidenceRepo.count({ where: { serviceId, uploaderRole } });
    if (count >= MAX_EVIDENCES_PER_ROLE) {
      throw new BadRequestException(
        `Limite de ${MAX_EVIDENCES_PER_ROLE} evidências por parte atingido.`,
      );
    }

    // Upload para Cloudinary
    const isPdf = ext === 'pdf';
    const publicId = `dispute_${serviceId}_${userId}_${Date.now()}`;
    const uploaded = isPdf
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

  // ── Listagem ──────────────────────────────────────────────────────────────

  // Cliente ou prestador: vê só as suas próprias evidências.
  async listMine(serviceId: string, userId: string): Promise<DisputeEvidence[]> {
    await this.assertParticipant(serviceId, userId);
    return this.evidenceRepo.find({
      where: { serviceId, uploadedByUserId: userId },
      order: { createdAt: 'ASC' },
    });
  }

  // Admin: vê as evidências de ambas as partes com info do uploader.
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

  // ── Streaming seguro do ficheiro ──────────────────────────────────────────

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

    const service = evidence.service;
    const isAdmin    = userRole === Role.ADMIN;
    // Dono da evidência pode sempre ver o seu próprio ficheiro.
    const isOwner    = evidence.uploadedByUserId === userId;
    // Participante do serviço mas não dono da evidência → não pode ver.
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Sem permissão para ver esta evidência.');
    }

    const isPdf = evidence.fileType === 'pdf';
    let downloadUrl = evidence.fileUrl;

    // PDFs foram carregados com resource_type:'raw' — em contas Cloudinary
    // gratuitas a entrega directa de 'raw' pode ser bloqueada. Gera uma
    // URL assinada de curta duração para o backend descarregar server-side.
    // Imagens (png/jpg/jpeg) foram carregadas com type:'upload' public —
    // a URL directa funciona sempre e não precisa de assinatura.
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

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new NotFoundException(`Não foi possível obter o ficheiro (${response.status}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = CONTENT_TYPE_MAP[evidence.fileType] ?? 'application/octet-stream';
    return { buffer, contentType, filename: `evidencia.${evidence.fileType}` };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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