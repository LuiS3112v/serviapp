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

  // ALTERADO: agora nullable. Contas criadas via Google não têm
  // password — o login para essas contas só pode acontecer por Google.
  // AuthService.login() tem uma guarda explícita para nunca deixar uma
  // conta sem password tentar autenticar pelo fluxo tradicional.
  @Column({ nullable: true })
  password: string | null;

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

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;

  // NOVO — identificador estável ("sub") devolvido pela Google no ID
  // token. Não é um secret nem um token de acesso — é só uma referência
  // opaca usada para reconhecer a mesma conta Google em logins
  // futuros. Nullable e único: contas tradicionais nunca o têm
  // preenchido; uma conta Google nunca partilha este valor com outra.
  @Column({ nullable: true, unique: true })
  googleId: string | null;

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