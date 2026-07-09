import { Controller, Get, Post, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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

  @Post('deposit')
  deposit(
    @CurrentUser() user: any,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    return this.walletService.deposit(user.id, Number(amount), description);
  }

  @Post('withdraw')
  withdraw(@CurrentUser() user: any, @Body('amount') amount: number) {
    return this.walletService.withdraw(user.id, Number(amount));
  }
}