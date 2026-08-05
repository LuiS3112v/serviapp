import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentProof } from '../../database/entities/payment-proof.entity';
import { Payment } from '../../database/entities/payment.entity';
import { ProofStatus } from '../../common/enums/proof-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';
import { v2 as cloudinary } from 'cloudinary';

const ALLOWED_TYPES = ['pdf', 'png', 'jpg', 'jpeg'];

// SECURITY FIX: mapa inverso do que já existia (CONTENT_TYPE_MAP),
// usado agora para cruzar extensão declarada com mimetype real do
// multipart. Antes a validação de tipo confiava apenas em
// file.originalname — controlado inteiramente pelo cliente e trivial
// de forjar (renomear qualquer ficheiro para "comprovativo.pdf").
const ALLOWED_MIME_BY_EXT: Record<string, string[]> = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg', 'image/jpg'],
  jpeg: ['image/jpeg', 'image/jpg'],
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

@Injectable()
export class PaymentProofService {
  constructor(
    @InjectRepository(PaymentProof)
    private proofRepo: Repository<PaymentProof>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private cloudinaryService: CloudinaryService,
    private notificationsService: NotificationsService,
  ) {}

  // ── Upload / substituição ──────────────────────────────────────────────

  async uploadProof(
    paymentId: string,
    clientId: string,
    file: Express.Multer.File,
  ): Promise<PaymentProof> {
    const payment = await this.getPaymentOrFail(paymentId);

    if (payment.clientId !== clientId) {
      throw new ForbiddenException('Sem permissão para enviar comprovativo deste pagamento.');
    }

    if (payment.status === PaymentStatus.CONFIRMED
      || payment.status === PaymentStatus.PENDING_PAYOUT
      || payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Este pagamento já foi confirmado — não é possível substituir o comprovativo.',
      );
    }

    const ext = (file.originalname.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_TYPES.includes(ext)) {
      throw new BadRequestException(
        `Ficheiro inválido. Formatos aceites: ${ALLOWED_TYPES.join(', ').toUpperCase()}.`,
      );
    }

