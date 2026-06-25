import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Company } from './company.entity';

@Entity('company_portfolio_items')
@Index(['companyId'])
export class CompanyPortfolioItem {
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
  client: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'date', nullable: true })
  projectDate: string;

  @Column({ type: 'jsonb', default: [] })
  photoUrls: string[];

  @CreateDateColumn()
  createdAt: Date;
}