import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';

@Entity('services')
@Index(['clientId'])
@Index(['providerId'])
@Index(['targetProviderId'])
@Index(['status'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column()
  address: string;

  @Column({ nullable: true })
  province: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  budget: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  agreedPrice: number | null;

  // ── Proposta de preço (fluxo antigo) ──────────────────────────────────────
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  proposedPrice: number | null;

  @Column({ nullable: true })
  proposedByProviderId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'proposedByProviderId' })
  proposedByProvider: User;

  @Column({
    type: 'varchar',
    default: ServiceStatus.REQUESTED,
  })
  status: ServiceStatus;

  @Column()
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  providerId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column({ nullable: true })
  targetProviderId: string | null;

  // Liga este pedido à entrada de catálogo (ProviderCatalog) que o
  // originou, quando o cliente clicou "Solicitar" na página de
  // pesquisa. É este campo que permite ao admin, ao concluir o
  // pagamento ao prestador, desactivar automaticamente essa entrada de
  // catálogo — fazendo o serviço desaparecer da pesquisa para novos
  // clientes, sem apagar o registo (o prestador pode reactivar
  // manualmente se quiser voltar a oferecer o mesmo serviço).
  @Column({ nullable: true })
  catalogItemId: string | null;

  // ── PIN de início ─────────────────────────────────────────────────────────
  @Column({ nullable: true, length: 6 })
  servicePin: string | null;

  @Column({ nullable: true })
  pinExpiresAt: Date | null;

  @Column({ default: false })
  pinUsed: boolean;

  // ── Garantia ──────────────────────────────────────────────────────────────
  @Column({ type: 'int', nullable: true })
  warrantyDays: number | null;

  @Column({ nullable: true })
  warrantyExpiresAt: Date | null;

  // ── Cancelamento / disputa ────────────────────────────────────────────────
  @Column({ nullable: true })
  cancelReason: string | null;

  @Column({ nullable: true })
  disputeReason: string | null;

  // ── Avaliação (fluxo antigo) ──────────────────────────────────────────────
  @Column({ nullable: true })
  clientRating: number;

  @Column({ nullable: true, type: 'text' })
  clientReview: string | null;

  // ── Agendamento (fluxo antigo) ────────────────────────────────────────────
  @Column({ nullable: true })
  scheduledAt: Date | null;

  // ── Datas de estado ───────────────────────────────────────────────────────
  @Column({ nullable: true })
  acceptedAt: Date | null;

  @Column({ nullable: true })
  paymentHeldAt: Date | null;

  @Column({ nullable: true })
  startedAt: Date | null;

  @Column({ nullable: true })
  providerCompletedAt: Date | null;

  @Column({ nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}