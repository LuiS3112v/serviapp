import { randomInt } from 'crypto';
import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Service } from '../../database/entities/service.entity';
import { ServiceTimeline } from '../../database/entities/service-timeline.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { WalletService } from '../wallet/wallet.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { Role } from '../../common/enums/role.enum';

// ── Campos seguros do User quando carregado em relações ──────────────────────
const SAFE_USER_RELATION = {
  id: true,
  fullName: true,
  avatarUrl: true,
  isVerified: true,
} as const;

// ── Select base para detalhe de um serviço ────────────────────────────────────
// NÃO inclui servicePin — é adicionado apenas para o clientId em
// findByIdForUser().
const SERVICE_DETAIL_SELECT_BASE = {
  id: true,
  title: true,
  description: true,
  category: true,
  address: true,
  province: true,
  budget: true,
  agreedPrice: true,
  proposedPrice: true,
  proposedByProviderId: true,
  status: true,
  clientId: true,
  providerId: true,
  targetProviderId: true,
  catalogItemId: true,
  warrantyDays: true,
  warrantyExpiresAt: true,
  cancelReason: true,
  disputeReason: true,
  clientRating: true,
  clientReview: true,
  scheduledAt: true,
  acceptedAt: true,
  paymentHeldAt: true,
  startedAt: true,
  providerCompletedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ── Select para listagens (my-jobs, my-requests) ──────────────────────────────
// Menos campos que o detalhe — não inclui servicePin, pinExpiresAt,
// pinUsed (desnecessários em cards de lista) nem os campos de detalhe
// de cancelamento/disputa que só são relevantes no ecrã de detalhe.
const SERVICE_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  address: true,
  province: true,
  budget: true,
  agreedPrice: true,
  proposedPrice: true,
  proposedByProviderId: true,
  status: true,
  clientId: true,
  providerId: true,
  targetProviderId: true,
  catalogItemId: true,
  warrantyDays: true,
  warrantyExpiresAt: true,
  cancelReason: true,
  clientRating: true,
  clientReview: true,
  scheduledAt: true,
  acceptedAt: true,
  startedAt: true,
  providerCompletedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  client: SAFE_USER_RELATION,
  provider: SAFE_USER_RELATION,
} as const;

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(ServiceTimeline)
    private timelineRepo: Repository<ServiceTimeline>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private walletService: WalletService,
    private bankAccountsService: BankAccountsService,
    private platformSettingsService: PlatformSettingsService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════
  // Criação do pedido.
  //
  // FIX: agora grava também catalogItemId quando o cliente solicitou a
  // partir da página de pesquisa (ver CreateServiceDto). Sem alterar
  // nenhum outro comportamento — se catalogItemId vier undefined
  // (fluxo antigo de pedido directo, sem catálogo), fica simplesmente
  // null e nada muda.
  // ══════════════════════════════════════════════════════════════════════

  async create(clientId: string, dto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepo.create({
      ...dto,
      clientId,
      status: ServiceStatus.REQUESTED,
    });
    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(saved.id, null, 'SERVICE_CREATED',
      `Cliente criou pedido: "${saved.title}"`,
      { budget: saved.budget, category: saved.category },
    );

    if (dto.targetProviderId) {
      await this.notificationsService.notifyServiceRequested(
        dto.targetProviderId, 'Cliente', saved.title,
      ).catch(() => {});
    }

    return saved;
  }

  // ── Listagem ──────────────────────────────────────────────────────────────

  async findByClient(clientId: string, status?: string): Promise<Service[]> {
    const where: any = { clientId };
    if (status) where.status = status;
    // SECURITY FIX: select explícito para excluir servicePin (o PIN é
    // um segredo gerado pelo cliente para mostrar presencialmente ao
    // prestador — expô-lo em listagens de cards é desnecessário e
    // viola o modelo de segurança do PIN). Também restringe os campos
    // da relação provider para não devolver dados sensíveis do User.
    return this.serviceRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { provider: true },
      select: SERVICE_LIST_SELECT,
    });
  }

  async findByProvider(providerId: string, status?: string): Promise<Service[]> {
    // SECURITY FIX: select explícito em ambos os ramos para excluir
    // servicePin. Sem este select, o TypeORM devolvia TODAS as colunas
    // da entidade Service — incluindo servicePin, que o prestador NÃO
    // deve conseguir ler via API (o PIN é gerado pelo cliente para ser
    // mostrado presencialmente; se o prestador o lê pela API, toda a
    // lógica de verificação de presença física é contornada).
    if (status) {
      return this.serviceRepo.find({
        where: { providerId, status: status as ServiceStatus },
        order: { createdAt: 'DESC' },
        relations: { client: true },
        select: SERVICE_LIST_SELECT,
      });
    }
    return this.serviceRepo.find({
      where: [
        { providerId },
        { targetProviderId: providerId, status: ServiceStatus.REQUESTED },
      ],
      order: { createdAt: 'DESC' },
      relations: { client: true },
      select: SERVICE_LIST_SELECT,
    });
  }

  async findAvailableForProvider(
    providerId: string,
    filter?: { category?: string; province?: string; minBudget?: number; maxBudget?: number },
  ): Promise<Service[]> {
    const qb = this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.client', 'client')
      .where('s.status = :status', { status: ServiceStatus.REQUESTED })
      .andWhere('s.providerId IS NULL')
      .andWhere('(s.targetProviderId IS NULL OR s.targetProviderId = :providerId)', { providerId });

    if (filter?.category) qb.andWhere('s.category = :category', { category: filter.category });
    if (filter?.province) qb.andWhere('s.province = :province', { province: filter.province });
    if (filter?.minBudget !== undefined) qb.andWhere('s.budget >= :minBudget', { minBudget: filter.minBudget });
    if (filter?.maxBudget !== undefined) qb.andWhere('s.budget <= :maxBudget', { maxBudget: filter.maxBudget });

    return qb.orderBy('s.createdAt', 'DESC').getMany();
  }

  async findMyProposals(providerId: string): Promise<Service[]> {
    return this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.client', 'client')
      .where('s.providerId = :providerId', { providerId })
      .andWhere('s.proposedPrice IS NOT NULL')
      .andWhere('s.status = :status', { status: ServiceStatus.REQUESTED })
      .orderBy('s.createdAt', 'DESC')
      .getMany();
  }

  // ── Selects internos ─────────────────────────────────────────────────────
  //
  // SERVICE_DETAIL_SELECT_BASE — campos comuns devolvidos a QUALQUER
  // participante autenticado de um serviço (cliente, prestador, ou
  // prestador a ver um pedido disponível). NÃO inclui servicePin.
  //
  // findByIdForUser() adiciona servicePin apenas quando userId ===
  // clientId — o único utilizador que deve ver o PIN é quem o gerou,
  // para o mostrar presencialmente ao prestador.
  //
  // SECURITY FIX (C-1): servicePin foi removido do select genérico.
  // Antes estava em: true para todos, o que permitia ao prestador lê-
  // lo via GET /services/:id e contornar o mecanismo de verificação de
  // presença física (o prestador podia iniciar o serviço sem que o
  // cliente estivesse presente, porque via API obtinha o PIN sem que o
  // cliente lho mostrasse).

  async findById(id: string): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: { client: true, provider: true },
      select: {
        ...SERVICE_DETAIL_SELECT_BASE,
        client: SAFE_USER_RELATION,
        provider: SAFE_USER_RELATION,
      },
    });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    return service;
  }

  async findByIdForUser(id: string, userId: string, userRole?: Role): Promise<Service> {
    const service = await this.findById(id);

    const isClient  = service.clientId  === userId;
    const isProvider = service.providerId === userId;

    if (isClient) {
      // O cliente vê o servicePin — é ele quem o mostra presencialmente
      // ao prestador. Buscamos o serviço de novo com select que inclui
      // o PIN, em vez de o ter sempre no select base (que iria expô-lo
      // ao prestador nos outros ramos abaixo).
      const withPin = await this.serviceRepo.findOne({
        where: { id },
        relations: { client: true, provider: true },
        select: {
          ...SERVICE_DETAIL_SELECT_BASE,
          servicePin: true,
          pinExpiresAt: true,
          pinUsed: true,
          client: SAFE_USER_RELATION,
          provider: SAFE_USER_RELATION,
        },
      });
      return withPin!;
    }

    if (isProvider) return service;

    const isProviderRole = userRole === Role.PROVIDER || userRole === Role.COMPANY;
    const isStillAvailable =
      service.status === ServiceStatus.REQUESTED &&
      !service.providerId &&
      (!service.targetProviderId || service.targetProviderId === userId);

    if (isProviderRole && isStillAvailable) return service;

    throw new ForbiddenException('Sem acesso a este serviço.');
  }

  // ── Estado 1 → 2: Prestador aceita ou rejeita ────────────────────────────

  async accept(serviceId: string, providerId: string, agreedPrice?: number): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.status !== ServiceStatus.REQUESTED) {
      throw new BadRequestException('Este pedido já não pode ser aceite.');
    }
    if (service.targetProviderId && service.targetProviderId !== providerId) {
      throw new ForbiddenException('Este pedido foi dirigido a outro prestador.');
    }

    service.status = ServiceStatus.ACCEPTED;
    service.providerId = providerId;
    service.agreedPrice = agreedPrice ?? service.budget;
    service.acceptedAt = new Date();

    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, providerId, 'PROVIDER_ACCEPTED',
      `Prestador aceitou o pedido por ${saved.agreedPrice?.toLocaleString('pt-PT')} Kz`,
    );

    await this.notificationsService.notifyServiceAccepted(service.clientId, providerId).catch(() => {});

    return saved;
  }

  async reject(serviceId: string, providerId: string, reason?: string): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.status !== ServiceStatus.REQUESTED) {
      throw new BadRequestException('Este pedido já não pode ser rejeitado.');
    }

    service.status = ServiceStatus.REJECTED;
    service.cancelReason = reason ?? 'Rejeitado pelo prestador';
    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, providerId, 'PROVIDER_REJECTED',
      `Prestador recusou o pedido${reason ? ': ' + reason : ''}`,
    );

    return saved;
  }

  // ── Proposta de preço (fluxo antigo — prestador propõe, cliente decide) ──

  async proposePrice(serviceId: string, providerId: string, proposedPrice: number): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.status !== ServiceStatus.REQUESTED) {
      throw new BadRequestException('Este pedido já não aceita propostas.');
    }
    if (service.targetProviderId && service.targetProviderId !== providerId) {
      throw new ForbiddenException('Este pedido foi dirigido a outro prestador.');
    }

    service.proposedPrice = proposedPrice;
    service.proposedByProviderId = providerId;
    service.targetProviderId = providerId;

    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, providerId, 'PROPOSAL_MADE',
      `Prestador propôs ${proposedPrice.toLocaleString('pt-PT')} Kz`,
    );

    await this.notificationsService.notifyServiceProposed(
      service.clientId, 'Prestador', proposedPrice,
    ).catch(() => {});

    return saved;
  }

  async acceptProposal(serviceId: string, clientId: string): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.clientId !== clientId) throw new ForbiddenException('Sem permissão.');
    if (!service.proposedPrice || !service.proposedByProviderId) {
      throw new BadRequestException('Não existe proposta pendente para este pedido.');
    }

    service.status = ServiceStatus.ACCEPTED;
    service.providerId = service.proposedByProviderId;
    service.agreedPrice = service.proposedPrice;
    service.acceptedAt = new Date();

    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, clientId, 'PROPOSAL_ACCEPTED',
      `Cliente aceitou a proposta de ${service.agreedPrice.toLocaleString('pt-PT')} Kz`,
    );

    await this.notificationsService.notifyProposalAccepted(
      service.providerId, Number(service.agreedPrice),
    ).catch(() => {});

    return saved;
  }

  async rejectProposal(serviceId: string, clientId: string): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.clientId !== clientId) throw new ForbiddenException('Sem permissão.');

    const rejectedProviderId = service.proposedByProviderId;

    service.proposedPrice = null;
    service.proposedByProviderId = null;
    service.targetProviderId = null;

    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, clientId, 'PROPOSAL_REJECTED',
      'Cliente recusou a proposta — pedido voltou a ficar disponível',
    );

    if (rejectedProviderId) {
      await this.notificationsService.notifyProposalRejected(rejectedProviderId).catch(() => {});
    }

    return saved;
  }

  // ── Estado 2 → 3: Cliente inicia o pagamento ─────────────────────────────

  async initiatePayment(serviceId: string, clientId: string): Promise<{
    payment: Payment;
    bankAccount: { bankName: string; accountHolder: string; iban: string; accountNumber: string | null };
  }> {
    const service = await this.findById(serviceId);

    if (service.clientId !== clientId) throw new ForbiddenException('Sem permissão.');
    if (service.status !== ServiceStatus.ACCEPTED) {
      throw new BadRequestException('O serviço tem de estar aceite para iniciar o pagamento.');
    }

    const existing = await this.paymentRepo.findOne({ where: { serviceId } });
    const bankAccount = await this.bankAccountsService.getDefaultPlatformAccount();

    if (existing) {
      return {
        payment: existing,
        bankAccount: {
          bankName: bankAccount.bankName,
          accountHolder: bankAccount.accountHolder,
          iban: bankAccount.iban,
          accountNumber: bankAccount.accountNumber,
        },
      };
    }

    const amount = Number(service.agreedPrice ?? service.budget);
    const commissionPercentage = await this.platformSettingsService.getCommissionPercentage();
    const platformFee = Math.round(amount * (commissionPercentage / 100) * 100) / 100;
    const providerAmount = amount - platformFee;

    const payment = this.paymentRepo.create({
      serviceId,
      clientId,
      providerId: service.providerId!,
      amount,
      platformFee,
      providerAmount,
      commissionPercentageUsed: commissionPercentage,
      status: PaymentStatus.PENDING,
      platformBankAccountId: bankAccount.id,
    });

    const saved = await this.paymentRepo.save(payment);

    service.status = ServiceStatus.PAYMENT_PENDING;
    await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, clientId, 'BANK_DETAILS_SHOWN',
      `Dados bancários disponibilizados — valor a transferir: ${amount.toLocaleString('pt-PT')} Kz`,
    );

    await this.notificationsService.notifyClientBankDetailsAvailable(clientId, amount).catch(() => {});

    return {
      payment: saved,
      bankAccount: {
        bankName: bankAccount.bankName,
        accountHolder: bankAccount.accountHolder,
        iban: bankAccount.iban,
        accountNumber: bankAccount.accountNumber,
      },
    };
  }

  async getPaymentForService(serviceId: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { serviceId } });
  }

  // ── Estado 3 → 4: Gerar PIN para início do serviço ───────────────────────

  async generatePin(serviceId: string, clientId: string): Promise<{ pin: string; expiresAt: Date }> {
    const service = await this.findById(serviceId);

    if (service.clientId !== clientId) throw new ForbiddenException('Sem permissão.');
    if (service.status !== ServiceStatus.PAYMENT_HELD) {
      throw new BadRequestException('O pagamento tem de estar confirmado antes de gerar o PIN.');
    }

    // SECURITY FIX (L-2): substituído Math.random() (não criptograficamente
    // seguro) por crypto.randomInt() — CSPRNG do Node.js. O intervalo
    // [100000, 1000000) garante sempre 6 dígitos, idêntico ao anterior.
    const pin = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    service.servicePin = pin;
    service.pinExpiresAt = expiresAt;
    service.pinUsed = false;
    await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, null, 'PIN_GENERATED',
      'PIN de início gerado e enviado ao cliente (válido 24h)',
    );

    return { pin, expiresAt };
  }

  // ── Estado 4 → 5: Prestador valida PIN e inicia serviço ──────────────────

  async startService(serviceId: string, providerId: string, pin: string): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.providerId !== providerId) throw new ForbiddenException('Sem permissão.');
    if (service.status !== ServiceStatus.PAYMENT_HELD) {
      throw new BadRequestException('O serviço não está no estado correcto para iniciar.');
    }
    if (!service.servicePin) {
      throw new BadRequestException('O cliente ainda não gerou o PIN de início.');
    }
    if (service.pinUsed) {
      throw new BadRequestException('Este PIN já foi utilizado.');
    }
    if (service.pinExpiresAt && new Date() > service.pinExpiresAt) {
      throw new BadRequestException('O PIN expirou. O cliente deve gerar um novo.');
    }
    if (service.servicePin !== pin.trim()) {
      throw new BadRequestException('PIN inválido.');
    }

    service.status = ServiceStatus.IN_PROGRESS;
    service.pinUsed = true;
    service.startedAt = new Date();
    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, providerId, 'SERVICE_STARTED',
      'Prestador validou o PIN e iniciou o serviço',
    );

    await this.notificationsService.notifyServiceStarted(service.clientId, providerId).catch(() => {});

    return saved;
  }

  // ── Estado 5 → 6: Prestador marca como concluído ─────────────────────────

  async markProviderCompleted(serviceId: string, providerId: string, warrantyDays?: number): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.providerId !== providerId) throw new ForbiddenException('Sem permissão.');
    if (service.status !== ServiceStatus.IN_PROGRESS) {
      throw new BadRequestException('O serviço tem de estar em curso para ser marcado como concluído.');
    }

    service.status = ServiceStatus.PROVIDER_COMPLETED;
    service.providerCompletedAt = new Date();

    if (warrantyDays) {
      service.warrantyDays = warrantyDays;
      service.warrantyExpiresAt = new Date(Date.now() + warrantyDays * 24 * 60 * 60 * 1000);
    }

    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, providerId, 'PROVIDER_COMPLETED',
      `Prestador marcou serviço como concluído${warrantyDays ? ` — garantia de ${warrantyDays} dias` : ''}`,
    );

    await this.notificationsService.notifyServiceCompleted(service.clientId, providerId).catch(() => {});

    return saved;
  }

  // ── Estado 6 → 7: Cliente confirma conclusão ──────────────────────────────

  async confirmCompletion(
    serviceId: string,
    clientId: string,
    review?: { rating?: number; review?: string },
  ): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.clientId !== clientId) throw new ForbiddenException('Sem permissão.');
    if (service.status !== ServiceStatus.PROVIDER_COMPLETED) {
      throw new BadRequestException('O prestador ainda não marcou o serviço como concluído.');
    }

    const payment = await this.paymentRepo.findOne({ where: { serviceId } });
    if (!payment) throw new NotFoundException('Registo de pagamento não encontrado.');

    payment.status = PaymentStatus.PENDING_PAYOUT;
    await this.paymentRepo.save(payment);

    service.status = ServiceStatus.COMPLETED;
    service.completedAt = new Date();

    if (review?.rating) {
      service.clientRating = review.rating;
      service.clientReview = review.review ?? null;
    }

    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, clientId, 'CLIENT_CONFIRMED',
      'Cliente confirmou a conclusão do serviço',
    );

    await this.addTimeline(serviceId, null, 'COMMISSION_CALCULATED',
      `Comissão calculada: ${Number(payment.platformFee).toLocaleString('pt-PT')} Kz — valor líquido ao prestador: ${Number(payment.providerAmount).toLocaleString('pt-PT')} Kz`,
    );

    await this.notificationsService.notifyAdminPayoutPending(serviceId).catch(() => {});

    return saved;
  }

  // ── Update do pedido (fluxo antigo — cliente edita antes de aceitação) ──

  async updateByClient(serviceId: string, clientId: string, dto: Partial<CreateServiceDto>): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.clientId !== clientId) throw new ForbiddenException('Sem permissão.');
    if (service.status !== ServiceStatus.REQUESTED) {
      throw new BadRequestException('Só é possível editar pedidos ainda não aceites.');
    }

    Object.assign(service, dto);
    return this.serviceRepo.save(service);
  }

  // ── Cancelamento ──────────────────────────────────────────────────────────

  async cancel(serviceId: string, userId: string, reason?: string): Promise<Service> {
    const service = await this.findById(serviceId);

    const isClient = service.clientId === userId;
    const isProvider = service.providerId === userId;

    if (!isClient && !isProvider) throw new ForbiddenException('Sem permissão.');

    const cancellableStates = [
      ServiceStatus.REQUESTED,
      ServiceStatus.ACCEPTED,
      ServiceStatus.PAYMENT_PENDING,
    ];
    const refundableStates = [ServiceStatus.PAYMENT_HELD];

    if (!cancellableStates.includes(service.status) && !refundableStates.includes(service.status)) {
      throw new BadRequestException(
        'Não é possível cancelar após o início do serviço. Abre uma disputa se necessário.',
      );
    }

    const wasPaymentConfirmed = service.status === ServiceStatus.PAYMENT_HELD;

    if (wasPaymentConfirmed) {
      const payment = await this.paymentRepo.findOne({ where: { serviceId } });
      if (payment) {
        payment.status = PaymentStatus.REFUNDED;
        payment.refundedAt = new Date();
        await this.paymentRepo.save(payment);
      }
      service.status = ServiceStatus.REFUNDED;
    } else {
      service.status = ServiceStatus.CANCELLED;
    }

    service.cancelReason = reason ?? 'Cancelado pelo utilizador';
    await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, userId, 'SERVICE_CANCELLED',
      `Serviço cancelado por ${isClient ? 'cliente' : 'prestador'}${reason ? ': ' + reason : ''}` +
      (wasPaymentConfirmed ? ' — reembolso a processar manualmente pelo administrador' : ''),
    );

    if (wasPaymentConfirmed) {
      await this.notificationsService.notifyAdminRefundNeeded(serviceId).catch(() => {});
    }

    return service;
  }

  // ── Disputa ───────────────────────────────────────────────────────────────

  async openDispute(serviceId: string, userId: string, reason: string): Promise<Service> {
    const service = await this.findById(serviceId);

    if (service.clientId !== userId && service.providerId !== userId) {
      throw new ForbiddenException('Sem permissão.');
    }

    const disputeableStates = [
      ServiceStatus.PAYMENT_HELD,
      ServiceStatus.IN_PROGRESS,
      ServiceStatus.PROVIDER_COMPLETED,
    ];

    if (!disputeableStates.includes(service.status)) {
      throw new BadRequestException('Não é possível abrir disputa neste estado.');
    }

    service.status = ServiceStatus.DISPUTED;
    service.disputeReason = reason;
    const saved = await this.serviceRepo.save(service);

    await this.addTimeline(serviceId, userId, 'DISPUTE_OPENED', `Disputa aberta: ${reason}`);

    return saved;
  }

  // ── Timeline ──────────────────────────────────────────────────────────────

  async getTimeline(serviceId: string): Promise<ServiceTimeline[]> {
    return this.timelineRepo.find({
      where: { serviceId },
      order: { createdAt: 'ASC' },
      relations: { actor: true },
    });
  }

  async addTimelineEvent(
    serviceId: string,
    actorId: string | null,
    action: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    return this.addTimeline(serviceId, actorId, action, description, metadata);
  }

  // ── Estatísticas do cliente (fluxo antigo) ────────────────────────────────

  async getClientStats(clientId: string) {
    const all = await this.serviceRepo.find({ where: { clientId } });

    const totalCreated = all.length;
    const totalCompleted = all.filter(s => s.status === ServiceStatus.COMPLETED).length;
    const totalCancelled = all.filter(s =>
      [ServiceStatus.CANCELLED, ServiceStatus.REFUNDED, ServiceStatus.REJECTED].includes(s.status),
    ).length;
    const totalSpent = all
      .filter(s => s.status === ServiceStatus.COMPLETED)
      .reduce((sum, s) => sum + Number(s.agreedPrice ?? s.budget), 0);

    const averageRating = null;

    return { totalCreated, totalSpent, totalCompleted, totalCancelled, averageRating };
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIX: totalEarnings agora vem de Payment.providerAmount (valor já
  // líquido, com a comissão descontada no momento da criação do
  // pagamento) somado apenas para Payments com status COMPLETED — ou
  // seja, só depois do admin ter marcado "Transferência realizada".
  // Antes usava Service.agreedPrice (valor bruto do serviço), por isso
  // a Home e as Estatísticas mostravam sempre o mesmo valor bruto em
  // vez do dinheiro real já recebido pelo prestador.
  // ══════════════════════════════════════════════════════════════════════

  async getProviderStats(providerId: string) {
    const all = await this.serviceRepo.find({ where: { providerId } });

    const totalOrders = all.length;
    const completed = all.filter(s => s.status === ServiceStatus.COMPLETED);
    const totalCompleted = completed.length;

    // Valor real já pago ao prestador — só Payments COMPLETED
    const completedPayments = await this.paymentRepo.find({
      where: { providerId, status: PaymentStatus.COMPLETED },
    });
    const totalEarnings = completedPayments.reduce(
      (sum, p) => sum + Number(p.providerAmount), 0,
    );

    const activeOrders = all.filter(s =>
      [ServiceStatus.ACCEPTED, ServiceStatus.PAYMENT_HELD, ServiceStatus.IN_PROGRESS, ServiceStatus.PROVIDER_COMPLETED]
        .includes(s.status),
    ).length;

    const rated = completed.filter(s => s.clientRating != null);
    const averageRating = rated.length > 0
      ? rated.reduce((sum, s) => sum + Number(s.clientRating), 0) / rated.length
      : null;

    return { totalOrders, totalCompleted, totalEarnings, averageRating, activeOrders };
  }

  async getProviderStatsByPeriod(providerId: string, period: string) {
    const all = await this.serviceRepo.find({ where: { providerId } });
    const completed = all.filter(s => s.status === ServiceStatus.COMPLETED && s.completedAt);

    // Todos os Payments COMPLETED deste prestador, para calcular o
    // valor real (líquido) por período em vez do bruto.
    const completedPayments = await this.paymentRepo.find({
      where: { providerId, status: PaymentStatus.COMPLETED },
    });
    const paymentByServiceId = new Map(completedPayments.map(p => [p.serviceId, p]));

    const now = new Date();
    let cutoff: Date;
    let buckets: number;
    let bucketMs: number;
    let labelFn: (offset: number) => string;

    const normalized = period.toLowerCase();

    if (normalized.includes('semana')) {
      buckets = 7;
      bucketMs = 24 * 60 * 60 * 1000;
      cutoff = new Date(now.getTime() - buckets * bucketMs);
      labelFn = (i) => {
        const d = new Date(cutoff.getTime() + i * bucketMs);
        return d.toLocaleDateString('pt-PT', { weekday: 'short' });
      };
    } else if (normalized.includes('ano')) {
      buckets = 12;
      cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      bucketMs = 0;
      labelFn = (i) => {
        const d = new Date(cutoff.getFullYear(), cutoff.getMonth() + i, 1);
        return d.toLocaleDateString('pt-PT', { month: 'short' });
      };
    } else {
      buckets = 30;
      bucketMs = 24 * 60 * 60 * 1000;
      cutoff = new Date(now.getTime() - buckets * bucketMs);
      labelFn = (i) => {
        const d = new Date(cutoff.getTime() + i * bucketMs);
        return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
      };
    }

    const earningsByPeriod: { label: string; value: number }[] = [];
    const completedByPeriod: { label: string; value: number }[] = [];

    for (let i = 0; i < buckets; i++) {
      let bucketStart: Date;
      let bucketEnd: Date;

      if (normalized.includes('ano')) {
        bucketStart = new Date(cutoff.getFullYear(), cutoff.getMonth() + i, 1);
        bucketEnd = new Date(cutoff.getFullYear(), cutoff.getMonth() + i + 1, 1);
      } else {
        bucketStart = new Date(cutoff.getTime() + i * bucketMs);
        bucketEnd = new Date(bucketStart.getTime() + bucketMs);
      }

      const inBucket = completed.filter(s => {
        const d = new Date(s.completedAt!);
        return d >= bucketStart && d < bucketEnd;
      });

      // Soma o valor LÍQUIDO (providerAmount) de cada serviço concluído
      // neste período, usando o Payment correspondente. Se um serviço
      // concluído ainda não tiver Payment COMPLETED (ex: admin ainda
      // não fez o payout), contribui com 0 — não com o valor bruto.
      const periodEarnings = inBucket.reduce((sum, s) => {
        const payment = paymentByServiceId.get(s.id);
        return sum + (payment ? Number(payment.providerAmount) : 0);
      }, 0);

      earningsByPeriod.push({ label: labelFn(i), value: periodEarnings });
      completedByPeriod.push({ label: labelFn(i), value: inBucket.length });
    }

    const periodCompleted = completed.filter(s => new Date(s.completedAt!) >= cutoff);
    const totalCompleted = periodCompleted.length;
    const totalEarnings = periodCompleted.reduce((sum, s) => {
      const payment = paymentByServiceId.get(s.id);
      return sum + (payment ? Number(payment.providerAmount) : 0);
    }, 0);

    const rated = periodCompleted.filter(s => s.clientRating != null);
    const averageRating = rated.length > 0
      ? rated.reduce((sum, s) => sum + Number(s.clientRating), 0) / rated.length
      : null;

    const withResponseTime = all.filter(s => s.acceptedAt && s.createdAt);
    const avgResponseTimeHours = withResponseTime.length > 0
      ? withResponseTime.reduce((sum, s) => {
          const diffMs = new Date(s.acceptedAt!).getTime() - new Date(s.createdAt).getTime();
          return sum + diffMs / (1000 * 60 * 60);
        }, 0) / withResponseTime.length
      : null;

    const totalAll = all.length;
    const completionRate = totalAll > 0 ? completed.length / totalAll : 0;
    const rankingScore = Math.round(
      (completionRate * 50) + ((averageRating ?? 0) / 5 * 30) + Math.min(totalCompleted, 20) / 20 * 20,
    );

    return {
      totalCompleted, totalEarnings, averageRating, avgResponseTimeHours,
      rankingScore, earningsByPeriod, completedByPeriod,
    };
  }

  // ── Reviews do prestador (fluxo antigo) ────────────────────────────────────

  async getProviderReviews(providerId: string) {
    const completed = await this.serviceRepo.find({
      where: { providerId, status: ServiceStatus.COMPLETED },
      relations: { client: true },
      order: { completedAt: 'DESC' },
    });

    const reviews = completed
      .filter(s => s.clientRating != null)
      .map(s => ({
        id: s.id,
        title: s.title,
        clientName: s.client?.fullName ?? '—',
        rating: Number(s.clientRating),
        review: s.clientReview ?? null,
        completedAt: s.completedAt!.toISOString(),
      }));

    const total = reviews.length;
    const average = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : null;

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach(r => {
      const key = String(Math.round(r.rating));
      if (distribution[key] !== undefined) distribution[key]++;
    });

    return { reviews, stats: { total, average, distribution } };
  }

  // ── Timeline helper ───────────────────────────────────────────────────────

  private async addTimeline(
    serviceId: string,
    actorId: string | null,
    action: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const event = this.timelineRepo.create({ serviceId, actorId, action, description, metadata: metadata ?? null });
    await this.timelineRepo.save(event).catch(err => this.logger.error('Timeline error:', err));
  }
}