import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettingsController } from './platform-settings.controller';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformSettings } from '../../database/entities/platform-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformSettings])],
  controllers: [PlatformSettingsController],
  providers: [PlatformSettingsService],
  exports: [PlatformSettingsService],
})
export class PlatformSettingsModule {}