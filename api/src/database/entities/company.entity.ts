import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, OneToOne, Index,
} from 'typeorm';
import { User } from './user.entity';
import { CompanyVerificationStatus } from '../../common/enums/company-verification-status.enum';
import { CompanyVerification } from './company-verification.entity';
import { CompanyEmployee } from './company-employee.entity';
import { CompanyInvitation } from './company-invitation.entity';
import { CompanyService } from './company-service.entity';

@Entity('companies')
@Index(['ownerId'])
@Index(['verificationStatus'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ nullable: true })
  logoPublicId: string;

  @Column({ nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  bannerPublicId: string;

  @Column({
    type: 'enum',
    enum: CompanyVerificationStatus,
    default: CompanyVerificationStatus.PENDING,
  })
  verificationStatus: CompanyVerificationStatus;

  @Column({ nullable: true, type: 'timestamp' })
  verifiedAt: Date | null;

  @Column()
  mainCategory: string;

  @Column()
  foundedYear: number;

  @Column({ nullable: true })
  website: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  nif: string;

  @Column({ nullable: true })
  headquarters: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  municipality: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  sector: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ type: 'jsonb', nullable: true })
  workingHours: Record<string, any>[] | null;

  @Column({ type: 'jsonb', nullable: true })
  coverageProvinces: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    whatsapp?: string;
    website?: string;
  } | null;

  @OneToOne(() => CompanyVerification, (v) => v.company)
  verification: CompanyVerification;

  @OneToMany(() => CompanyEmployee, (e) => e.company)
  employees: CompanyEmployee[];

  @OneToMany(() => CompanyInvitation, (i) => i.company)
  invitations: CompanyInvitation[];

  @OneToMany(() => CompanyService, (s) => s.company)
  services: CompanyService[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}