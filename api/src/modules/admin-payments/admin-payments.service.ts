import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Service } from '../../database/entities/service.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { TransactionType } from '../../common/enums/transaction-type.enum';
import { PaymentProofService } from '../payment-proof/payment-proof.service';
import { BankAccountsService } from '../bank-accounts/bank-accounts.service';
import { WalletService } from '../wallet/wallet.service';
import { ServicesService } from '../services/services.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProviderCatalogService } from '../provider-catalog/provider-catalog.service';

@Injectable()
export class AdminPaymentsService {
  private readonly logger = new Logger(AdminPaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private dataSource: DataSource,
    private paymentProofService: PaymentProofService,
    private bankAccountsService: BankAccountsService,
    private walletService: WalletService,
    private servicesService: ServicesService,
    private notificationsService: NotificationsService,
    private catalogService: ProviderCatalogService,
  ) {}

  async listPendingProofs() {
    const payments = await this.paymentRepo.find({
      where: { status: PaymentStatus.PROOF_SUBMITTED },
      relations: { client: true, provider: true, service: true, proofs: true },
      order: { createdAt: 'DESC' },
    });
    return payments.map(p => this.mapPaymentForAdmin(p));
  }

  async listConfirmedPayments() {
    const payments = await this.paymentRepo.find({
      where: { status: PaymentStatus.CONFIRMED },
      relations: { client: true, provider: true, service: true },
      order: { confirmedAt: 'DESC' },
    });
    return payments.map(p => this.mapPaymentForAdmin(p));
  }

  async listPendingPayouts() {
    const payments = await this.paymentRepo.find({
      where: { status: PaymentStatus.PENDING_PAYOUT },
      relations: { client: true, provider: true, service: true },
      order: { updatedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      payments.map(async (p) => {
        const providerAccount = await this.bankAccountsService.getProviderAccountForAdmin(p.providerId);
        return {
          ...this.mapPaymentForAdmin(p),
          providerBankAccount: providerAccount
            ? {
                bankName: providerAccount.bankName,
                accountHolder: providerAccount.accountHolder,
                iban: providerAccount.iban,
                accountNumber: providerAccount.accountNumber,
              }
            : null,
        };
      }),
    );
    return enriched;
  }

  // ══════════════════════════════════════════════════════════════════════
  // FIX: agora inclui o Payment com relations:{ proofs:true } para poder
  // extrair o latestProof — exactamente como listPendingProofs já fazia
  // — e devolvê-lo junto com o resto dos dados de disputa, permitindo ao
  // admin ver o comprovativo directamente no card de disputa.
  // ══════════════════════════════════════════════════════════════════════
  async listDisputedServices() {
    const services = await this.serviceRepo.find({
      where: { status: ServiceStatus.DISPUTED },
      relations: { client: true, provider: true },
      order: { updatedAt: 'DESC' },
    });

    const enriched = await Promise.all(
      services.map(async (s) => {
        const payment = await this.paymentRepo.findOne({
          where: { serviceId: s.id },
          relations: { proofs: true },
        });

        const providerAccount = payment
          ? await this.bankAccountsService.getProviderAccountForAdmin(s.providerId!)
          : null;

        const latestProof = payment?.proofs?.length
          ? [...payment.proofs].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0]
          : null;

        return {
          serviceId: s.id,
          serviceTitle: s.title,
          disputeReason: s.disputeReason ?? '—',
          client: {
            id: s.client?.id,
            fullName: s.client?.fullName ?? '—',
            phone: s.client?.phone ?? '—',
          },
          provider: {
            id: s.provider?.id,
            fullName: s.provider?.fullName ?? '—',
          },
          payment: payment
            ? {
                id: payment.id,
                amount: Number(payment.amount),
                platformFee: Number(payment.platformFee),
                providerAmount: Number(payment.providerAmount),
                commissionPercentageUsed: Number(payment.commissionPercentageUsed),
                status: payment.status,
              }
            : null,
          latestProof: latestProof
            ? { id: latestProof.id, fileType: latestProof.fileType, createdAt: latestProof.createdAt }
            : null,
          providerBankAccount: providerAccount
            ? {
                bankName: providerAccount.bankName,
                accountHolder: providerAccount.accountHolder,
                iban: providerAccount.iban,
                accountNumber: providerAccount.accountNumber,
              }
            : null,
          updatedAt: s.updatedAt,
        };
      }),
    );

    return enriched;
  }

  async resolveDisputeForClient(serviceId: string, adminId: string, resolution: string) {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.DISPUTED) {
      throw new BadRequestException('Este serviço não está em disputa.');
    }

    const payment = await this.paymentRepo.findOne({ where: { serviceId } });
    if (payment && [PaymentStatus.CONFIRMED, PaymentStatus.PENDING_PAYOUT].includes(payment.status)) {
      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();
      await this.paymentRepo.save(payment);
    }

    service.status = ServiceStatus.REFUNDED;
    await this.serviceRepo.save(service);

    await this.servicesService.addTimelineEvent(
      serviceId, adminId, 'DISPUTE_RESOLVED_CLIENT',
      `Disputa resolvida a favor do cliente: ${resolution}`,
    );

    await this.notificationsService.notifyClientDisputeResolved(service.clientId, true, resolution).catch(() => {});
    if (service.providerId) {
      await this.notificationsService.notifyProviderDisputeResolved(service.providerId, false, resolution).catch(() => {});
    }

    return { serviceId, resolvedFor: 'client' };
  }

