import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat/chat.gateway';

const SEARCH_RADII_KM = [3, 8, 20, 50];
const MAX_RECIPIENTS = 10;
const LOCATION_FRESHNESS_MINUTES = 15;

const CATEGORY_ALIASES: Record<string, string[]> = {
  'Limpeza':      ['Limpeza', 'Limpador', 'Limpadores', 'Serviço de Limpeza'],
  'Climatização': ['Climatização', 'Climatizacao', 'Ar Condicionado', 'AVAC', 'Climatizador'],
  'Canalização':  ['Canalização', 'Canalizacao', 'Canalizador', 'Canalizadores', 'Explomagem', 'Encanador'],
  'Eletricidade': ['Eletricidade', 'Electricidade', 'Eletricista', 'Electricista', 'Eletricistas', 'Electricistas'],
  'TI & Redes':   ['TI & Redes', 'TI e Redes', 'TI', 'Redes', 'Informática', 'Informatica', 'Técnico TI', 'Suporte TI'],
  'Jardinagem':   ['Jardinagem', 'Jardineiro', 'Jardineiros'],
  'Mudanças':     ['Mudanças', 'Mudancas', 'Transportes', 'Transporte'],
  'Beleza':       ['Beleza', 'Cabeleireiro', 'Cabeleireira', 'Manicure', 'Estética', 'Estetica'],
  'Automóvel':    ['Automóvel', 'Automovel', 'Mecânica', 'Mecanica', 'Mecânico', 'Mecanico', 'Auto'],
  'Pintura':      ['Pintura', 'Pintor', 'Pintores'],
  'Construção':   ['Construção', 'Construcao', 'Construtor', 'Construtores', 'Obras', 'Remodelação'],
  'Segurança':    ['Segurança', 'Seguranca', 'Vigilância', 'Vigilancia', 'Segurança Privada'],
};

function resolveCategoryAliases(category: string): string[] {
  if (!category) return [];
  return CATEGORY_ALIASES[category] ?? [category];
}

