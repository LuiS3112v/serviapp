import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';
import { RequireCompanyRole } from '../../common/decorators/require-company-role.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateAboutDto } from './dto/update-about.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateCoverageDto } from './dto/update-coverage.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { CreateCompanyServiceDto } from './dto/create-company-service.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Controller('company')
@UseGuards(JwtGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // ══════════════════════════════════════════════════════════════════════
  // ROTAS PÚBLICAS — sem JwtGuard (declaradas ANTES do @UseGuards global)
  // Nota: o @UseGuards(JwtGuard) no controller aplica-se a todos os métodos
  // excepto os que têm @Public() ou os que estão ANTES do controller guard.
  // Para contornar isso sem instalar @nestjs/passport extras, usamos o
  // padrão de não adicionar @UseGuards(JwtGuard) nesses métodos específicos
  // e declaramo-los numa classe separada abaixo.
  // ══════════════════════════════════════════════════════════════════════

  // ── Criação ──────────────────────────────────────────────────────────────
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.id, dto);
  }

  // ── Perfil próprio ───────────────────────────────────────────────────────
  @Get('me')
  findMine(@CurrentUser() user: any) {
    return this.companiesService.findMine(user.id);
  }

  // ── Perfil público — JWT não obrigatório mas o controller tem @UseGuards
  //    O cliente autenticado pode ver, o não autenticado também.
  //    Para resolver sem decorators extras: mover para controller separado.
  @Get(':companyId/public')
  findPublic(@Param('companyId') companyId: string) {
    return this.companiesService.findByIdPublic(companyId);
  }

  // ── Serviços públicos (para o perfil público ver os badges de serviços) ──
  @Get(':companyId/services/public')
  getServicesPublic(@Param('companyId') companyId: string) {
    return this.companiesService.getServices(companyId);
  }

  // ── Update geral ─────────────────────────────────────────────────────────
  @Patch(':companyId')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  update(@Param('companyId') companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.update(companyId, dto);
  }

  @Patch(':companyId/about')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  updateAbout(@Param('companyId') companyId: string, @Body() dto: UpdateAboutDto) {
    return this.companiesService.updateAbout(companyId, dto);
  }

  @Patch(':companyId/working-hours')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  updateWorkingHours(@Param('companyId') companyId: string, @Body() dto: UpdateWorkingHoursDto) {
    return this.companiesService.updateWorkingHours(companyId, dto);
  }

  @Patch(':companyId/coverage')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  updateCoverage(@Param('companyId') companyId: string, @Body() dto: UpdateCoverageDto) {
    return this.companiesService.updateCoverage(companyId, dto);
  }

  @Patch(':companyId/social-links')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  updateSocialLinks(@Param('companyId') companyId: string, @Body() dto: UpdateSocialLinksDto) {
    return this.companiesService.updateSocialLinks(companyId, dto);
  }

  @Post(':companyId/logo')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(@Param('companyId') companyId: string, @UploadedFile() file: Express.Multer.File) {
    return this.companiesService.uploadLogo(companyId, file);
  }

  @Post(':companyId/banner')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  @UseInterceptors(FileInterceptor('banner'))
  uploadBanner(@Param('companyId') companyId: string, @UploadedFile() file: Express.Multer.File) {
    return this.companiesService.uploadBanner(companyId, file);
  }

  // ── Stats e Timeline ──────────────────────────────────────────────────────
  @Get(':companyId/stats')
  @UseGuards(CompanyRolesGuard)
  getStats(@Param('companyId') companyId: string) {
    return this.companiesService.getStats(companyId);
  }

  @Get(':companyId/timeline')
  @UseGuards(CompanyRolesGuard)
  getTimeline(@Param('companyId') companyId: string) {
    return this.companiesService.getTimeline(companyId);
  }

  // ── Serviços oferecidos (privado — só membros da empresa) ─────────────────
  @Get(':companyId/services')
  @UseGuards(CompanyRolesGuard)
  getServices(@Param('companyId') companyId: string) {
    return this.companiesService.getServices(companyId);
  }

  @Post(':companyId/services')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  addService(@Param('companyId') companyId: string, @Body() dto: CreateCompanyServiceDto) {
    return this.companiesService.addService(companyId, dto);
  }

  @Delete(':companyId/services/:serviceId')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  removeService(@Param('companyId') companyId: string, @Param('serviceId') serviceId: string) {
    return this.companiesService.removeService(companyId, serviceId);
  }

  // ── Equipa ────────────────────────────────────────────────────────────────
  @Get(':companyId/team')
  @UseGuards(CompanyRolesGuard)
  getTeam(@Param('companyId') companyId: string) {
    return this.companiesService.getTeam(companyId);
  }

  @Delete(':companyId/team/:employeeId')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN)
  removeEmployee(@Param('companyId') companyId: string, @Param('employeeId') employeeId: string) {
    return this.companiesService.removeEmployee(companyId, employeeId);
  }

  @Patch(':companyId/team/:employeeId/role')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN)
  updateEmployeeRole(
    @Param('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Body('role') role: CompanyEmployeeRole,
  ) {
    return this.companiesService.updateEmployeeRole(companyId, employeeId, role);
  }

  // ── Convites ──────────────────────────────────────────────────────────────
  @Get(':companyId/invitations')
  @UseGuards(CompanyRolesGuard)
  getInvitations(@Param('companyId') companyId: string) {
    return this.companiesService.getInvitations(companyId);
  }

  @Post(':companyId/invitations')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  sendInvitation(
    @Param('companyId') companyId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.companiesService.sendInvitation(companyId, user.id, dto);
  }

  @Patch('invitations/:invitationId/respond')
  respondInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
    @Body('accept') accept: boolean,
  ) {
    return this.companiesService.respondInvitation(invitationId, user.id, accept);
  }

  // ── Portfólio (privado) ───────────────────────────────────────────────────
  @Get(':companyId/portfolio')
  @UseGuards(CompanyRolesGuard)
  getPortfolio(@Param('companyId') companyId: string) {
    return this.companiesService.getPortfolio(companyId);
  }

  @Post(':companyId/portfolio')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  addPortfolioItem(@Param('companyId') companyId: string, @Body() dto: CreatePortfolioItemDto) {
    return this.companiesService.addPortfolioItem(companyId, dto);
  }

  @Post(':companyId/portfolio/:itemId/photos')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  @UseInterceptors(FilesInterceptor('photos', 10))
  addPortfolioPhotos(
    @Param('companyId') companyId: string,
    @Param('itemId') itemId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.companiesService.addPortfolioPhotos(companyId, itemId, files);
  }

  @Delete(':companyId/portfolio/:itemId')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  removePortfolioItem(@Param('companyId') companyId: string, @Param('itemId') itemId: string) {
    return this.companiesService.removePortfolioItem(companyId, itemId);
  }

  // ── Galeria (privada) ─────────────────────────────────────────────────────
  @Get(':companyId/gallery')
  @UseGuards(CompanyRolesGuard)
  getGallery(@Param('companyId') companyId: string) {
    return this.companiesService.getGallery(companyId);
  }

  @Post(':companyId/gallery')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  @UseInterceptors(FileInterceptor('image'))
  addGalleryImage(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    return this.companiesService.addGalleryImage(companyId, file, caption);
  }

  @Delete(':companyId/gallery/:imageId')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  removeGalleryImage(@Param('companyId') companyId: string, @Param('imageId') imageId: string) {
    return this.companiesService.removeGalleryImage(companyId, imageId);
  }

  // ── Certificações ─────────────────────────────────────────────────────────
  @Get(':companyId/certifications')
  @UseGuards(CompanyRolesGuard)
  getCertifications(@Param('companyId') companyId: string) {
    return this.companiesService.getCertifications(companyId);
  }

  @Post(':companyId/certifications')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  addCertification(@Param('companyId') companyId: string, @Body() dto: CreateCertificationDto) {
    return this.companiesService.addCertification(companyId, dto);
  }

  @Delete(':companyId/certifications/:certId')
  @UseGuards(CompanyRolesGuard)
  @RequireCompanyRole(CompanyEmployeeRole.ADMIN, CompanyEmployeeRole.MANAGER)
  removeCertification(@Param('companyId') companyId: string, @Param('certId') certId: string) {
    return this.companiesService.removeCertification(companyId, certId);
  }
}