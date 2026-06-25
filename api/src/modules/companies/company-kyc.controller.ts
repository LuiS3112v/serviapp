import {
  Controller, Post, Get, Body, Param, UseGuards, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompanyKycService } from './company-kyc.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { RequireCompanyRole } from '../../common/decorators/require-company-role.decorator';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';
import { SubmitCompanyKycDto } from './dto/submit-company-kyc.dto';

@Controller('company-kyc')
@UseGuards(JwtGuard)
export class CompanyKycController {
  constructor(private readonly companyKycService: CompanyKycService) {}

  // POST /api/company-kyc/:companyId/submit
  // Só o owner ou admin da empresa pode submeter KYC
  @Post(':companyId/submit')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'nifDoc',            maxCount: 1 },
      { name: 'commercialLicense', maxCount: 1 },
      { name: 'commercialRegistry',maxCount: 1 },
      { name: 'representativeId',  maxCount: 1 },
    ]),
  )
  submit(
    @Param('companyId') companyId: string,
    @Body() dto: SubmitCompanyKycDto,
    @UploadedFiles()
    files: {
      nifDoc?:             Express.Multer.File[];
      commercialLicense?:  Express.Multer.File[];
      commercialRegistry?: Express.Multer.File[];
      representativeId?:   Express.Multer.File[];
    },
  ) {
    return this.companyKycService.submit(companyId, dto, files);
  }

  // GET /api/company-kyc/:companyId/status
  // Owner e qualquer membro da empresa podem ver o estado
  @Get(':companyId/status')
  @UseGuards(CompanyRolesGuard)
  getMyStatus(@Param('companyId') companyId: string) {
    return this.companyKycService.getMyStatus(companyId);
  }
}