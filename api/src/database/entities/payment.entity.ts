import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from './user.entity';
import { PaymentProof } from './payment-proof.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  providerAmount: number; // amount - platformFee

  // Regista qual % foi realmente aplicada neste pagamento. Se o admin
  // mudar PlatformSettings.commissionPercentage depois, pagamentos já
  // feitos mantêm o valor histórico correcto em vez de recalcularem.
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionPercentageUsed: number;

  @Column({ type: 'varchar', default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // Conta da ServiApp que foi mostrada ao cliente para este pagamento
  @Column({ type: 'uuid', nullable: true })
  platformBankAccountId: string | null;

  @OneToMany(() => PaymentProof, (proof) => proof.payment)
  proofs: PaymentProof[];

  @Column({ type: 'timestamp', nullable: true })
  heldAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  confirmedByAdminId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  releasedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}