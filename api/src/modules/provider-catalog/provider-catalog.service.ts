import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderCatalog } from '../../database/entities/provider-catalog.entity';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@Injectable()
export class ProviderCatalogService {
  constructor(
    @InjectRepository(ProviderCatalog)
    private catalogRepo: Repository<ProviderCatalog>,
  ) {}

  async create(providerId: string, dto: CreateCatalogDto): Promise<ProviderCatalog> {
    const entry = this.catalogRepo.create({
      providerId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category,
      address: dto.address?.trim(),
      pricePerHour: dto.pricePerHour ? Number(dto.pricePerHour) : undefined,
    });
    return this.catalogRepo.save(entry);
  }

  async findByProvider(providerId: string): Promise<ProviderCatalog[]> {
    return this.catalogRepo.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // findAll — devolve APENAS serviços individuais de providers ACTIVOS.
  // Este isActive é exactamente o mecanismo que faz um serviço
  // "desaparecer" da pesquisa — ver deactivateByServiceId abaixo, chamado
  // quando o ciclo completo de um serviço termina.
  // ═══════════════════════════════════════════════════════════════════
  async findAll(category?: string): Promise<ProviderCatalog[]> {
    const qb = this.catalogRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.provider', 'provider')
      .where('c.isActive = :active', { active: true })
      .andWhere('provider.isVerified = :verified', { verified: true });

    if (category) qb.andWhere('c.category = :category', { category });

    return qb.orderBy('c.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<ProviderCatalog> {
    const entry = await this.catalogRepo.findOne({
      where: { id },
      relations: { provider: true },
    });
    if (!entry) throw new NotFoundException('Serviço não encontrado.');
    return entry;
  }

  async update(id: string, providerId: string, dto: UpdateCatalogDto): Promise<ProviderCatalog> {
    const entry = await this.catalogRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Serviço não encontrado.');
    if (entry.providerId !== providerId) throw new ForbiddenException('Sem permissão.');
    Object.assign(entry, dto);
    return this.catalogRepo.save(entry);
  }

  async remove(id: string, providerId: string): Promise<void> {
    const entry = await this.catalogRepo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Serviço não encontrado.');
    if (entry.providerId !== providerId) throw new ForbiddenException('Sem permissão.');
    await this.catalogRepo.delete(id);
  }

  // ═══════════════════════════════════════════════════════════════════
  // Desactiva a entrada de catálogo ligada a um serviço, quando o ciclo
  // completo termina: prestador concluiu → cliente confirmou → admin
  // transferiu o dinheiro real ao prestador. É neste momento exacto —
  // e só neste — que o serviço deixa de aparecer na pesquisa para
  // novos clientes, cumprindo a regra: "postado → concluído e pago →
  // desaparece" (estilo 4chan, como pediste).
  //
  // Não apaga o registo — só isActive:false — para o prestador poder
  // reactivar manualmente se quiser voltar a oferecer o mesmo serviço.
  //
  // Se o serviço não veio de uma entrada de catálogo (catalogItemId é
  // null — ex: pedido directo, fluxo antigo), este método não faz nada,
  // em silêncio, sem lançar erro.
  // ═══════════════════════════════════════════════════════════════════
  async deactivateByServiceId(catalogItemId: string | null): Promise<void> {
    if (!catalogItemId) return;
    await this.catalogRepo.update({ id: catalogItemId }, { isActive: false });
  }
}