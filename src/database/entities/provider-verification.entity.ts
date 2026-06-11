import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index
} from 'typeorm';
import { KycStatus } from '../../common/enums/kyc-status.enum';
import { User } from './user.entity';

@Entity('provider_verifications')
@Index(['providerId'])
@Index(['status'])
export class ProviderVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column()
  fullName: string;

  @Column()
  biNumber: string;

  @Column()
  phoneNumber: string;

  @Column()
  province: string;

  @Column()
  category: string;

  @Column()
  frontBiUrl: string;

  @Column()
  frontBiPublicId: string;

  @Column()
  backBiUrl: string;

  @Column()
  backBiPublicId: string;

  @Column()
  selfieUrl: string;

  @Column()
  selfiePublicId: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewedByAdminId: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}