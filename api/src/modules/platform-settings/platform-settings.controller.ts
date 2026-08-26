import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UpdateCommissionDto } from './dto/update-commission.dto';

@Controller('admin/settings')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PlatformSettingsController {
  constructor(private readonly settingsService: PlatformSettingsService) {}

  @Get('commission')
  getCommission() {
    return this.settingsService.getSettings();
  }

  // SECURITY FIX: substituido @Body('commissionPercentage') solto por
  // DTO formal com @IsNumber, @Min(0), @Max(100). O ValidationPipe
  // global rejeita agora strings, NaN e valores fora do intervalo com
  // 400 Bad Request antes de qualquer logica de servico correr.
  @Patch('commission')
  updateCommission(@Body() dto: UpdateCommissionDto) {
    return this.settingsService.updateCommissionPercentage(dto.commissionPercentage);
  }
}