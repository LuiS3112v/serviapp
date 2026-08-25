import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('wallet')
@UseGuards(JwtGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  getMyWallet(@CurrentUser() user: any) {
    return this.walletService.getOrCreate(user.id);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.walletService.getTransactions(user.id, page, limit);
  }

  // SECURITY FIX (H-4): substituídos @Body('amount') soltos por DTOs
  // formais com class-validator. O ValidationPipe global (whitelist:true,
  // transform:true) agora valida e transforma o tipo antes de qualquer
  // lógica de serviço correr — rejeita strings, NaN, valores negativos
  // ou acima do limite com 400 Bad Request.
  @Post('deposit')
  deposit(@CurrentUser() user: any, @Body() dto: DepositDto) {
    return this.walletService.deposit(user.id, dto.amount, dto.description);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.walletService.withdraw(user.id, dto.amount);
  }
}