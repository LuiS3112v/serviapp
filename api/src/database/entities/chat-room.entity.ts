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

  // SECURITY FIX: removido eager:true. Este flag forçava o TypeORM a
  // carregar SEMPRE a entidade User completa (incluindo password hash,
  // twoFactorSecret, twoFactorTempSecret) em QUALQUER find()/findOne()
  // sobre ChatRoom em toda a base de código, mesmo sem ninguém pedir
  // relations explicitamente. Era exactamente isto que causava o leak
  // de passwords visível nas respostas da API do chat. A partir de
  // agora, quem precisar de dados de client/provider tem de pedir a
  // relação explicitamente e — por convenção obrigatória a partir de
  // agora neste projecto — usar select explícito, nunca a entidade
  // User completa (ver kyc.service.ts e payment-proof.service.ts como
  // referência do padrão correto).
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  // ─────────────────────────────
  // PROVIDER
  // ─────────────────────────────
  @Column({ type: 'uuid' })
  providerId: string;

  // Mesma correcção de segurança que client acima.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
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