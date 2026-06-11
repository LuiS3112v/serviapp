import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FirebaseService } from './firebase.service';
import { Notification } from '../../database/entities/notification.entity';
import { DeviceToken } from '../../database/entities/device-token.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification, DeviceToken])],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}