    // SECURITY FIX: cruza a extensão declarada com o mimetype real
    // reportado pelo multer a partir do Content-Type do multipart. Um
    // ficheiro renomeado (ex: executável renomeado para .jpg) tem
    // mimetype que não bate com a extensão e é rejeitado aqui.
    const allowedMimes = ALLOWED_MIME_BY_EXT[ext] ?? [];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'O tipo real do ficheiro não corresponde à extensão indicada.',
      );
    }

    await this.proofRepo.update(
      { paymentId, status: ProofStatus.ACTIVE },
      { status: ProofStatus.REPLACED },
    );

    const isPdf = ext === 'pdf';
    const uploaded = isPdf
      ? await this.cloudinaryService.uploadRawFile(
          file.buffer, 'payment-proofs', `${paymentId}_${Date.now()}.pdf`,
        )
      : await this.cloudinaryService.uploadBuffer(
          file.buffer, 'payment-proofs', `${paymentId}_${Date.now()}`,
        );

    const proof = this.proofRepo.create({
      paymentId,
      uploadedByUserId: clientId,
      fileUrl: uploaded.url,
      filePublicId: uploaded.publicId,
      fileType: ext,
      status: ProofStatus.ACTIVE,
    });

    const saved = await this.proofRepo.save(proof);

    if (payment.status === PaymentStatus.PENDING) {
      payment.status = PaymentStatus.PROOF_SUBMITTED;
      await this.paymentRepo.save(payment);
    }

    await this.notificationsService.notifyAdminNewProof(paymentId).catch(() => {});
    await this.notificationsService.notifyProviderProofSubmitted(payment.providerId).catch(() => {});

    return saved;
  }

  // ── Leitura ────────────────────────────────────────────────────────────

  async getMyProofHistory(paymentId: string, clientId: string): Promise<PaymentProof[]> {
    const payment = await this.getPaymentOrFail(paymentId);
    if (payment.clientId !== clientId) {
      throw new ForbiddenException('Sem permissão.');
    }
    return this.proofRepo.find({
      where: { paymentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getProofForProvider(paymentId: string, providerId: string): Promise<PaymentProof> {
    const payment = await this.getPaymentOrFail(paymentId);
    if (payment.providerId !== providerId) {
      throw new ForbiddenException('Sem permissão.');
    }

    const proof = await this.proofRepo.findOne({
      where: [
        { paymentId, status: ProofStatus.CONFIRMED },
        { paymentId, status: ProofStatus.ACTIVE },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!proof) {
      throw new NotFoundException('O cliente ainda não enviou nenhum comprovativo.');
    }

    return proof;
  }

  // SECURITY FIX: relations:{uploadedBy:true} carregava o User completo
  // (password hash, twoFactorSecret, twoFactorTempSecret) para o admin.
  // Substituído por select explícito.
  async getProofHistoryForAdmin(paymentId: string): Promise<PaymentProof[]> {
    await this.getPaymentOrFail(paymentId);
    return this.proofRepo.find({
      where: { paymentId },
      order: { createdAt: 'DESC' },
      relations: { uploadedBy: true },
      select: {
        id: true,
        paymentId: true,
        uploadedByUserId: true,
        fileUrl: true,
        filePublicId: true,
        fileType: true,
        status: true,
        confirmedByAdminId: true,
        confirmedAt: true,
        createdAt: true,
        uploadedBy: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    });
  }

  async confirmActiveProof(paymentId: string, adminId: string): Promise<PaymentProof> {
    const activeProof = await this.proofRepo.findOne({
      where: { paymentId, status: ProofStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });

    if (!activeProof) {
      throw new NotFoundException('Não existe comprovativo activo para confirmar.');
    }

    activeProof.status = ProofStatus.CONFIRMED;
    activeProof.confirmedByAdminId = adminId;
    activeProof.confirmedAt = new Date();

    return this.proofRepo.save(activeProof);
  }

  // ══════════════════════════════════════════════════════════════════════
  // Obtém o ficheiro em bruto para servir via proxy do backend.
  //
  // Usa a Admin API da Cloudinary (cloudinary.api.resource) para obter
  // uma URL assinada (signed URL) do recurso, autenticada com a
  // API key/secret da conta — que tem sempre acesso garantido,
  // independentemente das restrições de "delivery" público que a conta
  // possa ter para acesso anónimo directo. Depois faz fetch dessa URL
  // assinada e devolve os bytes.
  //
  // Autorização: cliente dono do pagamento, prestador do pagamento, ou
  // admin. Qualquer outro utilizador recebe 403.
  // ══════════════════════════════════════════════════════════════════════

  async getProofFileForUser(
    proofId: string,
    userId: string,
    userRole: Role,
  ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const proof = await this.proofRepo.findOne({
      where: { id: proofId },
      relations: { payment: true },
    });

    if (!proof) throw new NotFoundException('Comprovativo não encontrado.');

    const payment = proof.payment;
    const isOwner = payment.clientId === userId || payment.providerId === userId;
    const isAdmin = userRole === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Sem permissão para ver este comprovativo.');
    }

    const isPdf = proof.fileType === 'pdf';
    let downloadUrl = proof.fileUrl;

    // Para recursos 'raw' (PDFs), gera uma signed URL usando as
    // credenciais da conta — isto garante acesso mesmo que a entrega
    // pública directa esteja restringida ao nível da conta.
    if (isPdf && proof.filePublicId) {
      try {
        downloadUrl = cloudinary.utils.private_download_url(
          proof.filePublicId,
          'pdf',
          {
            resource_type: 'raw',
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 300, // 5 min
          },
        );
      } catch {
        // Se a assinatura falhar por qualquer razão, cai de volta para
        // a URL guardada — o fetch abaixo ainda pode funcionar
        // consoante as definições da conta.
        downloadUrl = proof.fileUrl;
      }
    }

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new NotFoundException(
        `Não foi possível obter o ficheiro do armazenamento (código ${response.status}). Pede ao cliente para re-enviar o comprovativo.`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = CONTENT_TYPE_MAP[proof.fileType] ?? 'application/octet-stream';
    const filename = `comprovativo.${proof.fileType}`;

    return { buffer, contentType, filename };
  }

  private async getPaymentOrFail(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');
    return payment;
  }
}