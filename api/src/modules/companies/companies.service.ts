import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../database/entities/company.entity';
import { CompanyEmployee } from '../../database/entities/company-employee.entity';
import { CompanyInvitation } from '../../database/entities/company-invitation.entity';
import { CompanyService as CompanyServiceEntity } from '../../database/entities/company-service.entity';
import { CompanyPortfolioItem } from '../../database/entities/company-portfolio-item.entity';
import { CompanyGalleryImage } from '../../database/entities/company-gallery-image.entity';
import { CompanyCertification } from '../../database/entities/company-certification.entity';
import { User } from '../../database/entities/user.entity';
import { Service } from '../../database/entities/service.entity';
import { ServiceStatus } from '../../common/enums/service-status.enum';
import { CompanyInvitationStatus } from '../../common/enums/company-invitation-status.enum';
import { CompanyEmployeeStatus } from '../../common/enums/company-employee-status.enum';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';
import { Role } from '../../common/enums/role.enum';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateAboutDto } from './dto/update-about.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateCoverageDto } from './dto/update-coverage.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { CreateCompanyServiceDto } from './dto/create-company-service.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';

import { NotificationsService } from '../notifications/notifications.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(CompanyEmployee)
    private employeeRepo: Repository<CompanyEmployee>,
    @InjectRepository(CompanyInvitation)
    private invitationRepo: Repository<CompanyInvitation>,
    @InjectRepository(CompanyServiceEntity)
    private companyServiceRepo: Repository<CompanyServiceEntity>,
    @InjectRepository(CompanyPortfolioItem)
    private portfolioRepo: Repository<CompanyPortfolioItem>,
    @InjectRepository(CompanyGalleryImage)
    private galleryRepo: Repository<CompanyGalleryImage>,
    @InjectRepository(CompanyCertification)
    private certificationRepo: Repository<CompanyCertification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    private notificationsService: NotificationsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════
  // PERFIL DA EMPRESA
  // ══════════════════════════════════════════════════════════════════════

  async create(ownerId: string, dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.companyRepo.findOne({ where: { ownerId } });
    if (existing) throw new ConflictException('Já tens uma empresa registada.');

    const company = this.companyRepo.create({
      ownerId,
      ...dto,
      workingHours: null,
      coverageProvinces: dto.province ? [dto.province] : [],
      socialLinks: dto.website ? { website: dto.website } : {},
    });

    const saved = await this.companyRepo.save(company);

    const user = await this.userRepo.findOne({ where: { id: ownerId } });
    if (user && user.role !== Role.ADMIN) {
      await this.userRepo.update(ownerId, { role: Role.COMPANY });
    }

    return saved;
  }

  async findMine(ownerId: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { ownerId },
      relations: { services: true, verification: true },
    });
    if (!company) throw new NotFoundException('Ainda não criaste um perfil de empresa.');
    return company;
  }

  async findByIdPublic(id: string): Promise<Company> {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: { services: true },
    });
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    return company;
  }

  async update(companyId: string, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.getOrFail(companyId);
    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async updateAbout(companyId: string, dto: UpdateAboutDto): Promise<Company> {
    const company = await this.getOrFail(companyId);
    company.about = dto.about;
    return this.companyRepo.save(company);
  }

  async updateWorkingHours(companyId: string, dto: UpdateWorkingHoursDto): Promise<Company> {
    const company = await this.getOrFail(companyId);
    company.workingHours = dto.hours;
    return this.companyRepo.save(company);
  }

  async updateCoverage(companyId: string, dto: UpdateCoverageDto): Promise<Company> {
    const company = await this.getOrFail(companyId);
    company.coverageProvinces = dto.provinces;
    return this.companyRepo.save(company);
  }

  async updateSocialLinks(companyId: string, dto: UpdateSocialLinksDto): Promise<Company> {
    const company = await this.getOrFail(companyId);
    company.socialLinks = { ...(company.socialLinks ?? {}), ...dto };
    return this.companyRepo.save(company);
  }

  async uploadLogo(companyId: string, file: Express.Multer.File): Promise<Company> {
    const company = await this.getOrFail(companyId);
    const result = await this.cloudinaryService.uploadBuffer(
      file.buffer, 'company-logo', `${companyId}_logo_${Date.now()}`,
    );
    company.logoUrl = result.url;
    company.logoPublicId = result.publicId;
    return this.companyRepo.save(company);
  }

  async uploadBanner(companyId: string, file: Express.Multer.File): Promise<Company> {
    const company = await this.getOrFail(companyId);
    const result = await this.cloudinaryService.uploadBuffer(
      file.buffer, 'company-banner', `${companyId}_banner_${Date.now()}`,
    );
    company.bannerUrl = result.url;
    company.bannerPublicId = result.publicId;
    return this.companyRepo.save(company);
  }

  private async getOrFail(companyId: string): Promise<Company> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException('Empresa não encontrada.');
    return company;
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATS — calculados a partir de Service + CompanyEmployee
  //
  // FIX: A nova Service entity NÃO tem companyId nem clientRating.
  // Os serviços são ligados ao providerId do employee.
  // Buscamos serviços pelos userIds dos employees desta empresa.
  // ══════════════════════════════════════════════════════════════════════

  async getStats(companyId: string) {
    const company = await this.getOrFail(companyId);
    const now = new Date();

    // Conta funcionários
    const employeeCount = await this.employeeRepo.count({ where: { companyId } });

    // Busca IDs dos employees para ligar aos serviços deles
    const employees = await this.employeeRepo.find({
      where: { companyId },
      select: { userId: true },
    });
    const employeeUserIds = [company.ownerId, ...employees.map(e => e.userId)];

    // Busca todos os serviços onde o provider é o owner ou um employee
    let allServices: Service[] = [];
    if (employeeUserIds.length > 0) {
      allServices = await this.serviceRepo
        .createQueryBuilder('s')
        .where('s.providerId IN (:...ids)', { ids: employeeUserIds })
        .getMany();
    }

    const completedServices = allServices.filter(
      s => s.status === ServiceStatus.COMPLETED,
    );
    const activeServices = allServices.filter(s =>
      [ServiceStatus.ACCEPTED, ServiceStatus.IN_PROGRESS].includes(s.status as ServiceStatus),
    );

    const totalEarnings = completedServices.reduce(
      (sum, s) => sum + Number(s.agreedPrice ?? 0), 0,
    );

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = completedServices
      .filter(s => s.completedAt && new Date(s.completedAt) >= startOfMonth)
      .reduce((sum, s) => sum + Number(s.agreedPrice ?? 0), 0);

    // Sem clientRating na nova entity — rating virá do módulo de reviews (futuro)
    const averageRating = 0;

    const uniqueClientIds = new Set(allServices.map(s => s.clientId));
    const clientsServed = uniqueClientIds.size;

    const clientCompletionCounts = new Map<string, number>();
    completedServices.forEach(s => {
      clientCompletionCounts.set(s.clientId, (clientCompletionCounts.get(s.clientId) ?? 0) + 1);
    });
    const recurringClients = [...clientCompletionCounts.values()].filter(c => c >= 2).length;

    const completionRate = allServices.length > 0
      ? Math.round((completedServices.length / allServices.length) * 100)
      : 0;

    const yearsActive = Math.max(0, now.getFullYear() - company.foundedYear);

    const acceptedWithTimes = allServices.filter(s => s.acceptedAt && s.createdAt);
    const avgResponseTimeHours = acceptedWithTimes.length > 0
      ? Math.round(
          acceptedWithTimes.reduce((sum, s) => {
            const diffMs = new Date(s.acceptedAt!).getTime() - new Date(s.createdAt).getTime();
            return sum + diffMs / (1000 * 60 * 60);
          }, 0) / acceptedWithTimes.length,
        )
      : 0;

    return {
      employees: employeeCount,
      clientsServed,
      activeServices: activeServices.length,
      completedServices: completedServices.length,
      averageRating,
      totalEarnings,
      monthlyEarnings,
      yearsActive,
      avgResponseTimeHours,
      completionRate,
      recurringClients,
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // TIMELINE — calculada automaticamente
  // ══════════════════════════════════════════════════════════════════════

  async getTimeline(companyId: string) {
    const company = await this.getOrFail(companyId);
    const stats = await this.getStats(companyId);
    const firstEmployee = await this.employeeRepo.findOne({
      where: { companyId },
      order: { joinedAt: 'ASC' },
    });

    return [
      {
        id: 'created',
        label: 'Empresa criada',
        date: company.createdAt.toISOString().slice(0, 10),
        achieved: true,
      },
      {
        id: 'first-employee',
        label: 'Primeiros funcionários',
        date: firstEmployee ? firstEmployee.joinedAt.toISOString().slice(0, 10) : '',
        achieved: !!firstEmployee,
      },
      {
        id: '100-clients',
        label: '100 clientes atendidos',
        date: stats.clientsServed >= 100 ? now().toISOString().slice(0, 10) : '',
        achieved: stats.clientsServed >= 100,
      },
      {
        id: 'verified',
        label: 'Empresa verificada',
        date: company.verifiedAt ? new Date(company.verifiedAt).toISOString().slice(0, 10) : '',
        achieved: !!company.verifiedAt,
      },
    ];

    function now() { return new Date(); }
  }

  // ══════════════════════════════════════════════════════════════════════
  // SERVIÇOS OFERECIDOS (badges)
  // ══════════════════════════════════════════════════════════════════════

  async getServices(companyId: string) {
    return this.companyServiceRepo.find({ where: { companyId }, order: { createdAt: 'ASC' } });
  }

  async addService(companyId: string, dto: CreateCompanyServiceDto) {
    const service = this.companyServiceRepo.create({ companyId, ...dto });
    return this.companyServiceRepo.save(service);
  }

  async removeService(companyId: string, serviceId: string) {
    const result = await this.companyServiceRepo.delete({ id: serviceId, companyId });
    if (result.affected === 0) throw new NotFoundException('Serviço não encontrado.');
    return { deleted: true };
  }

  // ══════════════════════════════════════════════════════════════════════
  // EQUIPA
  // ══════════════════════════════════════════════════════════════════════

  async getTeam(companyId: string) {
    return this.employeeRepo.find({
      where: { companyId },
      relations: { user: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async removeEmployee(companyId: string, employeeId: string) {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException('Funcionário não encontrado.');
    if (employee.role === CompanyEmployeeRole.OWNER) {
      throw new BadRequestException('Não é possível remover o dono da empresa.');
    }
    await this.employeeRepo.delete({ id: employeeId });
    return { deleted: true };
  }

  async updateEmployeeRole(companyId: string, employeeId: string, role: CompanyEmployeeRole) {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId, companyId } });
    if (!employee) throw new NotFoundException('Funcionário não encontrado.');
    employee.role = role;
    return this.employeeRepo.save(employee);
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONVITES
  // ══════════════════════════════════════════════════════════════════════

  async getInvitations(companyId: string) {
    return this.invitationRepo.find({
      where: { companyId },
      relations: { invitee: true },
      order: { sentAt: 'DESC' },
    });
  }

  async sendInvitation(
    companyId: string,
    invitedByUserId: string,
    dto: CreateInvitationDto,
  ): Promise<CompanyInvitation> {
    const invitee = await this.userRepo.findOne({ where: { id: dto.inviteeUserId } });
    if (!invitee) throw new NotFoundException('Utilizador não encontrado.');

    if (invitee.role !== Role.PROVIDER && invitee.role !== Role.COMPANY) {
      throw new BadRequestException('Só utilizadores com conta de prestador podem ser convidados para empresas.');
    }

    const alreadyEmployee = await this.employeeRepo.findOne({
      where: { companyId, userId: dto.inviteeUserId },
    });
    if (alreadyEmployee) throw new ConflictException('Este utilizador já faz parte da equipa.');

    const existingPending = await this.invitationRepo.findOne({
      where: { companyId, inviteeUserId: dto.inviteeUserId, status: CompanyInvitationStatus.PENDING },
    });
    if (existingPending) throw new ConflictException('Já existe um convite pendente para este utilizador.');

    const invitation = this.invitationRepo.create({
      companyId,
      invitedByUserId,
      inviteeUserId: dto.inviteeUserId,
      proposedRole: dto.proposedRole,
      proposedDepartment: dto.proposedDepartment,
      status: CompanyInvitationStatus.PENDING,
    });

    const saved = await this.invitationRepo.save(invitation);

    const company = await this.getOrFail(companyId);

    // Usa o método com invitationId para os botões nas notificações funcionarem
    await this.notificationsService.notifyCompanyInvitationWithId(
      dto.inviteeUserId,
      company.name,
      saved.id,
    ).catch(() => {});

    return saved;
  }

  async respondInvitation(
    invitationId: string,
    userId: string,
    accept: boolean,
  ): Promise<CompanyInvitation> {
    const invitation = await this.invitationRepo.findOne({ where: { id: invitationId } });
    if (!invitation) throw new NotFoundException('Convite não encontrado.');
    if (invitation.inviteeUserId !== userId) {
      throw new BadRequestException('Este convite não é para ti.');
    }
    if (invitation.status !== CompanyInvitationStatus.PENDING) {
      throw new BadRequestException('Este convite já foi respondido.');
    }

    invitation.status = accept
      ? CompanyInvitationStatus.ACCEPTED
      : CompanyInvitationStatus.REJECTED;
    invitation.respondedAt = new Date();
    const saved = await this.invitationRepo.save(invitation);

    if (accept) {
      const employee = this.employeeRepo.create({
        companyId: invitation.companyId,
        userId: invitation.inviteeUserId,
        role: invitation.proposedRole,
        department: invitation.proposedDepartment,
        status: CompanyEmployeeStatus.OFFLINE,
      });
      await this.employeeRepo.save(employee);

      const company = await this.getOrFail(invitation.companyId);
      await this.notificationsService.notifyInvitationAccepted(
        company.ownerId,
        invitation.inviteeUserId,
      ).catch(() => {});
    }

    return saved;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PORTFÓLIO
  // ══════════════════════════════════════════════════════════════════════

  async getPortfolio(companyId: string) {
    return this.portfolioRepo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  async addPortfolioItem(companyId: string, dto: CreatePortfolioItemDto) {
    const item = this.portfolioRepo.create({ companyId, ...dto, photoUrls: [] });
    return this.portfolioRepo.save(item);
  }

  async addPortfolioPhotos(companyId: string, itemId: string, files: Express.Multer.File[]) {
    const item = await this.portfolioRepo.findOne({ where: { id: itemId, companyId } });
    if (!item) throw new NotFoundException('Projecto não encontrado.');

    const uploads = await Promise.all(
      files.map((f, i) =>
        this.cloudinaryService.uploadBuffer(
          f.buffer, 'company-portfolio', `${itemId}_${Date.now()}_${i}`,
        ),
      ),
    );

    item.photoUrls = [...item.photoUrls, ...uploads.map(u => u.url)];
    return this.portfolioRepo.save(item);
  }

  async removePortfolioItem(companyId: string, itemId: string) {
    const result = await this.portfolioRepo.delete({ id: itemId, companyId });
    if (result.affected === 0) throw new NotFoundException('Projecto não encontrado.');
    return { deleted: true };
  }

  // ══════════════════════════════════════════════════════════════════════
  // GALERIA
  // ══════════════════════════════════════════════════════════════════════

  async getGallery(companyId: string) {
    return this.galleryRepo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  async addGalleryImage(companyId: string, file: Express.Multer.File, caption?: string) {
    const result = await this.cloudinaryService.uploadBuffer(
      file.buffer, 'company-gallery', `${companyId}_${Date.now()}`,
    );
    const image = this.galleryRepo.create({
      companyId, url: result.url, publicId: result.publicId, caption,
    });
    return this.galleryRepo.save(image);
  }

  async removeGalleryImage(companyId: string, imageId: string) {
    const image = await this.galleryRepo.findOne({ where: { id: imageId, companyId } });
    if (!image) throw new NotFoundException('Imagem não encontrada.');
    await this.cloudinaryService.deleteFile(image.publicId).catch(() => {});
    await this.galleryRepo.delete({ id: imageId });
    return { deleted: true };
  }

  // ══════════════════════════════════════════════════════════════════════
  // CERTIFICAÇÕES
  // ══════════════════════════════════════════════════════════════════════

  async getCertifications(companyId: string) {
    return this.certificationRepo.find({ where: { companyId }, order: { createdAt: 'DESC' } });
  }

  async addCertification(companyId: string, dto: CreateCertificationDto) {
    const cert = this.certificationRepo.create({ companyId, ...dto });
    return this.certificationRepo.save(cert);
  }

  async removeCertification(companyId: string, certId: string) {
    const result = await this.certificationRepo.delete({ id: certId, companyId });
    if (result.affected === 0) throw new NotFoundException('Certificação não encontrada.');
    return { deleted: true };
  }
}