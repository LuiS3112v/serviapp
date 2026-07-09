import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('admin/settings')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get('commission')
  getCommission() {
    return this.settingsService.getSettings();
  }

  @Patch('commission')
  updateCommission(@Body('commissionPercentage') percentage: number) {
    return this.settingsService.updateCommissionPercentage(Number(percentage));
  }
}