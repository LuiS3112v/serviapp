import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { Payment } from '../../database/entities/payment.entity';
import { Service } from '../../database/entities/service.entity';
import { PaymentProofModule } from '../payment-proof/payment-proof.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { WalletModule } from '../wallet/wallet.module';
import { ServicesModule } from '../services/services.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProviderCatalogModule } from '../provider-catalog/provider-catalog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Service]),
    PaymentProofModule,
    BankAccountsModule,
    WalletModule,
    ServicesModule,
    NotificationsModule,
    ProviderCatalogModule,
  ],
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService],
  exports: [AdminPaymentsService],
})
export class AdminPaymentsModule {}