import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

export enum SecurityLogAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  SESSION_REVOKED = 'session_revoked',
  NEW_DEVICE = 'new_device',
  TWO_FA_ENABLED = 'two_fa_enabled',
  TWO_FA_DISABLED = 'two_fa_disabled',
  ACCOUNT_DELETED = 'account_deleted',
}

@Entity('security_logs')
@Index(['userId'])
export class SecurityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  action: SecurityLogAction;

  @Column({ nullable: true })
  ip: string | null;

  @Column({ nullable: true })
  device: string | null;

  @Column({ nullable: true })
  browser: string | null;

  @CreateDateColumn()
  createdAt: Date;
}