  async resolveDisputeForProvider(serviceId: string, adminId: string, resolution: string) {
    const service = await this.serviceRepo.findOne({ where: { id: serviceId } });
    if (!service) throw new NotFoundException('Serviço não encontrado.');
    if (service.status !== ServiceStatus.DISPUTED) {
      throw new BadRequestException('Este serviço não está em disputa.');
    }

    const payment = await this.paymentRepo.findOne({ where: { serviceId } });
    if (payment && payment.status === PaymentStatus.CONFIRMED) {
      payment.status = PaymentStatus.PENDING_PAYOUT;
      await this.paymentRepo.save(payment);
    }

    service.status = ServiceStatus.COMPLETED;
    service.completedAt = new Date();
    await this.serviceRepo.save(service);

    await this.servicesService.addTimelineEvent(
      serviceId, adminId, 'DISPUTE_RESOLVED_PROVIDER',
      `Disputa resolvida a favor do prestador: ${resolution}`,
    );

    await this.notificationsService.notifyProviderDisputeResolved(service.providerId!, true, resolution).catch(() => {});
    await this.notificationsService.notifyClientDisputeResolved(service.clientId, false, resolution).catch(() => {});

    return { serviceId, resolvedFor: 'provider' };
  }

  async getPaymentDetail(paymentId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: { client: true, provider: true, service: true },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    const proofHistory = await this.paymentProofService.getProofHistoryForAdmin(paymentId);
    const providerAccount = await this.bankAccountsService.getProviderAccountForAdmin(payment.providerId);

    return {
      ...this.mapPaymentForAdmin(payment),
      proofHistory,
      providerBankAccount: providerAccount
        ? {
            bankName: providerAccount.bankName,
            accountHolder: providerAccount.accountHolder,
            iban: providerAccount.iban,
            accountNumber: providerAccount.accountNumber,
          }
        : null,
    };
  }

