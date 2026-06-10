// src/modules/geolocation/geolocation.service.ts
// REPLACE entire file

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import {
  UpdateLocationPayload,
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

  // ─── Haversine formula ──────────────────────────────────────────────────
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
      locationEnabled: user.latitude != null && user.longitude != null && user.isOnline,
      isVerified: user.isVerified,
      lastSeenAt: user.lastSeenAt ?? null,
    };
  }

  // ─── Provider updates their own location ────────────────────────────────
  async updateLocation(
    userId: string,
    payload: UpdateLocationPayload,
  ): Promise<ProviderLocation> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    user.latitude = payload.latitude;
    user.longitude = payload.longitude;

    // If isOnline is explicitly sent, honour it; otherwise keep current value
    if (typeof payload.isOnline === 'boolean') {
      user.isOnline = payload.isOnline;
    }

    user.lastSeenAt = new Date();
    const saved = await this.userRepo.save(user);
    return this.toProviderLocation(saved);
  }

  // ─── Nearby providers (Haversine sort + filters) ─────────────────────────
  async findNearbyProviders(
    payload: NearbyQueryPayload,
  ): Promise<ProviderWithDistance[]> {
    const { latitude, longitude, radiusKm = 50, category, status } = payload;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [Role.PROVIDER, Role.COMPANY],
      })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.profileVisible = :visible', { visible: true })
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
          etaMinutes: Math.round((distanceKm / 30) * 60), // avg 30 km/h urban
        };
      })
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance;
  }

  // ─── Online providers (simple list, optional category) ──────────────────
  async findOnlineProviders(category?: string): Promise<ProviderLocation[]> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.role IN (:...roles)', {
        roles: [Role.PROVIDER, Role.COMPANY],
      })
      .andWhere('user.isVerified = :verified', { verified: true })
      .andWhere('user.profileVisible = :visible', { visible: true })
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