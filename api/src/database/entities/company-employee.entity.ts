import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';
import { CompanyEmployeeStatus } from '../../common/enums/company-employee-status.enum';

@Entity('company_employees')
@Unique(['companyId', 'userId'])
@Index(['companyId'])
@Index(['userId'])
export class CompanyEmployee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (c) => c.employees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({
    type: 'enum',
    enum: CompanyEmployeeRole,
    default: CompanyEmployeeRole.EMPLOYEE,
  })
  role: CompanyEmployeeRole;

  @Column({
    type: 'enum',
    enum: CompanyEmployeeStatus,
    default: CompanyEmployeeStatus.OFFLINE,
  })
  status: CompanyEmployeeStatus;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'int', default: 0 })
  completedServices: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  earningsGenerated: number;

  @Column({ type: 'int', default: 0 })
  avgResponseTimeMinutes: number;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}