import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from './user.entity';

@Entity('service_timelines')
export class ServiceTimeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  // actorId é null para eventos de sistema
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'actorId' })
  actor: User | null;

  @Column()
  action: string; // 'SERVICE_CREATED', 'PROVIDER_ACCEPTED', etc.

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}