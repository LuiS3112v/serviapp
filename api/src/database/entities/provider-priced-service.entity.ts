import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

// Lista de serviços com preço que o prestador oferece (ex: "Corte
// Masculino — 2000 Kz"). Entity própria porque é uma coleção de N
// itens por prestador, sem equivalente reaproveitável — CompanyService
// tem apenas label+category, sem preço, por isso não serve para este
// caso sem alterar um sistema já existente que o prompt proíbe tocar.
@Entity('provider_priced_services')
@Index(['providerId'])
export class ProviderPricedService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}