import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('company_services')
@Index(['companyId'])
export class CompanyService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (c) => c.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  label: string;

  @Column()
  category: string;

  @CreateDateColumn()
  createdAt: Date;
}