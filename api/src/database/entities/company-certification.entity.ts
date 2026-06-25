import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('company_certifications')
@Index(['companyId'])
export class CompanyCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  name: string;

  @Column({ nullable: true })
  issuer: string;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  certificateUrl: string;

  @Column({ nullable: true })
  certificatePublicId: string;

  @CreateDateColumn()
  createdAt: Date;
}