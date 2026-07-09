import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminPaymentsService } from './admin-payments.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RejectProofDto } from './dto/reject-proof.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Controller('admin/payments')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPaymentsController {
  constructor(private readonly adminPaymentsService: AdminPaymentsService) {}

  @Get('pending-proofs')
  listPendingProofs() {
    return this.adminPaymentsService.listPendingProofs();
  }

  @Get('confirmed')
  listConfirmedPayments() {
    return this.adminPaymentsService.listConfirmedPayments();
  }

  @Get('pending-payouts')
  listPendingPayouts() {
    return this.adminPaymentsService.listPendingPayouts();
  }

  // ── Serviços em disputa ────────────────────────────────────────────────
  @Get('disputed')
  listDisputedServices() {
    return this.adminPaymentsService.listDisputedServices();
  }

  @Patch('disputed/:serviceId/resolve-client')
  resolveDisputeForClient(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: any,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.adminPaymentsService.resolveDisputeForClient(serviceId, user.id, dto.resolution);
  }

  @Patch('disputed/:serviceId/resolve-provider')
  resolveDisputeForProvider(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: any,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.adminPaymentsService.resolveDisputeForProvider(serviceId, user.id, dto.resolution);
  }

  @Get(':id')
  getPaymentDetail(@Param('id') id: string) {
    return this.adminPaymentsService.getPaymentDetail(id);
  }

  @Patch(':id/confirm-proof')
  confirmProof(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminPaymentsService.confirmProof(id, user.id);
  }

  @Patch(':id/reject-proof')
  rejectProof(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: RejectProofDto) {
    return this.adminPaymentsService.rejectProof(id, user.id, dto.reason);
  }

  @Patch(':id/mark-payout-done')
  markPayoutDone(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminPaymentsService.markPayoutDone(id, user.id);
  }
}