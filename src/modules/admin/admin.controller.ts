import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── GET /api/admin/stats ──────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── GET /api/admin/recent-users ──────────────────────────────────────────
  @Get('recent-users')
  getRecentUsers() {
    return this.adminService.getRecentUsers();
  }

  // ─── GET /api/admin/pending-kyc ───────────────────────────────────────────
  @Get('pending-kyc')
  getPendingKyc() {
    return this.adminService.getPendingKyc();
  }

  // ─── PATCH /api/admin/kyc/:id/approve ─────────────────────────────────────
  @Patch('kyc/:id/approve')
  approveKyc(@Param('id') id: string) {
    return this.adminService.approveKyc(id);
  }

  // ─── PATCH /api/admin/kyc/:id/reject ──────────────────────────────────────
  @Patch('kyc/:id/reject')
  rejectKyc(@Param('id') id: string) {
    return this.adminService.rejectKyc(id);
  }

  // ─── Legacy (kept — do not remove) ────────────────────────────────────────
  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }
}