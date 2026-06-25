import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RejectCompanyKycDto } from '../companies/dto/reject-company-kyc.dto';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats gerais ──────────────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── Utilizadores ──────────────────────────────────────────────────────────
  @Get('recent-users')
  getRecentUsers() {
    return this.adminService.getRecentUsers();
  }

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // ── KYC individual (providers) ────────────────────────────────────────────
  @Get('pending-kyc')
  getPendingKyc() {
    return this.adminService.getPendingKyc();
  }

  @Patch('kyc/:id/approve')
  approveKyc(@Param('id') id: string) {
    return this.adminService.approveKyc(id);
  }

  @Patch('kyc/:id/reject')
  rejectKyc(@Param('id') id: string) {
    return this.adminService.rejectKyc(id);
  }

  // ── KYC empresarial ───────────────────────────────────────────────────────
  // Lista separada — badge "🏢 Empresa" no painel admin para nunca confundir
  // com verificações pessoais de providers individuais
  @Get('pending-company-kyc')
  getPendingCompanyKyc() {
    return this.adminService.getPendingCompanyKyc();
  }

  @Patch('company-kyc/:id/approve')
  approveCompanyKyc(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.approveCompanyKyc(id, user.id);
  }

  @Patch('company-kyc/:id/reject')
  rejectCompanyKyc(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: RejectCompanyKycDto,
  ) {
    return this.adminService.rejectCompanyKyc(id, user.id, dto);
  }
}