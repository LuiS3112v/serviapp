import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';
import { User } from './user.entity';
import { TransactionType } from '../../common/enums/transaction-type.enum';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  walletId: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ type: 'text' })
  description: string;

  // referência ao serviço ou pagamento relacionado
  @Column({ type: 'uuid', nullable: true })
  referenceId: string | null;

  @Column({ nullable: true })
  referenceType: string | null; // 'service' | 'payment' | 'deposit'

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}