import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { GeoDistributionService } from './geo-distribution.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    NotificationsModule,
    ChatModule,
  ],
  providers: [GeoDistributionService],
  exports: [GeoDistributionService],
})
export class GeoDistributionModule {}