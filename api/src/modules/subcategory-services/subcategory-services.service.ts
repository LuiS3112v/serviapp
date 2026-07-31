import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { SubcategoryService } from '../../database/entities/subcategory-service.entity';
import { SubcategoryServiceProposal } from '../../database/entities/subcategory-service-proposal.entity';
import { SubcategoryServiceDismissal } from '../../database/entities/subcategory-service-dismissal.entity';
import { Service } from '../../database/entities/service.entity';
import { ProviderCatalog } from '../../database/entities/provider-catalog.entity';

import { SubcategoryServiceStatus } from '../../common/enums/subcategory-service-status.enum';
import { ServiceStatus } from '../../common/enums/service-status.enum';

import { CreateSubcategoryServiceDto } from './dto/create-subcategory-service.dto';
import { NotificationsService } from '../notifications/notifications.service';


@Injectable()
export class SubcategoryServicesService {

  constructor(
    @InjectRepository(SubcategoryService)
    private subServiceRepo: Repository<SubcategoryService>,

    @InjectRepository(SubcategoryServiceProposal)
    private proposalRepo: Repository<SubcategoryServiceProposal>,

    @InjectRepository(SubcategoryServiceDismissal)
    private dismissalRepo: Repository<SubcategoryServiceDismissal>,

    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,

    @InjectRepository(ProviderCatalog)
    private providerCatalogRepo: Repository<ProviderCatalog>,

    private dataSource: DataSource,

    private notificationsService: NotificationsService,
  ) {}


  // ── Cliente cria Serviço Rápido ────────────────────────────────────────

  async create(
    clientId: string,
    dto: CreateSubcategoryServiceDto,
  ): Promise<SubcategoryService> {

    const entry = this.subServiceRepo.create({
      ...dto,
      clientId,
      status: SubcategoryServiceStatus.BROADCASTING,
    });


    return this.subServiceRepo.save(entry);
  }



  // ── Mercado do Prestador ───────────────────────────────────────────────
  //
  // Agora usa ProviderCatalog em vez de User.category.
  //
  // Permite:
  //
  // Prestador:
  //  - Eletricidade
  //  - Canalização
  //
  // receber pedidos dessas categorias.


  async findAvailableForProvider(
    providerId: string,
  ): Promise<SubcategoryService[]> {


    const providerCatalog =
      await this.providerCatalogRepo.find({
        where: {
          providerId,
          isActive: true,
        },
      });


    const categories =
      providerCatalog.map(
        item => item.category,
      );


    if (!categories.length) {
      return [];
    }



    const dismissedIds =
      await this.dismissalRepo.find({
        where: {
          providerId,
        },
        select: {
          subcategoryServiceId: true,
        },
      });



    const dismissedSet =
      new Set(
        dismissedIds.map(
          item => item.subcategoryServiceId,
        ),
      );



    const services =
      await this.subServiceRepo
        .createQueryBuilder('s')

        .leftJoinAndSelect(
          's.client',
          'client',
        )

        .leftJoinAndSelect(
          's.proposals',
          'proposals',
        )

        .where(
          's.status IN (:...statuses)',
          {
            statuses: [
              SubcategoryServiceStatus.BROADCASTING,
              SubcategoryServiceStatus.CLIENT_REVIEWING,
            ],
          },
        )

        .andWhere(
          's.category IN (:...categories)',
          {
            categories,
          },
        )

        .orderBy(
          's.createdAt',
          'DESC',
        )

        .getMany();



    return services.filter(
      service =>
        !dismissedSet.has(service.id),
    );
  }




  // ── Serviços do cliente ───────────────────────────────────────────────

