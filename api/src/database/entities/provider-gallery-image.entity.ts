import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

// Espelha exactamente CompanyGalleryImage — mesma forma de colunas,
// mesmo padrão de FK com onDelete CASCADE. Entity própria justificada
// porque é uma coleção de N registos por prestador (não um campo
// escalar de User), o mesmo raciocínio que já justifica
// CompanyGalleryImage existir separada de Company.
@Entity('provider_gallery_images')
@Index(['providerId'])
export class ProviderGalleryImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'providerId' })
  provider: User;

  @Column()
  url: string;

  @Column()
  publicId: string;

  @Column({ nullable: true })
  caption: string;

  @CreateDateColumn()
  createdAt: Date;
}