import {
  Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn,
} from 'typeorm';

// Tabela singleton (uma única linha sempre) com configurações globais
// da plataforma. Começa com commissionPercentage=10, editável pelo
// admin sem precisar de deploy. Se no futuro for preciso comissão
// variável por tipo de conta, esta tabela pode ganhar mais colunas sem
// quebrar nada do que já usa getCommissionPercentage().
@Entity('platform_settings')
export class PlatformSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  commissionPercentage: number;

  @UpdateDateColumn()
  updatedAt: Date;
}