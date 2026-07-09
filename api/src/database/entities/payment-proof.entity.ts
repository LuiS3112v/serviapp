import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { User } from './user.entity';
import { ProofStatus } from '../../common/enums/proof-status.enum';

// Histórico de comprovativos de um Payment. O cliente pode enviar
// vários antes da confirmação do admin (ex: enviou o PDF errado) — cada
// envio cria uma linha nova, o anterior passa a REPLACED. Depois da
// confirmação do admin, o comprovativo activo passa a CONFIRMED e fica
// bloqueado: nenhum novo upload é aceite a partir daí (ver
// PaymentProofService.upload).
@Entity('payment_proofs')
export class PaymentProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => Payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ type: 'uuid' })
  uploadedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedBy: User;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  filePublicId: string | null; // para apagar do Cloudinary se necessário

  @Column()
  fileType: string; // 'pdf' | 'png' | 'jpg' | 'jpeg'

  @Column({ type: 'varchar', default: ProofStatus.ACTIVE })
  status: ProofStatus;

  @Column({ type: 'uuid', nullable: true })
  confirmedByAdminId: string | null;

  @Column({ nullable: true })
  confirmedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}