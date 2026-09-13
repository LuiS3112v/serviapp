import {
  Controller, Get, Post, Param, Body, UseGuards,
  UseInterceptors, UploadedFile, Res, StreamableFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DisputeEvidenceService } from './dispute-evidence.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('services')
@UseGuards(JwtGuard)
export class DisputeEvidenceController {
  constructor(private readonly evidenceService: DisputeEvidenceService) {}

  // POST /services/:id/dispute/evidence
  // Cliente ou prestador do serviço envia evidência (multipart).
  @Post(':id/dispute/evidence')
  @Throttle({ default: { limit: 20, ttl: 600000 } })
  @UseInterceptors(FileInterceptor('evidence', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  }))
  upload(
    @Param('id', ParseUUIDPipe) serviceId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
  ) {
    return this.evidenceService.upload(serviceId, user.id, user.role, file, description);
  }

  // GET /services/:id/dispute/evidence/mine
  // Cada parte vê só as suas próprias evidências.
  @Get(':id/dispute/evidence/mine')
  listMine(
    @Param('id', ParseUUIDPipe) serviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.evidenceService.listMine(serviceId, user.id);
  }

  // GET /services/:id/dispute/evidence/admin
  // Admin vê evidências de ambas as partes com info do uploader.
  @Get(':id/dispute/evidence/admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listForAdmin(@Param('id', ParseUUIDPipe) serviceId: string) {
    return this.evidenceService.listForAdmin(serviceId);
  }

  // GET /services/dispute-evidence/:evidenceId/file
  // Proxy seguro — o browser nunca fala directamente com a Cloudinary.
  // Cliente/prestador: só o ficheiro próprio. Admin: qualquer ficheiro.
  @Get('dispute-evidence/:evidenceId/file')
  async streamFile(
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, contentType, filename } =
      await this.evidenceService.getFile(evidenceId, user.id, user.role);

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    });

    return new StreamableFile(buffer);
  }
}