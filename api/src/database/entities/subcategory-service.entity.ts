import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { User } from './user.entity';
import { SubcategoryServiceProposal } from './subcategory-service-proposal.entity';
import { SubcategoryServiceDismissal } from './subcategory-service-dismissal.entity';
import { SubcategoryServiceStatus } from '../../common/enums/subcategory-service-status.enum';

// ══════════════════════════════════════════════════════════════════════
// Sistema 2 — Serviços Rápidos (Subcategories Services).
//
// Este entity cobre APENAS a fase pré-aceitação: broadcast para
// prestadores compatíveis, recepção de propostas, aceitação/rejeição
// pelo cliente. Assim que o cliente aceita uma proposta, este registo
// passa para status=CONVERTED e um Service real (tabela 'services') é
// criado a partir daqui — a partir desse momento TODO o resto do fluxo
// (pagamento, comprovativo, PIN, disputa, garantia, avaliação, wallet)
// corre inteiramente através do sistema já existente (ServicesService),
// sem nenhuma lógica duplicada.
//
// Não tem title, description, nem budget — o prompt exige explicitamente
// que o pedido inicial não tenha nada disso: só categoria, subcategoria
// e morada. O valor só existe a partir da proposta de um prestador.
// ══════════════════════════════════════════════════════════════════════
@Entity('subcategory_services')
@Index(['clientId'])
@Index(['status'])
@Index(['category'])
export class SubcategoryService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  category: string;

  @Column()
  subcategory: string;

  @Column()
  address: string;

  @Column({
    type: 'varchar',
    default: SubcategoryServiceStatus.BROADCASTING,
  })
  status: SubcategoryServiceStatus;

  @Column()
  clientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clientId' })
  client: User;

  // Preenchido quando o cliente aceita uma proposta — aponta para o
  // Service real criado a partir deste pedido rápido.
  @Column({ nullable: true })
  convertedServiceId: string | null;

  @OneToMany(() => SubcategoryServiceProposal, (p) => p.subcategoryService)
  proposals: SubcategoryServiceProposal[];

  @OneToMany(() => SubcategoryServiceDismissal, (d) => d.subcategoryService)
  dismissals: SubcategoryServiceDismissal[];

  @Column({ nullable: true })
  cancelReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}