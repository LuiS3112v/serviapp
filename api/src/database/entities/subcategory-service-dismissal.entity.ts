import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { SubcategoryService } from './subcategory-service.entity';
import { User } from './user.entity';

// Regista que um prestador específico clicou "Recusar" num pedido
// rápido. O pedido continua a existir e continua visível para todos os
// OUTROS prestadores — só desaparece para quem o dispensou. É a
// implementação directa da regra "o pedido desaparece apenas para esse
// prestador; os restantes continuam a vê-lo; o serviço não é afetado".
@Entity('subcategory_service_dismissals')
@Index(['subcategoryServiceId'])
@Index(['providerId'])
@Unique(['subcategoryServiceId', 'providerId'])
export class SubcategoryServiceDismissal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  subcategoryServiceId: string;

  @ManyToOne(() => SubcategoryService, (s) => s.dismissals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subcategoryServiceId' })
  subcategoryService: SubcategoryService;

  @Column({ type: 'uuid' })
  providerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @CreateDateColumn()
  createdAt: Date;
}