import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import {
  UpdateLocationPayload,
  UpdateSharingPayload,
  NearbyQueryPayload,
  ProviderLocation,
  ProviderWithDistance,
} from './geolocation.types';

@Injectable()
export class GeolocationService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  private haversineKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toProviderLocation(user: User): ProviderLocation {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? null,
      category: user.category ?? null,
      district: user.district ?? null,
      avatarUrl: user.avatarUrl ?? null,
      bio: user.bio ?? null,
      latitude: user.latitude != null ? Number(user.latitude) : null,
      longitude: user.longitude != null ? Number(user.longitude) : null,
      isOnline: user.isOnline,
      locationSharingEnabled: user.locationSharingEnabled,
      locationEnabled:
        user.latitude != null &&
        user.longitude != null &&
        user.locationSharingEnabled,
      isVerified: user.isVerified,
      lastSeenAt: user.lastSeenAt ?? null,
    };
  }

  async updateLocation(
    userId: string,
    payload: UpdateLocationPayload,
  ): Promise<ProviderLocation> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (!user.locationSharingEnabled) {
      throw new ForbiddenException(
        'A partilha de localização está desativada. Ativa-a no teu perfil primeiro.',
      );
    }

    user.latitude = payload.latitude;
    user.longitude = payload.longitude;

    if (typeof payload.isOnline === 'boolean') {
      user.isOnline = payload.isOnline;
    }

    user.lastSeenAt = new Date();
    const saved = await this.userRepo.save(user);
    return this.toProviderLocation(saved);
  }

  async updateSharingStatus(
    userId: string,
    payload: UpdateSharingPayload,
  ): Promise<ProviderLocation> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    user.locationSharingEnabled = payload.enabled;

    if (!payload.enabled) {
      user.isOnline = false;
    }

    const saved = await this.userRepo.save(user);
    return this.toProviderLocation(saved);
  }

  async findNearbyProviders(
    payload: NearbyQueryPayload,
  ): Promise<ProviderWithDistance[]> {
    const { latitude, longitude, radiusKm = 50, category, status, availableOnly } = payload;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [Role.PROVIDER, Role.COMPANY],
      })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.profileVisible = :visible', { visible: true })
      .andWhere('user.locationSharingEnabled = :sharing', { sharing: true })
      .andWhere('user.latitude IS NOT NULL')
      .andWhere('user.longitude IS NOT NULL');

    if (category && category !== 'Todos') {
      qb.andWhere('user.category = :category', { category });
    }

    if (status === 'online') {
      qb.andWhere('user.isOnline = :online', { online: true });
    } else if (status === 'offline') {
      qb.andWhere('user.isOnline = :online', { online: false });
    }

    if (availableOnly) {
      qb.andWhere('user.isOnline = :available', { available: true });
    }

    const users = await qb.getMany();

    const withDistance: ProviderWithDistance[] = users
      .map((u) => {
        const distanceKm = this.haversineKm(
          latitude, longitude,
          Number(u.latitude), Number(u.longitude),
        );
        return {
          ...this.toProviderLocation(u),
          distanceKm: Math.round(distanceKm * 10) / 10,
          etaMinutes: Math.round((distanceKm / 30) * 60),
        };
      })
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance;
  }

  async findOnlineProviders(category?: string): Promise<ProviderLocation[]> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [Role.PROVIDER, Role.COMPANY],
      })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.profileVisible = :visible', { visible: true })
      .andWhere('user.locationSharingEnabled = :sharing', { sharing: true })
      .andWhere('user.isOnline = :online', { online: true })
      .andWhere('user.latitude IS NOT NULL')
      .andWhere('user.longitude IS NOT NULL');

    if (category && category !== 'Todos') {
      qb.andWhere('user.category = :category', { category });
    }

    const users = await qb.orderBy('user.lastSeenAt', 'DESC').getMany();
    return users.map(this.toProviderLocation.bind(this));
  }
}