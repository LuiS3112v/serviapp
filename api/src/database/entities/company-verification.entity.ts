import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToOne, Index,
} from 'typeorm';
import { Company } from './company.entity';
import { KycStatus } from '../../common/enums/kyc-status.enum';

@Entity('company_verifications')
@Index(['companyId'])
@Index(['status'])
export class CompanyVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @OneToOne(() => Company, (c) => c.verification)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  legalName: string;

  @Column()
  nif: string;

  @Column()
  representativeFullName: string;

  @Column()
  representativeBiNumber: string;

  @Column()
  phoneNumber: string;

  @Column()
  province: string;

  @Column()
  nifDocUrl: string;

  @Column()
  nifDocPublicId: string;

  @Column()
  commercialLicenseUrl: string;

  @Column()
  commercialLicensePublicId: string;

  @Column()
  commercialRegistryUrl: string;

  @Column()
  commercialRegistryPublicId: string;

  @Column()
  representativeIdUrl: string;

  @Column()
  representativeIdPublicId: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  reviewedByAdminId: string;

  @Column({ nullable: true, type: 'timestamp' })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}