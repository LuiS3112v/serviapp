import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';
import { CompanyInvitationStatus } from '../../common/enums/company-invitation-status.enum';

@Entity('company_invitations')
@Index(['companyId'])
@Index(['inviteeUserId'])
@Index(['status'])
export class CompanyInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @ManyToOne(() => Company, (c) => c.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  invitedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy: User;

  @Column()
  inviteeUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviteeUserId' })
  invitee: User;

  @Column({
    type: 'enum',
    enum: CompanyEmployeeRole,
    default: CompanyEmployeeRole.EMPLOYEE,
  })
  proposedRole: CompanyEmployeeRole;

  @Column({ nullable: true })
  proposedDepartment: string;

  @Column({
    type: 'enum',
    enum: CompanyInvitationStatus,
    default: CompanyInvitationStatus.PENDING,
  })
  status: CompanyInvitationStatus;

  @Column({ nullable: true, type: 'timestamp' })
  respondedAt: Date | null;

  @CreateDateColumn()
  sentAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}