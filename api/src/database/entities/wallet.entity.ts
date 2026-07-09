import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Saldo disponível (em Kz)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance: number;

  // Saldo em escrow (retido, não disponível)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  heldBalance: number;

  // Total que passou pela wallet (histórico)
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalEarned: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ default: 'KZ' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}