  async findByClient(
    clientId: string,
  ): Promise<SubcategoryService[]> {

    return this.subServiceRepo.find({
      where: {
        clientId,
      },

      relations: {
        proposals: {
          provider: true,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }



  async findById(
    id: string,
  ): Promise<SubcategoryService> {


    const entry =
      await this.subServiceRepo.findOne({

        where: {
          id,
        },

        relations: {
          client: true,

          proposals: {
            provider: true,
          },
        },

      });


    if (!entry) {
      throw new NotFoundException(
        'Pedido rápido não encontrado.',
      );
    }


    return entry;
  }   // ── Prestador propõe valor ──────────────────────────────────────────────

  async proposePrice(
    subcategoryServiceId: string,
    providerId: string,
    proposedPrice: number,
  ): Promise<SubcategoryServiceProposal> {


    const entry =
      await this.findById(subcategoryServiceId);



    if (
      ![
        SubcategoryServiceStatus.BROADCASTING,
        SubcategoryServiceStatus.CLIENT_REVIEWING,
      ].includes(entry.status)
    ) {
      throw new BadRequestException(
        'Este pedido já não aceita novas propostas.',
      );
    }



    const existing =
      await this.proposalRepo.findOne({
        where: {
          subcategoryServiceId,
          providerId,
        },
      });



    let proposal: SubcategoryServiceProposal;



    if (existing) {


      existing.proposedPrice = proposedPrice;


      proposal =
        await this.proposalRepo.save(existing);



    } else {


      try {


        const created =
          this.proposalRepo.create({
            subcategoryServiceId,
            providerId,
            proposedPrice,
          });



        proposal =
          await this.proposalRepo.save(created);



      } catch (err: any) {


        if (err?.code === '23505') {


          const raceWinner =
            await this.proposalRepo.findOneOrFail({
              where: {
                subcategoryServiceId,
                providerId,
              },
            });



          raceWinner.proposedPrice =
            proposedPrice;



          proposal =
            await this.proposalRepo.save(
              raceWinner,
            );



        } else {


          throw err;


        }
      }
    }



    if (
      entry.status === SubcategoryServiceStatus.BROADCASTING
    ) {


      entry.status =
        SubcategoryServiceStatus.CLIENT_REVIEWING;


      await this.subServiceRepo.save(entry);

    }



    await this.notificationsService
      .notifyServiceProposed(
        entry.clientId,
        'Prestador',
        proposedPrice,
      )
      .catch(() => {});



    return proposal;
  }




  // ── Prestador recusa ───────────────────────────────────────────────────

  async dismissForProvider(
    subcategoryServiceId: string,
    providerId: string,
  ): Promise<void> {


    await this.findById(
      subcategoryServiceId,
    );



    const existing =
      await this.dismissalRepo.findOne({
        where: {
          subcategoryServiceId,
          providerId,
        },
      });



    if (existing) return;



    const dismissal =
      this.dismissalRepo.create({
        subcategoryServiceId,
        providerId,
      });



    await this.dismissalRepo
      .save(dismissal)
      .catch((err: any) => {

        if (err?.code !== '23505') {
          throw err;
        }

      });
  }




  // ── Cliente aceita proposta ────────────────────────────────────────────

  async acceptProposal(
    subcategoryServiceId: string,
    clientId: string,
    proposalId: string,
  ): Promise<Service> {


    const queryRunner =
      this.dataSource.createQueryRunner();


    await queryRunner.connect();

    await queryRunner.startTransaction();



    try {


      const entry =
        await queryRunner.manager.findOne(
          SubcategoryService,
          {
            where: {
              id: subcategoryServiceId,
            },

            lock: {
              mode: 'pessimistic_write',
            },
          },
        );



      if (!entry) {
        throw new NotFoundException(
          'Pedido rápido não encontrado.',
        );
      }



      if (entry.clientId !== clientId) {
        throw new ForbiddenException(
          'Sem permissão.',
        );
      }



      if (
        entry.status !==
        SubcategoryServiceStatus.CLIENT_REVIEWING
      ) {
        throw new BadRequestException(
          'Este pedido não tem uma proposta pendente para aceitar.',
        );
      }



      const proposal =
        await queryRunner.manager.findOne(
          SubcategoryServiceProposal,
          {
            where: {
              id: proposalId,
              subcategoryServiceId,
            },
          },
        );



      if (!proposal) {
        throw new NotFoundException(
          'Proposta não encontrada.',
        );
      }




      const service =
        queryRunner.manager.create(
          Service,
          {

            title:
              `Serviço Rápido — ${entry.subcategory}`,

            description:
              `Pedido de ${entry.subcategory} (${entry.category}) via Serviços Rápidos.`,

            category:
              entry.category,

            address:
              entry.address,

            budget:
              proposal.proposedPrice,

            agreedPrice:
              proposal.proposedPrice,

            status:
              ServiceStatus.ACCEPTED,

            clientId:
              entry.clientId,

            providerId:
              proposal.providerId,

            acceptedAt:
              new Date(),
          },
        );



      const savedService =
        await queryRunner.manager.save(
          service,
        );



      entry.status =
        SubcategoryServiceStatus.CONVERTED;



      entry.convertedServiceId =
        savedService.id;



      await queryRunner.manager.save(
        entry,
      );



      await queryRunner.commitTransaction();



      await this.notificationsService
        .notifyProposalAccepted(
          proposal.providerId,
          Number(proposal.proposedPrice),
        )
        .catch(() => {});



      return savedService;



    } catch (err) {


      await queryRunner.rollbackTransaction();

      throw err;



    } finally {


      await queryRunner.release();


    }
  }





  // ── Cliente rejeita pedido ─────────────────────────────────────────────

  async rejectAndCancel(
    subcategoryServiceId: string,
    clientId: string,
  ): Promise<void> {


    const entry =
      await this.findById(
        subcategoryServiceId,
      );



    if (entry.clientId !== clientId) {

      throw new ForbiddenException(
        'Sem permissão.',
      );

    }



    if (
      entry.status ===
      SubcategoryServiceStatus.CONVERTED
    ) {

      throw new BadRequestException(
        'Este pedido já foi aceite e não pode ser cancelado por esta via.',
      );

    }



    const proposalProviderIds =
      (entry.proposals ?? [])
        .map(
          proposal =>
            proposal.providerId,
        );



    await this.subServiceRepo.delete({
      id: subcategoryServiceId,
    });



    await Promise.all(

      proposalProviderIds.map(
        providerId =>
          this.notificationsService
            .notifyProposalRejected(providerId)
            .catch(() => {}),
      ),

    );
  }
}