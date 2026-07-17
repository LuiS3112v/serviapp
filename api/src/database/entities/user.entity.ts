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

  // Controla se este prestador aparece no Mapa de Descoberta.
  // Distinto de isOnline: um prestador pode estar online no chat sem ter
  // ativado a partilha de localização. Só quando este campo é true é
  // que o backend aceita atualizações de posição vindas do prestador.
  @Column({ default: false })
  locationSharingEnabled: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastSeenAt: Date;

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