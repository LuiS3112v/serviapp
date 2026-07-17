import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../database/entities/service.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { ServiceLocationSnapshot } from './dto/service-location.dto';

const ACTIVE_STATES: ServiceStatus[] = [
  ServiceStatus.ACCEPTED,
  ServiceStatus.PAYMENT_HELD,
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.PROVIDER_COMPLETED,
];

@Injectable()
export class ActiveServiceLocationService {
  private readonly snapshots = new Map<string, ServiceLocationSnapshot>();

  constructor(
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
  ) {}

  // Usado pelo map/page.tsx do cliente para descobrir, sem receber
  // nenhum serviceId explícito, se existe algum serviço em curso que
  // deva fazer o mapa mudar automaticamente para o Modo Serviço Ativo.
  // Devolve o serviço mais recente entre os estados ativos, ou null.
  async findActiveServiceForClient(clientId: string): Promise<Service | null> {
    const service = await this.serviceRepo.findOne({
      where: [
        { clientId, status: ServiceStatus.ACCEPTED },
        { clientId, status: ServiceStatus.PAYMENT_HELD },
        { clientId, status: ServiceStatus.IN_PROGRESS },
        { clientId, status: ServiceStatus.PROVIDER_COMPLETED },
      ],
      order: { updatedAt: 'DESC' },
      relations: { provider: true },
    });

    return service;
  }

  async assertParticipant(serviceId: string, userId: string, userRole: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    const isParticipant =
      service.clientId === userId ||
      service.providerId === userId ||
      userRole === 'admin';

    if (!isParticipant) {
      throw new ForbiddenException('Sem permissão para aceder à localização deste serviço.');
    }

    return service;
  }

  isServiceStateAllowed(service: Service): boolean {
    return ACTIVE_STATES.includes(service.status as ServiceStatus);
  }

  async recordPosition(
    serviceId: string,
    providerId: string,
    latitude: number,
    longitude: number,
  ): Promise<ServiceLocationSnapshot> {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    if (service.providerId !== providerId) {
      throw new ForbiddenException('Só o prestador responsável pode atualizar esta posição.');
    }

    if (!this.isServiceStateAllowed(service)) {
      throw new ForbiddenException('Este serviço já não permite partilha de localização.');
    }

    const snapshot: ServiceLocationSnapshot = {
      serviceId,
      providerId,
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
    };

    this.snapshots.set(serviceId, snapshot);
    return snapshot;
  }

  getSnapshot(serviceId: string): ServiceLocationSnapshot | null {
    return this.snapshots.get(serviceId) ?? null;
  }

  clearSnapshot(serviceId: string): void {
    this.snapshots.delete(serviceId);
  }
}