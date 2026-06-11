import {
  Controller, Get, Post, Patch, Body,
  Param, Query, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AcceptServiceDto } from './dto/accept-service.dto';
import { CancelServiceDto } from './dto/cancel-service.dto';
import { ReviewServiceDto } from './dto/review-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
 
@UseGuards(JwtGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}
 
  // ─── CLIENT ───────────────────────────────────────────────────────────────
 
  @Post()
  @Roles(Role.CLIENT)
  create(@CurrentUser() user: any, @Body() dto: CreateServiceDto) {
    // Passa o fullName para poder notificar o provider com o nome real do cliente
    return this.servicesService.create(user.id, dto, user.fullName);
  }
 
  @Get('my')
  @Roles(Role.CLIENT)
  findMine(@CurrentUser() user: any, @Query() filter: FilterServicesDto) {
    return this.servicesService.findByClient(user.id, filter);
  }
 
  @Get('client/stats')
  @Roles(Role.CLIENT)
  getClientStats(@CurrentUser() user: any) {
    return this.servicesService.getClientStats(user.id);
  }
 
  @Patch('client/:id/update')
  @Roles(Role.CLIENT)
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, user.id, dto);
  }
 
  @Patch('client/:id/confirm')
  @Roles(Role.CLIENT)
  confirm(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ReviewServiceDto) {
    return this.servicesService.confirm(id, user.id, dto);
  }
 
  @Patch('client/:id/accept-proposal')
  @Roles(Role.CLIENT)
  acceptProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.acceptProposal(id, user.id);
  }
 
  @Patch('client/:id/reject-proposal')
  @Roles(Role.CLIENT)
  rejectProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.rejectProposal(id, user.id);
  }
 
  @Patch('client/:id/cancel')
  @Roles(Role.CLIENT)
  cancelClient(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CancelServiceDto) {
    return this.servicesService.cancel(id, user.id, dto);
  }
 
  // ─── PROVIDER ─────────────────────────────────────────────────────────────
 
  @Get('available')
  @Roles(Role.PROVIDER, Role.COMPANY)
  findAvailable(@CurrentUser() user: any, @Query() filter: FilterServicesDto) {
    return this.servicesService.findAvailable(user.id, filter);
  }
 
  @Get('provider/my')
  @Roles(Role.PROVIDER, Role.COMPANY)
  findProviderServices(@CurrentUser() user: any, @Query() filter: FilterServicesDto) {
    return this.servicesService.findByProvider(user.id, filter);
  }
 
  @Get('provider/proposals')
  @Roles(Role.PROVIDER, Role.COMPANY)
  findMyProposals(@CurrentUser() user: any) {
    return this.servicesService.findMyProposals(user.id);
  }
 
  @Get('provider/stats')
  @Roles(Role.PROVIDER, Role.COMPANY)
  getProviderStats(@CurrentUser() user: any) {
    return this.servicesService.getProviderStats(user.id);
  }
 
  @Get('provider/stats/period')
  @Roles(Role.PROVIDER, Role.COMPANY)
  getProviderStatsByPeriod(@CurrentUser() user: any, @Query('period') period: string) {
    return this.servicesService.getProviderStatsByPeriod(user.id, period ?? 'Este mês');
  }
 
  @Get('provider/reviews')
  @Roles(Role.PROVIDER, Role.COMPANY)
  getProviderReviews(@CurrentUser() user: any) {
    return this.servicesService.getProviderReviews(user.id);
  }
 
  @Patch('provider/:id/accept')
  @Roles(Role.PROVIDER, Role.COMPANY)
  accept(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: AcceptServiceDto) {
    return this.servicesService.accept(id, user.id, dto);
  }
 
  @Patch('provider/:id/propose')
  @Roles(Role.PROVIDER, Role.COMPANY)
  proposePrice(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ProposePriceDto) {
    return this.servicesService.proposePrice(id, user.id, dto);
  }
 
  @Patch('provider/:id/start')
  @Roles(Role.PROVIDER, Role.COMPANY)
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.start(id, user.id);
  }
 
  @Patch('provider/:id/complete')
  @Roles(Role.PROVIDER, Role.COMPANY)
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.servicesService.complete(id, user.id);
  }
 
  @Patch('provider/:id/cancel')
  @Roles(Role.PROVIDER, Role.COMPANY)
  cancelProvider(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CancelServiceDto) {
    return this.servicesService.cancel(id, user.id, dto);
  }
 
  // ─── PARTILHADO ───────────────────────────────────────────────────────────
 
  @Get(':id')
  @Roles(Role.CLIENT, Role.PROVIDER, Role.COMPANY, Role.ADMIN)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // Protege contra strings inválidas como "new" chegarem à BD
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) {
      throw new NotFoundException('Recurso não encontrado.');
    }
    return this.servicesService.findOne(id, user.id, user.role);
  }
 
  // ─── ADMIN ────────────────────────────────────────────────────────────────
 
  @Get('admin/all')
  @Roles(Role.ADMIN)
  findAll(@Query() filter: FilterServicesDto) {
    return this.servicesService.findAll(filter);
  }
}