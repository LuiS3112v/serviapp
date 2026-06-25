import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';

@Entity('services')
@Index(['clientId'])
@Index(['providerId'])
@Index(['status'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  province: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  agreedPrice: number;

  // ─── Negociação ───────────────────────────────────────────────────────────
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  proposedPrice: number | null;

  @Column({ nullable: true })
  proposedByProviderId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'proposedByProviderId' })
  proposedByProvider: User;

  // ─── Pedido dirigido a um provider específico ─────────────────────────────
  @Column({ nullable: true })
  targetProviderId: string;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PENDING,
  })
  status: ServiceStatus;

  @Column()
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  providerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  // ─── Empresa (se o provider pertence a uma empresa) ───────────────────────
  @Column({ nullable: true, type: 'uuid' })
  companyId: string | null;

  @Column({ nullable: true })
  scheduledAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  clientConfirmedAt: Date;

  @Column({ default: false })
  paymentReleased: boolean;

  @Column({ nullable: true })
  clientRating: number;

  @Column({ nullable: true, type: 'text' })
  clientReview: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}