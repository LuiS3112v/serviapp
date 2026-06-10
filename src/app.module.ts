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
import { User } from './database/entities/user.entity';
import { ProviderVerification } from './database/entities/provider-verification.entity';
import { Service } from './database/entities/service.entity';
import { Notification } from './database/entities/notification.entity';
import { DeviceToken } from './database/entities/device-token.entity';
import { ChatRoom } from './database/entities/chat-room.entity';
import { ChatMessage } from './database/entities/chat-message.entity';
import { ProviderCatalog } from './database/entities/provider-catalog.entity';

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
          User, ProviderVerification, Service,
          Notification, DeviceToken,
          ChatRoom, ChatMessage,
          ProviderCatalog,
        ],
        synchronize: true,
        ssl: { rejectUnauthorized: false },
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
  ],
})
export class AppModule {}