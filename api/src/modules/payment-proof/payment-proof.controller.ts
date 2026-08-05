import {
  Controller, Get, Post, Param, UseGuards,
  UseInterceptors, UploadedFile, Res, StreamableFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PaymentProofService } from './payment-proof.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payment-proofs')
@UseGuards(JwtGuard)
export class PaymentProofController {
  constructor(private readonly paymentProofService: PaymentProofService) {}

  // SECURITY FIX: FileInterceptor sem limits aceitava qualquer tamanho
  // de ficheiro em memória antes de qualquer validação correr no
  // service. 5MB alinhado com o limite já usado no resto do projecto
  // (KYC, CloudinaryService.uploadBuffer). Throttle dedicado — upload é
  // um vector de abuso mais caro (I/O, chamada externa à Cloudinary) do
  // que o limite genérico de 60/min do throttler global permite conter
  // razoavelmente.
  @Post(':paymentId/upload')
  @Throttle({ default: { limit: 10, ttl: 600000 } })
  @UseInterceptors(FileInterceptor('proof', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadProof(
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.paymentProofService.uploadProof(paymentId, user.id, file);
  }

  @Get(':paymentId/history/mine')
  getMyProofHistory(@Param('paymentId') paymentId: string, @CurrentUser() user: any) {
    return this.paymentProofService.getMyProofHistory(paymentId, user.id);
  }

  @Get(':paymentId/for-provider')
  getProofForProvider(@Param('paymentId') paymentId: string, @CurrentUser() user: any) {
    return this.paymentProofService.getProofForProvider(paymentId, user.id);
  }

  @Get(':paymentId/history/admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getProofHistoryForAdmin(@Param('paymentId') paymentId: string) {
    return this.paymentProofService.getProofHistoryForAdmin(paymentId);
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIX: proxy do ficheiro através do backend.
  //
  // Causa raiz do "não é possível ver o ficheiro": ficheiros PDF na
  // Cloudinary usam resource_type='raw', e contas gratuitas/Free têm por
  // definição "Restricted media types" activo para 'raw' e 'image'
  // não-transformável — bloqueando a entrega pública mesmo com
  // access_mode:'public' no upload. A URL directa da Cloudinary
  // devolve 401 no browser, o que explica o "página não disponível".
  //
  // Solução: o backend, que tem a API key/secret e por isso acesso
  // garantido a qualquer recurso da própria conta, descarrega o
  // ficheiro server-to-server e serve-o ao browser através deste
  // endpoint. O browser nunca fala com a Cloudinary directamente.
  // ══════════════════════════════════════════════════════════════════════
  @Get('file/:proofId')
  async streamProofFile(
    @Param('proofId') proofId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, contentType, filename } =
      await this.paymentProofService.getProofFileForUser(proofId, user.id, user.role);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    });

    return new StreamableFile(buffer);
  }
}