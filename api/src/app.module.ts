import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthModule }              from './modules/auth/auth.module';
import { UsersModule }             from './modules/users/users.module';
import { KycModule }               from './modules/kyc/kyc.module';
import { CloudinaryModule }        from './modules/cloudinary/cloudinary.module';
import { AdminModule }             from './modules/admin/admin.module';
import { NotificationsModule }     from './modules/notifications/notifications.module';
import { ServicesModule }          from './modules/services/services.module';
import { GeolocationModule }       from './modules/geolocation/geolocation.module';
import { ChatModule }              from './modules/chat/chat.module';
import { ProviderCatalogModule }   from './modules/provider-catalog/provider-catalog.module';
import { CompaniesModule }         from './modules/companies/companies.module';
import { WalletModule }            from './modules/wallet/wallet.module';
import { BankAccountsModule }      from './modules/bank-accounts/bank-accounts.module';
import { PlatformSettingsModule }  from './modules/platform-settings/platform-settings.module';
import { PaymentProofModule }      from './modules/payment-proof/payment-proof.module';
import { AdminPaymentsModule }     from './modules/admin-payments/admin-payments.module';
import { ActiveServiceLocationModule } from './modules/active-service-location/active-service-location.module';
import { SecurityModule }          from './modules/security/security.module';
import { SubcategoryServicesModule } from './modules/subcategory-services/subcategory-services.module';
import { ThrottlerExceptionFilter } from './common/filters/throttler-exception.filter';

// ── Entities ──────────────────────────────────────────────────────────────
import { User }                 from './database/entities/user.entity';
import { ProviderVerification } from './database/entities/provider-verification.entity';
import { Service }              from './database/entities/service.entity';
import { Notification }         from './database/entities/notification.entity';
import { DeviceToken }          from './database/entities/device-token.entity';
import { ChatRoom }             from './database/entities/chat-room.entity';
import { ChatMessage }          from './database/entities/chat-message.entity';
import { ProviderCatalog }      from './database/entities/provider-catalog.entity';
import { Company }               from './database/entities/company.entity';
import { CompanyVerification }   from './database/entities/company-verification.entity';
import { CompanyEmployee }       from './database/entities/company-employee.entity';
import { CompanyInvitation }     from './database/entities/company-invitation.entity';
import { CompanyService }        from './database/entities/company-service.entity';
import { CompanyPortfolioItem }  from './database/entities/company-portfolio-item.entity';
import { CompanyGalleryImage }   from './database/entities/company-gallery-image.entity';
import { CompanyCertification }  from './database/entities/company-certification.entity';
import { ServiceTimeline } from './database/entities/service-timeline.entity';
import { Payment }         from './database/entities/payment.entity';
import { Wallet }          from './database/entities/wallet.entity';
import { Transaction }     from './database/entities/transaction.entity';
import { Dispute }         from './database/entities/dispute.entity';
import { PlatformBankAccount } from './database/entities/platform-bank-account.entity';
import { ProviderBankAccount } from './database/entities/provider-bank-account.entity';
import { PaymentProof }        from './database/entities/payment-proof.entity';
import { PlatformSettings }    from './database/entities/platform-settings.entity';
import { UserSession } from './database/entities/user-session.entity';
import { SecurityLog }  from './database/entities/security-log.entity';
import { SubcategoryService }           from './database/entities/subcategory-service.entity';
import { SubcategoryServiceProposal }   from './database/entities/subcategory-service-proposal.entity';
import { SubcategoryServiceDismissal }  from './database/entities/subcategory-service-dismissal.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 60 },
    ]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [
          User, ProviderVerification, Service,
          Notification, DeviceToken,
          ChatRoom, ChatMessage,
          ProviderCatalog,
          Company, CompanyVerification, CompanyEmployee,
          CompanyInvitation, CompanyService, CompanyPortfolioItem,
          CompanyGalleryImage, CompanyCertification,
          ServiceTimeline, Payment, Wallet, Transaction, Dispute,
          PlatformBankAccount, ProviderBankAccount, PaymentProof, PlatformSettings,
          UserSession, SecurityLog,
          SubcategoryService, SubcategoryServiceProposal, SubcategoryServiceDismissal,
        ],
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false } : false,
        synchronize: process.env.NODE_ENV !== 'production',
        logging: false,
      }),
    }),
    AuthModule,
    UsersModule,
    KycModule,
    CloudinaryModule,
    AdminModule,
    NotificationsModule,
    ServicesModule,
    GeolocationModule,
    ChatModule,
    ProviderCatalogModule,
    CompaniesModule,
    WalletModule,
    BankAccountsModule,
    PlatformSettingsModule,
    PaymentProofModule,
    AdminPaymentsModule,
    ActiveServiceLocationModule,
    SecurityModule,
    SubcategoryServicesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Registado dentro do DI do NestJS via APP_FILTER — ao contrário de
    // useGlobalFilters(new ...) no main.ts, esta forma garante que o
    // filtro é instanciado pelo contentor, recebe injecções se precisar,
    // e é invocado de forma consistente para TODAS as excepções
    // ThrottlerException em qualquer contexto (HTTP, WS, RPC).
    {
      provide: APP_FILTER,
      useClass: ThrottlerExceptionFilter,
    },
  ],
})
export class AppModule {}