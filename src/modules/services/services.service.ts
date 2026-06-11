import {
  Injectable, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../database/entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AcceptServiceDto } from './dto/accept-service.dto';
import { CancelServiceDto } from './dto/cancel-service.dto';
import { ReviewServiceDto } from './dto/review-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { ProposePriceDto } from './dto/propose-price.dto';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '../../common/enums/role.enum';

export interface ProviderStats {
  totalOrders: number;
  totalCompleted: number;
  totalEarnings: number;
  averageRating: number | null;
  activeOrders: number;
}

export interface ProviderStatsByPeriod {
  totalCompleted: number;
  totalEarnings: number;
  averageRating: number | null;
  avgResponseTimeHours: number | null;
  rankingScore: number;
  earningsByPeriod: { label: string; value: number }[];
  completedByPeriod: { label: string; value: number }[];
}

export interface ClientStats {
  totalCreated: number;
  totalSpent: number;
  totalCompleted: number;
  totalCancelled: number;
  averageRating: number | null;
}

export interface ProviderReviewItem {
  id: string;
  title: string;
  clientName: string;
  rating: number;
  review: string | null;
  completedAt: Date;
}

export interface ProviderReviewsData {
  reviews: ProviderReviewItem[];
  stats: {
    total: number;
    average: number | null;
    distribution: Record<string, number>;
  };
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private notificationsService: NotificationsService,
  ) {}

  // ─── Provider: stats simples ──────────────────────────────────────────────
  async getProviderStats(providerId: string): Promise<ProviderStats> {
    const totalOrders = await this.serviceRepo.count({ where: { providerId } });

    const totalCompleted = await this.serviceRepo.count({
      where: { providerId, status: ServiceStatus.COMPLETED },
    });

    const earningsResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select('SUM(s.agreedPrice)', 'total')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .getRawOne();
    const totalEarnings = Number(earningsResult?.total ?? 0);

    const ratingResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select('AVG(s.clientRating)', 'avg')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.clientRating IS NOT NULL')
      .getRawOne();
    const averageRating = ratingResult?.avg
      ? Number(Number(ratingResult.avg).toFixed(1))
      : null;

    const activeOrders = await this.serviceRepo
      .createQueryBuilder('s')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status IN (:...statuses)', {
        statuses: [ServiceStatus.ACCEPTED, ServiceStatus.IN_PROGRESS],
      })
      .getCount();

    return { totalOrders, totalCompleted, totalEarnings, averageRating, activeOrders };
  }

  // ─── Provider: stats por período ─────────────────────────────────────────
  async getProviderStatsByPeriod(
    providerId: string,
    period: string,
  ): Promise<ProviderStatsByPeriod> {
    const { from, to } = this.getPeriodDates(period);

    const totalCompleted = await this.serviceRepo
      .createQueryBuilder('s')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .andWhere('s.completedAt BETWEEN :from AND :to', { from, to })
      .getCount();

    const earningsResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select('SUM(s.agreedPrice)', 'total')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .andWhere('s.completedAt BETWEEN :from AND :to', { from, to })
      .getRawOne();
    const totalEarnings = Number(earningsResult?.total ?? 0);

    const ratingResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select('AVG(s.clientRating)', 'avg')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.clientRating IS NOT NULL')
      .getRawOne();
    const averageRating = ratingResult?.avg
      ? Number(Number(ratingResult.avg).toFixed(1))
      : null;

    const responseResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select(
        `AVG(EXTRACT(EPOCH FROM (s."acceptedAt" - s."createdAt")) / 3600)`,
        'avgHours',
      )
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s."acceptedAt" IS NOT NULL')
      .andWhere('s."createdAt" BETWEEN :from AND :to', { from, to })
      .getRawOne();
    const avgResponseTimeHours = responseResult?.avgHours
      ? Number(Number(responseResult.avgHours).toFixed(1))
      : null;

    const allCompleted = await this.serviceRepo.count({
      where: { providerId, status: ServiceStatus.COMPLETED },
    });
    const ratingScore = averageRating ? (averageRating / 5) * 40 : 0;
    const volumeScore = Math.min(allCompleted / 50, 1) * 30;
    const speedScore = avgResponseTimeHours !== null
      ? Math.max(0, (1 - avgResponseTimeHours / 24) * 20)
      : 0;
    const rankingScore = Math.round(ratingScore + volumeScore + speedScore + 10);

    const earningsByPeriod = await this.buildEarningsChart(providerId, period, from, to);
    const completedByPeriod = await this.buildCompletedChart(providerId, period, from, to);

    return { totalCompleted, totalEarnings, averageRating, avgResponseTimeHours, rankingScore, earningsByPeriod, completedByPeriod };
  }

  // ─── Client: stats ───────────────────────────────────────────────────────
  async getClientStats(clientId: string): Promise<ClientStats> {
    const totalCreated = await this.serviceRepo.count({ where: { clientId } });
    const totalCompleted = await this.serviceRepo.count({ where: { clientId, status: ServiceStatus.COMPLETED } });
    const totalCancelled = await this.serviceRepo.count({ where: { clientId, status: ServiceStatus.CANCELLED } });

    const spentResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select('SUM(s.agreedPrice)', 'total')
      .where('s.clientId = :clientId', { clientId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .getRawOne();
    const totalSpent = Number(spentResult?.total ?? 0);

    const ratingResult = await this.serviceRepo
      .createQueryBuilder('s')
      .select('AVG(s.clientRating)', 'avg')
      .where('s.clientId = :clientId', { clientId })
      .andWhere('s.clientRating IS NOT NULL')
      .getRawOne();
    const averageRating = ratingResult?.avg
      ? Number(Number(ratingResult.avg).toFixed(1))
      : null;

    return { totalCreated, totalSpent, totalCompleted, totalCancelled, averageRating };
  }

  // ─── Provider: avaliações ─────────────────────────────────────────────────
  async getProviderReviews(providerId: string): Promise<ProviderReviewsData> {
    const services = await this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.client', 'client')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .andWhere('s.clientRating IS NOT NULL')
      .orderBy('s.completedAt', 'DESC')
      .getMany();

    const distribution: Record<string, number> = { '5':0,'4':0,'3':0,'2':0,'1':0 };
    let sum = 0;
    for (const s of services) {
      const key = String(Math.round(Number(s.clientRating)));
      if (distribution[key] !== undefined) distribution[key]++;
      sum += Number(s.clientRating);
    }

    return {
      reviews: services.map(s => ({
        id: s.id,
        title: s.title,
        clientName: s.client?.fullName ?? 'Cliente',
        rating: Number(s.clientRating),
        review: s.clientReview,
        completedAt: s.completedAt,
      })),
      stats: {
        total: services.length,
        average: services.length > 0 ? Number((sum / services.length).toFixed(1)) : null,
        distribution,
      },
    };
  }

  // ─── Client: criar pedido ────────────────────────────────────────────────
  async create(clientId: string, dto: CreateServiceDto, clientName?: string): Promise<Service> {
    const service = this.serviceRepo.create({
      ...dto,
      budget:          Number(dto.budget),
      scheduledAt:     dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      clientId,
      targetProviderId: dto.targetProviderId ?? undefined,
      status:          ServiceStatus.PENDING,
    });
    const saved = await this.serviceRepo.save(service);

    // Notifica o provider quando o serviço é dirigido especificamente a ele
    if (dto.targetProviderId) {
      this.notificationsService
        .notifyServiceRequested(
          dto.targetProviderId,
          clientName ?? 'Um cliente',
          dto.title,
        )
        .catch(() => {}); // não-bloqueante — se falhar, o serviço já foi criado
    }

    return saved;
  }

  async findByClient(clientId: string, filter: FilterServicesDto): Promise<Service[]> {
    const query = this.serviceRepo.createQueryBuilder('service')
      .leftJoinAndSelect('service.provider', 'provider')
      .leftJoinAndSelect('service.proposedByProvider', 'proposedByProvider')
      .where('service.clientId = :clientId', { clientId });
    if (filter.status) query.andWhere('service.status = :status', { status: filter.status });
    if (filter.category) query.andWhere('service.category = :category', { category: filter.category });
    return query.orderBy('service.createdAt', 'DESC').getMany();
  }

  async findAvailable(providerId: string, filter: FilterServicesDto): Promise<Service[]> {
    const query = this.serviceRepo.createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('service.proposedByProvider', 'proposedByProvider')
      .where('service.status = :status', { status: ServiceStatus.PENDING })
      .andWhere('service.providerId IS NULL')
      .andWhere(
        '(service.targetProviderId IS NULL OR service.targetProviderId = :providerId)',
        { providerId },
      );
    if (filter.category) query.andWhere('service.category = :category', { category: filter.category });
    if (filter.province) query.andWhere('service.province = :province', { province: filter.province });
    if ((filter as any).minBudget) query.andWhere('service.budget >= :min', { min: (filter as any).minBudget });
    if ((filter as any).maxBudget) query.andWhere('service.budget <= :max', { max: (filter as any).maxBudget });
    return query.orderBy('service.createdAt', 'DESC').getMany();
  }

  async findByProvider(providerId: string, filter: FilterServicesDto): Promise<Service[]> {
    const query = this.serviceRepo.createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .where('service.providerId = :providerId', { providerId });
    if (filter.status) query.andWhere('service.status = :status', { status: filter.status });
    return query.orderBy('service.createdAt', 'DESC').getMany();
  }

  async findMyProposals(providerId: string): Promise<Service[]> {
    return this.serviceRepo.createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .where('service.proposedByProviderId = :providerId', { providerId })
      .andWhere('service.status = :status', { status: ServiceStatus.PENDING })
      .orderBy('service.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId: string, userRole?: Role): Promise<Service> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) throw new NotFoundException('Recurso não encontrado.');

    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: { client: true, provider: true, proposedByProvider: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (userRole === Role.ADMIN) return service;
    if (userRole === Role.PROVIDER || userRole === Role.COMPANY) {
      const ok = service.providerId === userId ||
        (service.status === ServiceStatus.PENDING && !service.providerId) ||
        service.proposedByProviderId === userId ||
        service.targetProviderId === userId;
      if (!ok) throw new ForbiddenException('Sem permissão.');
      return service;
    }
    if (userRole === Role.CLIENT) {
      if (service.clientId !== userId) throw new ForbiddenException('Sem permissão.');
      return service;
    }
    const isParticipant = service.clientId === userId || service.providerId === userId;
    if (!isParticipant) throw new ForbiddenException('Sem permissão.');
    return service;
  }

  async update(id: string, clientId: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, clientId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.PENDING)
      throw new BadRequestException('Só podes editar serviços pendentes.');
    Object.assign(service, {
      ...dto,
      budget: dto.budget ? Number(dto.budget) : service.budget,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : service.scheduledAt,
    });
    return this.serviceRepo.save(service);
  }

  async accept(id: string, providerId: string, dto: AcceptServiceDto): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.PENDING)
      throw new BadRequestException('Este serviço já não está disponível.');
    if (service.providerId)
      throw new BadRequestException('Este serviço já foi aceite por outro prestador.');
    service.providerId = providerId;
    service.agreedPrice = Number(dto.agreedPrice);
    service.status = ServiceStatus.ACCEPTED;
    service.acceptedAt = new Date();
    service.proposedPrice = null;
    service.proposedByProviderId = null;
    const saved = await this.serviceRepo.save(service);
    await this.notificationsService.notifyServiceAccepted(service.clientId, providerId);
    return saved;
  }

  async proposePrice(id: string, providerId: string, dto: ProposePriceDto): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.PENDING)
      throw new BadRequestException('Só é possível propor preço em pedidos pendentes.');
    if (service.providerId) throw new BadRequestException('Este serviço já foi aceite.');
    if (service.proposedByProviderId && service.proposedByProviderId !== providerId)
      throw new BadRequestException('Este pedido já tem uma proposta de outro prestador.');
    service.proposedPrice = Number(dto.proposedPrice);
    service.proposedByProviderId = providerId;
    const saved = await this.serviceRepo.save(service);
    await this.notificationsService.notifyServiceProposed(
      service.clientId, 'Um prestador', Number(dto.proposedPrice),
    );
    return saved;
  }

  async acceptProposal(id: string, clientId: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, clientId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (!service.proposedByProviderId || !service.proposedPrice)
      throw new BadRequestException('Não existe nenhuma proposta pendente.');
    const agreedPrice = Number(service.proposedPrice);
    const providerId = service.proposedByProviderId;
    service.providerId = providerId;
    service.agreedPrice = agreedPrice;
    service.status = ServiceStatus.ACCEPTED;
    service.acceptedAt = new Date();
    service.proposedPrice = null;
    service.proposedByProviderId = null;
    const saved = await this.serviceRepo.save(service);
    await this.notificationsService.notifyProposalAccepted(providerId, agreedPrice);
    return saved;
  }

  async rejectProposal(id: string, clientId: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, clientId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (!service.proposedByProviderId) throw new BadRequestException('Não existe nenhuma proposta pendente.');
    const providerId = service.proposedByProviderId;
    service.proposedPrice = null;
    service.proposedByProviderId = null;
    const saved = await this.serviceRepo.save(service);
    await this.notificationsService.notifyProposalRejected(providerId);
    return saved;
  }

  async start(id: string, providerId: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, providerId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.ACCEPTED && service.status !== ServiceStatus.PAID)
      throw new BadRequestException('O serviço tem de estar aceite para ser iniciado.');
    service.status = ServiceStatus.IN_PROGRESS;
    service.startedAt = new Date();
    const saved = await this.serviceRepo.save(service);
    await this.notificationsService.notifyServiceStarted(service.clientId, providerId);
    return saved;
  }

  async complete(id: string, providerId: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, providerId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.IN_PROGRESS)
      throw new BadRequestException('O serviço tem de estar em execução para ser concluído.');
    service.status = ServiceStatus.COMPLETED;
    service.completedAt = new Date();
    const saved = await this.serviceRepo.save(service);
    await this.notificationsService.notifyServiceCompleted(service.clientId, providerId);
    return saved;
  }

  async confirm(id: string, clientId: string, dto: ReviewServiceDto): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id, clientId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.COMPLETED)
      throw new BadRequestException('O serviço tem de estar concluído para confirmar.');
    if (service.clientConfirmedAt)
      throw new BadRequestException('Já confirmaste este serviço.');
    service.clientConfirmedAt = new Date();
    service.clientRating = dto.rating;
    service.clientReview = dto.review ?? null;
    return this.serviceRepo.save(service);
  }

  async cancel(id: string, userId: string, dto: CancelServiceDto): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    const isOwner = service.clientId === userId || service.providerId === userId;
    if (!isOwner) throw new ForbiddenException('Sem permissão para cancelar este serviço.');
    const cancellable = [ServiceStatus.PENDING, ServiceStatus.ACCEPTED];
    if (!cancellable.includes(service.status))
      throw new BadRequestException('Não é possível cancelar um serviço neste estado.');
    service.status = ServiceStatus.CANCELLED;
    service.cancelledAt = new Date();
    service.cancellationReason = dto.reason;
    service.proposedPrice = null;
    service.proposedByProviderId = null;
    return this.serviceRepo.save(service);
  }

  async findAll(filter: FilterServicesDto): Promise<Service[]> {
    const query = this.serviceRepo.createQueryBuilder('service')
      .leftJoinAndSelect('service.client', 'client')
      .leftJoinAndSelect('service.provider', 'provider');
    if (filter.status) query.andWhere('service.status = :status', { status: filter.status });
    if (filter.category) query.andWhere('service.category = :category', { category: filter.category });
    return query.orderBy('service.createdAt', 'DESC').getMany();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private getPeriodDates(period: string): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date(now);
    let from: Date;
    switch (period) {
      case 'Esta semana': from = new Date(now); from.setDate(now.getDate() - 7); break;
      case 'Este mês': from = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'Este ano': from = new Date(now.getFullYear(), 0, 1); break;
      default: from = new Date('2020-01-01'); break;
    }
    return { from, to };
  }

  private async buildEarningsChart(providerId: string, period: string, from: Date, to: Date) {
    const services = await this.serviceRepo.createQueryBuilder('s')
      .select(['s.completedAt','s.agreedPrice'])
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .andWhere('s.completedAt BETWEEN :from AND :to', { from, to })
      .getMany();
    const buckets = this.buildBuckets(period, from, to);
    for (const s of services) {
      const label = this.getBucketLabel(new Date(s.completedAt), period);
      const b = buckets.find(b => b.label === label);
      if (b) b.value += Number(s.agreedPrice ?? 0);
    }
    return buckets;
  }

  private async buildCompletedChart(providerId: string, period: string, from: Date, to: Date) {
    const services = await this.serviceRepo.createQueryBuilder('s')
      .select('s.completedAt')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.status = :status', { status: ServiceStatus.COMPLETED })
      .andWhere('s.completedAt BETWEEN :from AND :to', { from, to })
      .getMany();
    const buckets = this.buildBuckets(period, from, to);
    for (const s of services) {
      const label = this.getBucketLabel(new Date(s.completedAt), period);
      const b = buckets.find(b => b.label === label);
      if (b) b.value += 1;
    }
    return buckets;
  }

  private buildBuckets(period: string, from: Date, to: Date): { label: string; value: number }[] {
    const buckets: { label: string; value: number }[] = [];
    const cursor = new Date(from);
    if (period === 'Esta semana') {
      const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      while (cursor <= to) { buckets.push({ label: days[cursor.getDay()], value: 0 }); cursor.setDate(cursor.getDate() + 1); }
    } else if (period === 'Este mês') {
      while (cursor <= to) { buckets.push({ label: `${cursor.getDate()}`, value: 0 }); cursor.setDate(cursor.getDate() + 1); }
    } else if (period === 'Este ano') {
      const m = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      for (let i = 0; i < 12; i++) buckets.push({ label: m[i], value: 0 });
    } else {
      for (let y = from.getFullYear(); y <= to.getFullYear(); y++) buckets.push({ label: `${y}`, value: 0 });
    }
    return buckets;
  }

  private getBucketLabel(date: Date, period: string): string {
    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    if (period === 'Esta semana') return days[date.getDay()];
    if (period === 'Este mês') return `${date.getDate()}`;
    if (period === 'Este ano') return months[date.getMonth()];
    return `${date.getFullYear()}`;
  }
}