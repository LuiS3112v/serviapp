import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpsertPlatformBankAccountDto } from './dto/upsert-platform-bank-account.dto';
import { UpsertProviderBankAccountDto } from './dto/upsert-provider-bank-account.dto';

@Controller('bank-accounts')
@UseGuards(JwtGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  // ── Conta da plataforma — qualquer utilizador autenticado pode ver ──────
  // (é a conta para onde vai transferir, tem de a poder ver)
  @Get('platform')
  getPlatformAccount() {
    return this.bankAccountsService.getDefaultPlatformAccount();
  }

  // ── Gestão da conta da plataforma — só admin ────────────────────────────
  @Get('platform/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listPlatformAccounts() {
    return this.bankAccountsService.listPlatformAccounts();
  }

  @Post('platform')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  createPlatformAccount(@Body() dto: UpsertPlatformBankAccountDto) {
    return this.bankAccountsService.createPlatformAccount(dto);
  }

  @Patch('platform/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updatePlatformAccount(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertPlatformBankAccountDto>,
  ) {
    return this.bankAccountsService.updatePlatformAccount(id, dto);
  }

  // ── Conta do próprio prestador ──────────────────────────────────────────
  @Get('provider/me')
  getMyProviderAccount(@CurrentUser() user: any) {
    return this.bankAccountsService.getMyProviderAccount(user.id);
  }

  @Patch('provider/me')
  upsertMyProviderAccount(
    @CurrentUser() user: any,
    @Body() dto: UpsertProviderBankAccountDto,
  ) {
    return this.bankAccountsService.upsertMyProviderAccount(user.id, dto);
  }
}