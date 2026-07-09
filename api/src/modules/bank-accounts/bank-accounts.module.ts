import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { PlatformBankAccount } from '../../database/entities/platform-bank-account.entity';
import { ProviderBankAccount } from '../../database/entities/provider-bank-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformBankAccount, ProviderBankAccount])],
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
  exports: [BankAccountsService],
})
export class BankAccountsModule {}