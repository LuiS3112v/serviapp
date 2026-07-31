import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { SubcategoryService } from './subcategory-service.entity';
import { User } from './user.entity';

// Uma linha por proposta de prestador. A restrição UNIQUE em
// (subcategoryServiceId, providerId) é o que garante, ao nível da base
// de dados, que dois pedidos concorrentes do MESMO prestador para o
// MESMO pedido rápido nunca criam duas propostas duplicadas — o
// segundo INSERT falha com violação de unicidade e o service.ts trata
// isso como "já tens uma proposta, usa update".
@Entity('subcategory_service_proposals')
@Index(['subcategoryServiceId'])
@Index(['providerId'])
@Unique(['subcategoryServiceId', 'providerId'])
export class SubcategoryServiceProposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  subcategoryServiceId: string;

  @ManyToOne(() => SubcategoryService, (s) => s.proposals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subcategoryServiceId' })
  subcategoryService: SubcategoryService;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  proposedPrice: number;

  @CreateDateColumn()
  createdAt: Date;
}