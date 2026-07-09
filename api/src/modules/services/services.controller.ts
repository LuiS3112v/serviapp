import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { Role } from '../../common/enums/role.enum';

@Controller('services')
@UseGuards(JwtGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ── Criar pedido ──────────────────────────────────────────────────────────
  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.id, dto);
  }

  // ══════════════════════════════════════════════════════════════════════
  // ROTAS ESTÁTICAS — todas ANTES de :id, sem excepção. Ver nota no topo
  // do ficheiro sobre porque isto é obrigatório (Nest resolve por ordem).
  // ══════════════════════════════════════════════════════════════════════

  @Get('my')
  myServices(@CurrentUser() user: any, @Query('status') status?: string) {
    if (user.role === Role.PROVIDER || user.role === Role.COMPANY) {
      return this.servicesService.findByProvider(user.id, status);
    }
    return this.servicesService.findByClient(user.id, status);
  }

  @Get('my-requests')
  myRequests(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.servicesService.findByClient(user.id, status);
  }

  @Get('my-jobs')
  myJobs(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.servicesService.findByProvider(user.id, status);
  }

  @Get('available')
  availableForProvider(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('province') province?: string,
    @Query('minBudget') minBudget?: string,
    @Query('maxBudget') maxBudget?: string,
  ) {
    return this.servicesService.findAvailableForProvider(user.id, {
      category,
      province,
      minBudget: minBudget ? Number(minBudget) : undefined,
      maxBudget: maxBudget ? Number(maxBudget) : undefined,
    });
  }

  // ── Estatísticas cliente (fluxo antigo) ────────────────────────────────────
  @Get('client/stats')
  getClientStats(@CurrentUser() user: any) {
    return this.servicesService.getClientStats(user.id);
  }

  // ── Rotas de prestador com prefixo /provider/ (fluxo antigo) ──────────────
  @Get('provider/my')
  providerMy(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.servicesService.findByProvider(user.id, status);
  }

  @Get('provider/proposals')
  providerProposals(@CurrentUser() user: any) {
    return this.servicesService.findMyProposals(user.id);
  }

  @Get('provider/stats')
  providerStats(@CurrentUser() user: any) {
    return this.servicesService.getProviderStats(user.id);
  }

  @Get('provider/stats/period')
  providerStatsByPeriod(@CurrentUser() user: any, @Query('period') period: string) {
    return this.servicesService.getProviderStatsByPeriod(user.id, period ?? 'Este mês');
  }

  @Get('provider/reviews')
  providerReviews(@CurrentUser() user: any) {
    return this.servicesService.getProviderReviews(user.id);
  }

  // ══════════════════════════════════════════════════════════════════════
  // DETALHE — :id fica sempre por último entre as rotas GET
  // ══════════════════════════════════════════════════════════════════════

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.servicesService.findByIdForUser(id, user.id, user.role);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.getTimeline(id);
  }

  @Get(':id/payment')
  getPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.getPaymentForService(id);
  }

  // ── Aceitação / rejeição (rota nova, sem prefixo) ──────────────────────────
  @Patch(':id/accept')
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('agreedPrice') agreedPrice?: number,
  ) {
    return this.servicesService.accept(id, user.id, agreedPrice);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.servicesService.reject(id, user.id, reason);
  }

  // ── Aceitação / rejeição / proposta com prefixo /provider/ (fluxo antigo) ─
  @Patch('provider/:id/accept')
  providerAccept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('agreedPrice') agreedPrice: number,
  ) {
    return this.servicesService.accept(id, user.id, agreedPrice);
  }

  @Patch('provider/:id/propose')
  providerPropose(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('proposedPrice') proposedPrice: number,
  ) {
    return this.servicesService.proposePrice(id, user.id, proposedPrice);
  }

  @Patch('provider/:id/start')
  providerStart(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    // Fluxo antigo não tem PIN — mas o produto actual exige-o sempre.
    // Se o cliente não gerou PIN ainda, esta chamada vai falhar com uma
    // mensagem clara em vez de rebentar silenciosamente.
    return this.servicesService.startService(id, user.id, '');
  }

  @Patch('provider/:id/complete')
  providerComplete2(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.servicesService.markProviderCompleted(id, user.id);
  }

  @Patch('provider/:id/cancel')
  providerCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.servicesService.cancel(id, user.id, reason);
  }

  // ── Cliente: update / confirmar / proposta com prefixo /client/ (antigo) ──
  @Patch('client/:id/update')
  clientUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: Partial<CreateServiceDto>,
  ) {
    return this.servicesService.updateByClient(id, user.id, dto);
  }

  @Patch('client/:id/confirm')
  clientConfirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: { rating?: number; review?: string },
  ) {
    return this.servicesService.confirmCompletion(id, user.id, body);
  }

  @Patch('client/:id/accept-proposal')
  clientAcceptProposal(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.servicesService.acceptProposal(id, user.id);
  }

  @Patch('client/:id/reject-proposal')
  clientRejectProposal(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.servicesService.rejectProposal(id, user.id);
  }

  @Patch('client/:id/cancel')
  clientCancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.servicesService.cancel(id, user.id, reason);
  }

  // ── Pagamento (escrow) ────────────────────────────────────────────────────
  @Post(':id/pay')
  pay(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.servicesService.initiatePayment(id, user.id);
  }

  // ── PIN ───────────────────────────────────────────────────────────────────
  @Post(':id/generate-pin')
  generatePin(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.servicesService.generatePin(id, user.id);
  }

  @Patch(':id/start')
  startService(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('pin') pin: string,
  ) {
    return this.servicesService.startService(id, user.id, pin);
  }

  // ── Conclusão (rota nova, sem prefixo) ─────────────────────────────────────
  @Patch(':id/provider-complete')
  providerCompleteNew(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('warrantyDays') warrantyDays?: number,
  ) {
    return this.servicesService.markProviderCompleted(id, user.id, warrantyDays);
  }

  @Patch(':id/confirm')
  confirmCompletion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() body: { rating?: number; review?: string },
  ) {
    return this.servicesService.confirmCompletion(id, user.id, body);
  }

  // ── Cancelamento (rota nova, sem prefixo) ──────────────────────────────────
  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.servicesService.cancel(id, user.id, reason);
  }

  // ── Disputa ───────────────────────────────────────────────────────────────
  @Post(':id/dispute')
  openDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body('reason') reason: string,
  ) {
    return this.servicesService.openDispute(id, user.id, reason);
  }
}