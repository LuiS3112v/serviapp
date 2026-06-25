import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../../database/entities/notification.entity';
import { DeviceToken } from '../../database/entities/device-token.entity';
import { User } from '../../database/entities/user.entity';
import { FirebaseService } from './firebase.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, DeviceToken, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}