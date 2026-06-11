export enum NotificationType {
  MESSAGE = 'message',
  SERVICE_ACCEPTED = 'service_accepted',
  SERVICE_STARTED = 'service_started',
  SERVICE_COMPLETED = 'service_completed',
  SERVICE_CANCELLED = 'service_cancelled',
  PAYMENT = 'payment',
  WALLET = 'wallet',
  KYC_APPROVED = 'kyc_approved',
  KYC_REJECTED = 'kyc_rejected',
  SYSTEM = 'system',
  ADMIN = 'admin',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}