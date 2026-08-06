import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

import { Role } from '../../common/enums/role.enum';
import { ProviderVerification } from './provider-verification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CLIENT,
  })
  role: Role;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true, type: 'text' })
  twoFactorSecret: string | null;

  @Column({ nullable: true, type: 'text' })
  twoFactorTempSecret: string | null;

  @Column({ default: false })
  profileVisible: boolean;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  avatarPublicId: string;

  @Column({ nullable: true })
  bio: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude: number;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ default: false })
  locationSharingEnabled: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastSeenAt: Date;

  // NOVO: marca de eliminação de conta (soft delete). Null = conta
  // activa. Quando preenchido, AuthService.validateUser() e
  // AuthService.login() tratam a conta como inexistente — nenhum
  // token antigo nem tentativa de login volta a funcionar contra ela.
  // Ver SecurityService.deleteAccount() para o fluxo completo.
  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;

  @OneToOne(
    () => ProviderVerification,
    (v) => v.provider,
  )
  verification: ProviderVerification;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}