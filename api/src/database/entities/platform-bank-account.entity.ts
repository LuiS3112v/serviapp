import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

// Conta(s) bancária(s) da própria ServiApp — para onde os clientes
// transferem o valor dos serviços. Guardada em BD (não hardcoded) para
// permitir adicionar mais contas no futuro sem alterar código, apesar
// de por agora existir só uma, marcada isDefault=true.
@Entity('platform_bank_accounts')
export class PlatformBankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankName: string; // ex: 'BCA'

  @Column()
  accountHolder: string; // ex: 'Enariel Muxima Teixeira da Encarnação'

  @Column()
  iban: string;

  @Column({ nullable: true })
  accountNumber: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isDefault: boolean; // qual conta mostrar por defeito ao cliente

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}