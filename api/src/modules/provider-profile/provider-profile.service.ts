import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Service } from '../../database/entities/service.entity';
import { ProviderGalleryImage } from '../../database/entities/provider-gallery-image.entity';
import { ProviderPricedService } from '../../database/entities/provider-priced-service.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { Role } from '../../common/enums/role.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePricedServiceDto } from './dto/create-priced-service.dto';
import { UpdatePricedServiceDto } from './dto/update-priced-service.dto';
import { UpdateBioDto } from './dto/update-bio.dto';

@Injectable()
export class ProviderProfileService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(ProviderGalleryImage)
    private galleryRepo: Repository<ProviderGalleryImage>,
    @InjectRepository(ProviderPricedService)
    private pricedServiceRepo: Repository<ProviderPricedService>,
    private cloudinaryService: CloudinaryService,
  ) {}

  private async getProviderOrFail(providerId: string): Promise<User> {
    const provider = await this.userRepo.findOne({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Prestador não encontrado.');
    if (provider.role !== Role.PROVIDER && provider.role !== Role.COMPANY) {
      throw new NotFoundException('Prestador não encontrado.');
    }
    return provider;
  }

  // ══════════════════════════════════════════════════════════════════════
  // Avaliações — MESMA fonte de dados e MESMA lógica que
  // ServicesService.getProviderReviews (que vi completo numa resposta
  // anterior desta conversa): filtra Service por providerId+COMPLETED,
  // mapeia os que têm clientRating preenchido. Reimplementado aqui via
  // @InjectRepository(Service) directo — o mesmo padrão que
  // CompaniesService já usa para agregações sobre Service — em vez de
  // depender de um export de ServicesModule que não confirmei existir.
  // Não é um sistema de avaliações novo: é a mesma tabela, as mesmas
  // colunas (clientRating/clientReview), a mesma regra de negócio.
  // ══════════════════════════════════════════════════════════════════════
  private async getProviderReviews(providerId: string) {
    const completed = await this.serviceRepo.find({
      where: { providerId, status: ServiceStatus.COMPLETED },
      relations: { client: true },
      order: { completedAt: 'DESC' },
    });

    const reviews = completed
      .filter(s => s.clientRating != null)
      .map(s => ({
        id: s.id,
        title: s.title,
        clientName: s.client?.fullName ?? '—',
        rating: Number(s.clientRating),
        review: s.clientReview ?? null,
        completedAt: s.completedAt!.toISOString(),
      }));

    const total = reviews.length;
    const average = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : null;

    const distribution: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach(r => {
      const key = String(Math.round(r.rating));
      if (distribution[key] !== undefined) distribution[key]++;
    });

    return { reviews, stats: { total, average, distribution } };
  }

  // ══════════════════════════════════════════════════════════════════════
  // PERFIL PÚBLICO — agrega apenas o subconjunto seguro de User (nunca
  // email, phone, latitude/longitude), a galeria, os serviços com preço,
  // e as avaliações. Mesma disciplina de exposição que
  // Company.findByIdPublic já aplica.
  // ══════════════════════════════════════════════════════════════════════
  async getPublicProfile(providerId: string) {
    const provider = await this.getProviderOrFail(providerId);

    const [gallery, galleryTotal, services, reviewsData, completedCount] = await Promise.all([
      this.galleryRepo.find({
        where: { providerId },
        order: { createdAt: 'DESC' },
        take: 24, // lazy-load inicial; "Ver mais" pede além disto via offset
      }),
      this.galleryRepo.count({ where: { providerId } }),
      this.pricedServiceRepo.find({
        where: { providerId },
        order: { createdAt: 'ASC' },
      }),
      this.getProviderReviews(providerId),
      this.serviceRepo.count({ where: { providerId, status: ServiceStatus.COMPLETED } }),
    ]);

    return {
      id: provider.id,
      fullName: provider.fullName,
      avatarUrl: provider.avatarUrl ?? null,
      category: provider.category ?? null,
      bio: provider.bio ?? null,
      isVerified: provider.isVerified,
      memberSince: provider.createdAt,
      completedServicesCount: completedCount,
      gallery: gallery.map(g => ({ id: g.id, url: g.url, caption: g.caption ?? null })),
      galleryTotal,
      services: services.map(s => ({ id: s.id, name: s.name, price: Number(s.price) })),
      reviews: reviewsData.reviews,
      reviewStats: reviewsData.stats,
    };
  }

  async getMoreGallery(providerId: string, offset: number): Promise<{ id: string; url: string; caption: string | null }[]> {
    const images = await this.galleryRepo.find({
      where: { providerId },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: 24,
    });
    return images.map(g => ({ id: g.id, url: g.url, caption: g.caption ?? null }));
  }

  // ══════════════════════════════════════════════════════════════════════
  // BIO — reutiliza User.bio directamente, sem entity nova.
  // ══════════════════════════════════════════════════════════════════════
  async updateBio(providerId: string, dto: UpdateBioDto): Promise<{ bio: string }> {
    const provider = await this.getProviderOrFail(providerId);
    provider.bio = dto.bio;
    const saved = await this.userRepo.save(provider);
    return { bio: saved.bio };
  }

  // ══════════════════════════════════════════════════════════════════════
  // GALERIA (privada)
  // ══════════════════════════════════════════════════════════════════════
  async getMyGallery(providerId: string): Promise<ProviderGalleryImage[]> {
    return this.galleryRepo.find({ where: { providerId }, order: { createdAt: 'DESC' } });
  }

  async addGalleryImage(
    providerId: string,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<ProviderGalleryImage> {
    const result = await this.cloudinaryService.uploadBuffer(
      file.buffer, 'provider-gallery', `${providerId}_${Date.now()}`,
    );
    const image = this.galleryRepo.create({
      providerId, url: result.url, publicId: result.publicId, caption,
    });
    return this.galleryRepo.save(image);
  }

  async removeGalleryImage(providerId: string, imageId: string): Promise<{ deleted: boolean }> {
    const image = await this.galleryRepo.findOne({ where: { id: imageId, providerId } });
    if (!image) throw new NotFoundException('Imagem não encontrada.');
    await this.cloudinaryService.deleteFile(image.publicId).catch(() => {});
    await this.galleryRepo.delete({ id: imageId });
    return { deleted: true };
  }

  // ══════════════════════════════════════════════════════════════════════
  // SERVIÇOS E PREÇOS (privado)
  // ══════════════════════════════════════════════════════════════════════
  async getMyPricedServices(providerId: string): Promise<ProviderPricedService[]> {
    return this.pricedServiceRepo.find({ where: { providerId }, order: { createdAt: 'ASC' } });
  }

  async addPricedService(providerId: string, dto: CreatePricedServiceDto): Promise<ProviderPricedService> {
    const entry = this.pricedServiceRepo.create({ providerId, name: dto.name.trim(), price: dto.price });
    return this.pricedServiceRepo.save(entry);
  }

  async updatePricedService(
    providerId: string, serviceId: string, dto: UpdatePricedServiceDto,
  ): Promise<ProviderPricedService> {
    const entry = await this.pricedServiceRepo.findOne({ where: { id: serviceId, providerId } });
    if (!entry) throw new NotFoundException('Serviço não encontrado.');
    if (entry.providerId !== providerId) throw new ForbiddenException('Sem permissão.');
    if (dto.name !== undefined) entry.name = dto.name.trim();
    if (dto.price !== undefined) entry.price = dto.price;
    return this.pricedServiceRepo.save(entry);
  }

  async removePricedService(providerId: string, serviceId: string): Promise<{ deleted: boolean }> {
    const result = await this.pricedServiceRepo.delete({ id: serviceId, providerId });
    if (result.affected === 0) throw new NotFoundException('Serviço não encontrado.');
    return { deleted: true };
  }
}