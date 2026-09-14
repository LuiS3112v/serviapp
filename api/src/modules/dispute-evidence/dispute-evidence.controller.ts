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

// ── Rotas acopladas ao serviço: /services/:id/dispute/evidence/* ──────────
@Controller('services')
@UseGuards(JwtGuard)
export class DisputeEvidenceController {
  constructor(private readonly evidenceService: DisputeEvidenceService) {}

  // POST /services/:id/dispute/evidence
  @Post(':id/dispute/evidence')
  @Throttle({ default: { limit: 20, ttl: 600000 } })
  @UseInterceptors(FileInterceptor('evidence', {
    limits: { fileSize: 5 * 1024 * 1024 },
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
  @Get(':id/dispute/evidence/mine')
  listMine(
    @Param('id', ParseUUIDPipe) serviceId: string,
    @CurrentUser() user: any,
  ) {
    return this.evidenceService.listMine(serviceId, user.id);
  }

  // GET /services/:id/dispute/evidence/admin
  @Get(':id/dispute/evidence/admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listForAdmin(@Param('id', ParseUUIDPipe) serviceId: string) {
    return this.evidenceService.listForAdmin(serviceId);
  }
}

// ── Rota de ficheiro num controller SEPARADO para evitar conflito ─────────
// O Nest resolve rotas por ordem de registo. Se o endpoint de ficheiro
// ficasse no mesmo controller que :id/dispute/evidence/*, o Nest tratava
// 'dispute-evidences' como valor do parâmetro :id e nunca chegava à rota
// certa. Prefixo dedicado 'dispute-evidences' elimina completamente essa
// ambiguidade — nenhuma outra rota começa por esse segmento.
@Controller('dispute-evidences')
@UseGuards(JwtGuard)
export class DisputeEvidenceFileController {
  constructor(private readonly evidenceService: DisputeEvidenceService) {}

  // GET /dispute-evidences/:evidenceId/file
  // Proxy seguro — o browser nunca fala directamente com a Cloudinary.
  // Dono da evidência ou admin: acesso. Outra parte: 403.
  @Get(':evidenceId/file')
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