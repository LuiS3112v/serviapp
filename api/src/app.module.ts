import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KycModule } from './modules/kyc/kyc.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ServicesModule } from './modules/services/services.module';
import { GeolocationModule } from './modules/geolocation/geolocation.module';
import { ChatModule } from './modules/chat/chat.module';
import { ProviderCatalogModule } from './modules/provider-catalog/provider-catalog.module';
import { CompaniesModule } from './modules/companies/companies.module';

// ── Entities existentes ───────────────────────────────────────────────────
import { User } from './database/entities/user.entity';
import { ProviderVerification } from './database/entities/provider-verification.entity';
import { Service } from './database/entities/service.entity';
import { Notification } from './database/entities/notification.entity';
import { DeviceToken } from './database/entities/device-token.entity';
import { ChatRoom } from './database/entities/chat-room.entity';
import { ChatMessage } from './database/entities/chat-message.entity';
import { ProviderCatalog } from './database/entities/provider-catalog.entity';

// ── Entities do sistema de empresa (novas) ────────────────────────────────
import { Company } from './database/entities/company.entity';
import { CompanyVerification } from './database/entities/company-verification.entity';
import { CompanyEmployee } from './database/entities/company-employee.entity';
import { CompanyInvitation } from './database/entities/company-invitation.entity';
import { CompanyService } from './database/entities/company-service.entity';
import { CompanyPortfolioItem } from './database/entities/company-portfolio-item.entity';
import { CompanyGalleryImage } from './database/entities/company-gallery-image.entity';
import { CompanyCertification } from './database/entities/company-certification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [
          // ── Existentes ──────────────────────────────────────────────
          User,
          ProviderVerification,
          Service,
          Notification,
          DeviceToken,
          ChatRoom,
          ChatMessage,
          ProviderCatalog,
          // ── Sistema de empresa ───────────────────────────────────────
          Company,
          CompanyVerification,
          CompanyEmployee,
          CompanyInvitation,
          CompanyService,
          CompanyPortfolioItem,
          CompanyGalleryImage,
          CompanyCertification,
        ],
        ssl: process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
        synchronize: process.env.NODE_ENV !== 'production',
        logging: false,
      }),
    }),

    // ── Módulos existentes ──────────────────────────────────────────────
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

    // ── Módulo de empresa (novo) ────────────────────────────────────────
    CompaniesModule,
  ],
})
export class AppModule {}