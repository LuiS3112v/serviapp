import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { DeviceToken } from '../../database/entities/device-token.entity';
import { FirebaseService } from './firebase.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterTokenDto } from './dto/register-token.dto';
import {
  NotificationType, NotificationStatus, NotificationPriority,
} from '../../common/enums/notification.enum';
 
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
 
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepo: Repository<DeviceToken>,
    private firebaseService: FirebaseService,
  ) {}
 
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      priority: dto.priority ?? NotificationPriority.MEDIUM,
      metadata: dto.metadata,
      actionUrl: dto.actionUrl,
    });
    const saved = await this.notificationRepo.save(notification);
    await this.sendPush(dto.userId, dto.title, dto.body, { actionUrl: dto.actionUrl ?? '' });
    return saved;
  }
 
  async findByUser(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unread = await this.notificationRepo.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
    return { notifications, total, unread };
  }
 
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });
  }
 
  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationRepo.update(
      { id, userId },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
  }
 
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, status: NotificationStatus.UNREAD },
      { status: NotificationStatus.READ, readAt: new Date() },
    );
  }
 
  async delete(id: string, userId: string): Promise<void> {
    await this.notificationRepo.delete({ id, userId });
  }
 
  async registerToken(userId: string, dto: RegisterTokenDto): Promise<void> {
    const existing = await this.deviceTokenRepo.findOne({ where: { token: dto.token } });
    if (existing) {
      await this.deviceTokenRepo.update(existing.id, {
        userId, isActive: true,
        platform: dto.platform ?? 'web',
        deviceName: dto.deviceName,
      });
    } else {
      await this.deviceTokenRepo.save(
        this.deviceTokenRepo.create({
          userId, token: dto.token,
          platform: dto.platform ?? 'web',
          deviceName: dto.deviceName,
          isActive: true,
        }),
      );
    }
  }
 
  private async sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
    const tokens = await this.deviceTokenRepo.find({
      where: { userId, isActive: true },
      select: { token: true },
    });
    if (tokens.length === 0) return;
    await this.firebaseService.sendToMultiple(tokens.map(t => t.token), title, body, data);
  }
 
  // ─── Domain events ─────────────────────────────────────────────────────────
 
  async notifyKycApproved(userId: string) {
    await this.create({ userId, type: NotificationType.KYC_APPROVED, title: '✅ Verificação aprovada!', body: 'O teu perfil está activo e visível para clientes.', priority: NotificationPriority.HIGH, actionUrl: '/provider-home' });
  }
 
  async notifyKycRejected(userId: string, reason: string) {
    await this.create({ userId, type: NotificationType.KYC_REJECTED, title: '❌ Verificação rejeitada', body: `Motivo: ${reason}. Podes submeter novamente.`, priority: NotificationPriority.HIGH, metadata: { reason }, actionUrl: '/kyc?role=provider' });
  }
 
  async notifyServiceAccepted(clientId: string, providerId: string) {
    await this.create({ userId: clientId, type: NotificationType.SERVICE_ACCEPTED, title: '🎉 Pedido aceite!', body: 'Um prestador aceitou o teu pedido de serviço.', priority: NotificationPriority.HIGH, actionUrl: '/services' });
  }
 
  async notifyServiceStarted(clientId: string, providerId: string) {
    await this.create({ userId: clientId, type: NotificationType.SERVICE_STARTED, title: '🚀 Serviço iniciado', body: 'O prestador começou a trabalhar no teu pedido.', priority: NotificationPriority.MEDIUM, actionUrl: '/services' });
  }
 
  async notifyServiceCompleted(clientId: string, providerId: string) {
    await this.create({ userId: clientId, type: NotificationType.SERVICE_COMPLETED, title: '✅ Serviço concluído', body: 'O serviço foi marcado como concluído. Confirma para avaliar.', priority: NotificationPriority.CRITICAL, actionUrl: '/services' });
  }
 
  async notifyPayment(userId: string, amount: number, description: string) {
    await this.create({ userId, type: NotificationType.PAYMENT, title: '💳 Pagamento processado', body: `${amount.toLocaleString('pt-PT')} Kz — ${description}`, priority: NotificationPriority.HIGH, metadata: { amount }, actionUrl: '/wallet' });
  }
 
  async notifyWallet(userId: string, amount: number, type: 'credit' | 'debit') {
    await this.create({ userId, type: NotificationType.WALLET, title: type === 'credit' ? '💰 Saldo recebido' : '💸 Saldo debitado', body: `${type === 'credit' ? '+' : '-'}${amount.toLocaleString('pt-PT')} Kz na tua wallet.`, priority: NotificationPriority.MEDIUM, actionUrl: '/wallet' });
  }
 
  // ─── Negociação ────────────────────────────────────────────────────────────
 
  async notifyServiceProposed(clientId: string, providerName: string, proposedPrice: number) {
    await this.create({
      userId: clientId,
      type: NotificationType.SERVICE_ACCEPTED,
      title: '💬 Nova proposta de preço',
      body: `${providerName} propôs ${proposedPrice.toLocaleString('pt-PT')} Kz para o teu pedido.`,
      priority: NotificationPriority.HIGH,
      actionUrl: '/services',
    });
  }
 
  async notifyProposalAccepted(providerId: string, agreedPrice: number) {
    await this.create({
      userId: providerId,
      type: NotificationType.SERVICE_ACCEPTED,
      title: '✅ Proposta aceite!',
      body: `O cliente aceitou a tua proposta de ${agreedPrice.toLocaleString('pt-PT')} Kz.`,
      priority: NotificationPriority.HIGH,
      actionUrl: '/provider/services',
    });
  }
 
  async notifyProposalRejected(providerId: string) {
    await this.create({
      userId: providerId,
      type: NotificationType.SYSTEM,
      title: '❌ Proposta recusada',
      body: 'O cliente recusou a tua proposta. O pedido voltou a estar disponível.',
      priority: NotificationPriority.MEDIUM,
      actionUrl: '/provider/services',
    });
  }

  async notifyServiceRequested(providerId: string, clientName: string, serviceTitle: string) {
    await this.create({
      userId:    providerId,
      type:      NotificationType.SYSTEM,
      title:     '🔔 Nova solicitação de serviço',
      body:      `${clientName} solicitou o teu serviço "${serviceTitle}". Verifica os pedidos disponíveis.`,
      priority:  NotificationPriority.HIGH,
      actionUrl: '/provider/services',
    });
  }
}