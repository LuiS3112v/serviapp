import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

// Conta bancária de cada prestador — para onde o ADMIN transfere
// manualmente após confirmar o serviço concluído. NUNCA visível ao
// cliente em nenhum endpoint — só ao próprio prestador (para editar a
// sua conta) e ao administrador (para saber para onde transferir).
@Entity('provider_bank_accounts')
export class ProviderBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  bankName: string;

  @Column()
  accountHolder: string;

  @Column()
  iban: string;

  @Column({ nullable: true })
  accountNumber: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}