  async confirmProof(paymentId: string, adminId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: { service: true },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    if (payment.status !== PaymentStatus.PROOF_SUBMITTED) {
      throw new BadRequestException(
        'Este pagamento não tem um comprovativo pendente de confirmação.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.paymentProofService.confirmActiveProof(paymentId, adminId);

      payment.status = PaymentStatus.CONFIRMED;
      payment.confirmedAt = new Date();
      payment.confirmedByAdminId = adminId;
      await queryRunner.manager.save(payment);

      const service = payment.service;
      service.status = ServiceStatus.PAYMENT_HELD;
      service.paymentHeldAt = new Date();
      await queryRunner.manager.save(service);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    await this.servicesService.addTimelineEvent(
      payment.serviceId, adminId, 'ADMIN_CONFIRMED_PAYMENT',
      'Administrador confirmou o pagamento — comprovativo validado',
    );

    await this.notificationsService.notifyClientPaymentConfirmed(payment.clientId).catch(() => {});
    await this.notificationsService.notifyProviderPaymentConfirmed(payment.providerId).catch(() => {});

    return this.getPaymentDetail(paymentId);
  }

  async rejectProof(paymentId: string, adminId: string, reason: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    if (payment.status !== PaymentStatus.PROOF_SUBMITTED) {
      throw new BadRequestException(
        'Este pagamento não tem um comprovativo pendente de confirmação.',
      );
    }

    payment.status = PaymentStatus.PENDING;
    await this.paymentRepo.save(payment);

    await this.servicesService.addTimelineEvent(
      payment.serviceId, adminId, 'ADMIN_REJECTED_PROOF',
      `Administrador rejeitou o comprovativo: ${reason}`,
    );

    await this.notificationsService.notifyClientProofRejected(payment.clientId, reason).catch(() => {});

    return this.getPaymentDetail(paymentId);
  }

  async markPayoutDone(paymentId: string, adminId: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Pagamento não encontrado.');

    if (payment.status !== PaymentStatus.PENDING_PAYOUT) {
      throw new BadRequestException(
        'Este pagamento não está pendente de transferência ao prestador.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const providerWallet = await this.walletService.getOrCreate(payment.providerId);
      const balBefore = Number(providerWallet.balance);
      providerWallet.balance = balBefore + Number(payment.providerAmount);
      providerWallet.totalEarned = Number(providerWallet.totalEarned) + Number(payment.providerAmount);
      await queryRunner.manager.save(providerWallet);

      const tx = queryRunner.manager.create(Transaction, {
        walletId: providerWallet.id,
        userId: payment.providerId,
        type: TransactionType.ESCROW_RELEASE,
        amount: Number(payment.providerAmount),
        balanceBefore: balBefore,
        balanceAfter: providerWallet.balance,
        description: `Transferência realizada pelo administrador — serviço ${payment.serviceId}`,
        referenceId: payment.serviceId,
        referenceType: 'service',
      });
      await queryRunner.manager.save(tx);

      payment.status = PaymentStatus.COMPLETED;
      payment.releasedAt = new Date();
      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    try {
      const service = await this.servicesService.findById(payment.serviceId);
      await this.catalogService.deactivateByServiceId(service.catalogItemId);
    } catch (err) {
      this.logger.warn(`Falha ao desactivar entrada de catálogo para o serviço ${payment.serviceId}: ${err}`);
    }

    await this.servicesService.addTimelineEvent(
      payment.serviceId, adminId, 'PAYOUT_COMPLETED',
      `Transferência de ${Number(payment.providerAmount).toLocaleString('pt-PT')} Kz realizada ao prestador — pagamento concluído`,
    );

    await this.notificationsService.notifyProviderPayoutDone(
      payment.providerId, Number(payment.providerAmount),
    ).catch(() => {});

    return this.getPaymentDetail(paymentId);
  }

  private mapPaymentForAdmin(payment: Payment) {
    const latestProof = payment.proofs?.length
      ? [...payment.proofs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]
      : null;

    return {
      id: payment.id,
      serviceId: payment.serviceId,
      serviceTitle: payment.service?.title ?? '—',
      client: {
        id: payment.client?.id,
        fullName: payment.client?.fullName ?? '—',
        phone: payment.client?.phone ?? '—',
      },
      provider: {
        id: payment.provider?.id,
        fullName: payment.provider?.fullName ?? '—',
      },
      amount: Number(payment.amount),
      platformFee: Number(payment.platformFee),
      providerAmount: Number(payment.providerAmount),
      commissionPercentageUsed: Number(payment.commissionPercentageUsed),
      status: payment.status,
      latestProof: latestProof
        ? { id: latestProof.id, fileType: latestProof.fileType, createdAt: latestProof.createdAt }
        : null,
      createdAt: payment.createdAt,
      confirmedAt: payment.confirmedAt,
      releasedAt: payment.releasedAt,
    };
  }
}