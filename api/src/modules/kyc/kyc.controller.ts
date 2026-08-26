import {
  Controller, Post, Get, Patch, Param, Body,
  UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { RejectKycDto } from './dto/reject-kyc.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtGuard, RolesGuard)
@Controller()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('provider/kyc/submit')
  @Roles(Role.PROVIDER, Role.COMPANY)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'frontBi', maxCount: 1 },
        { name: 'backBi', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        // SECURITY FIX: sem limits, o multer aceitava qualquer tamanho
        // de ficheiro em memória antes de qualquer validação de negócio
        // (KycService.validateFiles) correr. Um ficheiro de centenas de
        // MB já teria consumido memória do processo antes de ser
        // rejeitado. 5MB alinhado com o limite já usado em
        // validateFiles() e em CloudinaryService.uploadBuffer.
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  async submit(
    @CurrentUser() user: any,
    @Body() dto: SubmitKycDto,
    @UploadedFiles() files: {
      frontBi: Express.Multer.File[];
      backBi: Express.Multer.File[];
      selfie: Express.Multer.File[];
    },
  ) {
    return this.kycService.submit(user.id, dto, files);
  }

  @Get('provider/kyc/status')
  @Roles(Role.PROVIDER, Role.COMPANY)
  async getMyStatus(@CurrentUser() user: any) {
    return this.kycService.getMyStatus(user.id);
  }

  @Get('admin/kyc/pending')
  @Roles(Role.ADMIN)
  async getPending() {
    return this.kycService.getPending();
  }

  @Get('admin/kyc/:id')
  @Roles(Role.ADMIN)
  async getById(@Param('id') id: string) {
    return this.kycService.getById(id);
  }

  @Patch('admin/kyc/:id/approve')
  @Roles(Role.ADMIN)
  async approve(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.kycService.approve(id, admin.id);
  }

  @Patch('admin/kyc/:id/reject')
  @Roles(Role.ADMIN)
  async reject(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: RejectKycDto,
  ) {
    return this.kycService.reject(id, admin.id, dto);
  }

  // SECURITY FIX (KYC URLs publicas): devolve URLs assinadas com
  // expiracao de 15 minutos para os documentos KYC. So o admin pode
  // chamar este endpoint. As URLs directas do Cloudinary deixaram de
  // funcionar porque o upload passou a usar type:'authenticated'.
  // O frontend deve chamar este endpoint sempre que quiser visualizar
  // os documentos — nao guardar as URLs em cache.
  @Get('admin/kyc/:id/signed-urls')
  @Roles(Role.ADMIN)
  async getSignedUrls(@Param('id') id: string) {
    return this.kycService.getSignedDocumentUrls(id);
  }
}