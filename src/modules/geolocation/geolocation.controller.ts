// src/modules/geolocation/geolocation.controller.ts
// REPLACE entire file

import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsNumber, IsBoolean, IsOptional, IsString,
  IsIn, Min, Max,
} from 'class-validator';
import { GeolocationService } from './geolocation.service';
import {
  UpdateLocationPayload,
  NearbyQueryPayload,
  ProviderLocation,
  ProviderWithDistance,
} from './geolocation.types';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

export class UpdateLocationDto implements UpdateLocationPayload {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}

export class NearbyQueryDto implements NearbyQueryPayload {
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(200)
  radiusKm?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(['online', 'offline', 'all'])
  status?: 'online' | 'offline' | 'all';
}

@Controller('geolocation')
@UseGuards(JwtGuard, RolesGuard)
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @Patch('location')
  @Roles(Role.PROVIDER, Role.COMPANY)
  async updateLocation(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateLocationDto,
  ): Promise<ProviderLocation> {
    return this.geolocationService.updateLocation(user.id, dto);
  }

  @Get('providers/nearby')
  @Roles(Role.CLIENT, Role.PROVIDER, Role.COMPANY, Role.ADMIN)
  async getNearbyProviders(
    @Query() dto: NearbyQueryDto,
  ): Promise<ProviderWithDistance[]> {
    return this.geolocationService.findNearbyProviders(dto);
  }

  @Get('providers/online')
  @Roles(Role.CLIENT, Role.PROVIDER, Role.COMPANY, Role.ADMIN)
  async getOnlineProviders(
    @Query('category') category?: string,
  ): Promise<ProviderLocation[]> {
    return this.geolocationService.findOnlineProviders(category);
  }
}