function haversineKm(
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

export interface DistributionContext {
  originLatitude: number | null;
  originLongitude: number | null;
  category: string;
  serviceId: string;
  serviceTitle: string;
  serviceType: 'normal' | 'quick';
}

export interface DistributionResult {
  recipientIds: string[];
  radiusUsedKm: number | null;
  totalCandidatesFound: number;
}

@Injectable()
export class GeoDistributionService {
  private readonly logger = new Logger(GeoDistributionService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
    private chatGateway: ChatGateway,
  ) {}

  async distribute(ctx: DistributionContext): Promise<DistributionResult> {
    this.logger.log(
      `[GEO-DISTRIBUTION] start | serviceId=${ctx.serviceId} | type=${ctx.serviceType} | ` +
      `category=${ctx.category} | origin=${ctx.originLatitude},${ctx.originLongitude}`,
    );

    if (ctx.originLatitude == null || ctx.originLongitude == null) {
      return this.distributeWithoutLocation(ctx);
    }
    return this.distributeWithLocation(ctx);
  }

  private async distributeWithLocation(ctx: DistributionContext): Promise<DistributionResult> {
    const { originLatitude, originLongitude, category, serviceId, serviceTitle, serviceType } = ctx;

    const candidates = await this.fetchEligibleProviders(category);

    if (candidates.length === 0) {
      this.logger.log(`[GEO-DISTRIBUTION] no eligible providers | serviceId=${serviceId}`);
      return { recipientIds: [], radiusUsedKm: null, totalCandidatesFound: 0 };
    }

    const withDistance = candidates
      .map(u => ({
        id: u.id,
        distanceKm: haversineKm(
          originLatitude!, originLongitude!,
          Number(u.latitude), Number(u.longitude),
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    let selected: typeof withDistance = [];
    let radiusUsed: number | null = null;

    for (const radiusKm of SEARCH_RADII_KM) {
      const inRadius = withDistance.filter(p => p.distanceKm <= radiusKm);
      if (inRadius.length > 0) {
        selected = inRadius.slice(0, MAX_RECIPIENTS);
        radiusUsed = radiusKm;
        this.logger.log(
          `[GEO-DISTRIBUTION] found ${inRadius.length} within ${radiusKm}km | ` +
          `selecting ${selected.length} | serviceId=${serviceId}`,
        );
        break;
      }
      this.logger.log(
        `[GEO-DISTRIBUTION] 0 within ${radiusKm}km, expanding | serviceId=${serviceId}`,
      );
    }

    if (selected.length === 0) {
      this.logger.log(`[GEO-DISTRIBUTION] no providers in any radius | serviceId=${serviceId}`);
      return { recipientIds: [], radiusUsedKm: null, totalCandidatesFound: candidates.length };
    }

    await this.notifyRecipients(selected, serviceId, serviceTitle, serviceType);

    return {
      recipientIds: selected.map(p => p.id),
      radiusUsedKm: radiusUsed,
      totalCandidatesFound: candidates.length,
    };
  }

  private async distributeWithoutLocation(ctx: DistributionContext): Promise<DistributionResult> {
    const { category, serviceId, serviceTitle, serviceType } = ctx;

    this.logger.log(
      `[GEO-DISTRIBUTION] no origin GPS — fallback distribution | serviceId=${serviceId}`,
    );

    const candidates = await this.fetchEligibleProviders(category);

    const selected = candidates
      .sort((a, b) => {
        const tA = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
        const tB = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
        return tB - tA;
      })
      .slice(0, MAX_RECIPIENTS)
      .map(u => ({ id: u.id, distanceKm: null as unknown as number }));

    if (selected.length === 0) {
      this.logger.log(`[GEO-DISTRIBUTION] no eligible providers (fallback) | serviceId=${serviceId}`);
      return { recipientIds: [], radiusUsedKm: null, totalCandidatesFound: 0 };
    }

    await this.notifyRecipients(selected, serviceId, serviceTitle, serviceType);

    return {
      recipientIds: selected.map(p => p.id),
      radiusUsedKm: null,
      totalCandidatesFound: selected.length,
    };
  }

  private async fetchEligibleProviders(category: string): Promise<User[]> {
    const freshnessThreshold = new Date(Date.now() - LOCATION_FRESHNESS_MINUTES * 60 * 1000);

    const qb = this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.latitude', 'user.longitude', 'user.lastSeenAt'])
      .where('user.role IN (:...roles)', { roles: [Role.PROVIDER, Role.COMPANY] })
      .andWhere('user.isVerified = :verified',            { verified: true })
      .andWhere('user.profileVisible = :visible',         { visible: true })
      .andWhere('user.isOnline = :online',                { online: true })
      .andWhere('user.locationSharingEnabled = :sharing', { sharing: true })
      .andWhere('user.latitude IS NOT NULL')
      .andWhere('user.longitude IS NOT NULL')
      .andWhere('user.lastSeenAt > :threshold',           { threshold: freshnessThreshold });

    if (category) {
      const aliases = resolveCategoryAliases(category);
      if (aliases.length > 0) {
        qb.andWhere('user.category IN (:...aliases)', { aliases });
      }
    }

    return qb.getMany();
  }

  private async notifyRecipients(
    recipients: Array<{ id: string; distanceKm: number | null }>,
    serviceId: string,
    serviceTitle: string,
    serviceType: 'normal' | 'quick',
  ): Promise<void> {
    const socketPayload = { serviceId, serviceTitle, serviceType };

    await Promise.allSettled(
      recipients.map(async ({ id: providerId, distanceKm }) => {
        try {
          this.chatGateway.emitToUser(providerId, 'new_service_request', socketPayload);
        } catch (e) {
          this.logger.warn(
            `[GEO-DISTRIBUTION] socket emit failed provider=${providerId}: ${(e as Error).message}`,
          );
        }

        const distLabel = distanceKm != null ? ` (${distanceKm.toFixed(1)} km de si)` : '';
        try {
          await this.notificationsService.notifyServiceRequested(
            providerId,
            'Cliente',
            `${serviceTitle}${distLabel}`,
          );
        } catch (e) {
          this.logger.warn(
            `[GEO-DISTRIBUTION] push failed provider=${providerId}: ${(e as Error).message}`,
          );
        }
      }),
    );
  }
}