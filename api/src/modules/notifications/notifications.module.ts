import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../database/entities/notification.entity';
import { DeviceToken } from '../../database/entities/device-token.entity';
import { User } from '../../database/entities/user.entity';
import { FirebaseService } from './firebase.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DeviceToken, User]),
    // ChatModule exporta RealtimeService — usado pelo NotificationsService
    // para emitir eventos socket sem dependência directa no ChatGateway.
    // Sem forwardRef: ChatModule é instanciado antes (ver app.module.ts)
    // e não importa NotificationsModule — não há circular real.
    ChatModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}