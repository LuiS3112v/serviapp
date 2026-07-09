import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from './user.entity';
import { DisputeStatus } from '../../common/enums/dispute-status.enum';

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'uuid' })
  openedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'openedByUserId' })
  openedBy: User;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar', default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Column({ type: 'text', nullable: true })
  resolution: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedByAdminId: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  evidence: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}