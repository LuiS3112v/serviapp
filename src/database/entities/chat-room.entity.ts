import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';

import { User } from './user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_rooms')
@Index(['clientId'])
@Index(['providerId'])
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─────────────────────────────
  // CLIENT
  // ─────────────────────────────
  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  // ─────────────────────────────
  // PROVIDER
  // ─────────────────────────────
  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  // ─────────────────────────────
  // SERVICE
  // ─────────────────────────────
  @Column({ type: 'uuid', nullable: true })
  serviceId: string | null;

  // ─────────────────────────────
  // CHAT STATE
  // ─────────────────────────────
  @Column({ type: 'text', nullable: true })
  lastMessage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'int', default: 0 })
  clientUnread: number;

  @Column({ type: 'int', default: 0 })
  providerUnread: number;

  // ─────────────────────────────
  // RELATIONS
  // ─────────────────────────────
  @OneToMany(() => ChatMessage, (m) => m.room)
  messages: ChatMessage[];

  // ─────────────────────────────
  // TIMESTAMPS
  // ─────────────────────────────
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}