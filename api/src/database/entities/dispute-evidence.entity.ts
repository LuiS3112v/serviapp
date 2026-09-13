import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from './user.entity';

// Uma evidência enviada por cliente ou prestador durante uma disputa.
// Cada parte só vê as suas próprias — o admin vê de ambos.
// serviceId (em vez de disputeId) porque o campo Dispute.evidence nunca
// chegou a ser usado — a disputa activa está em Service.status=DISPUTED.
@Entity('dispute_evidences')
export class DisputeEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ type: 'uuid' })
  uploadedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy: User;

  // 'client' | 'provider' — gravado no momento do upload para que o
  // admin saiba de que lado veio sem ter de cruzar com o serviço.
  @Column({ type: 'varchar' })
  uploaderRole: 'client' | 'provider';

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  filePublicId: string | null;

  @Column()
  fileType: string; // 'pdf' | 'png' | 'jpg' | 'jpeg'

  // Descrição opcional que o utilizador escreve ao enviar a evidência.
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn()
  createdAt: Date;
}