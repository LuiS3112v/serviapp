import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from '../../database/entities/service.entity';
import { ServiceTimeline } from '../../database/entities/service-timeline.entity';
import { Payment } from '../../database/entities/payment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletModule } from '../wallet/wallet.module';
import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { GeoDistributionModule } from '../geo-distribution/geo-distribution.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceTimeline, Payment]),
    NotificationsModule,
    WalletModule,
    BankAccountsModule,
    PlatformSettingsModule,
    GeoDistributionModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}