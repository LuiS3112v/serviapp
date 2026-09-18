import { Module, forwardRef } from '@nestjs/common';
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
    // forwardRef resolve a dependência circular potencial entre
    // NotificationsModule e ChatModule — ambos são importados pelo
    // AppModule, e o ChatModule exporta ChatGateway que é injectado
    // aqui no NotificationsService.
    forwardRef(() => ChatModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}