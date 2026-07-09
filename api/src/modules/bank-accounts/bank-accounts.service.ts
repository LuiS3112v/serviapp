import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformBankAccount } from '../../database/entities/platform-bank-account.entity';
import { ProviderBankAccount } from '../../database/entities/provider-bank-account.entity';
import { UpsertPlatformBankAccountDto } from './dto/upsert-platform-bank-account.dto';
import { UpsertProviderBankAccountDto } from './dto/upsert-provider-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(PlatformBankAccount)
    private platformRepo: Repository<PlatformBankAccount>,
    @InjectRepository(ProviderBankAccount)
    private providerRepo: Repository<ProviderBankAccount>,
  ) {}

  // ══════════════════════════════════════════════════════════════════════
  // CONTA DA PLATAFORMA — pública (banco/titular/IBAN são para mostrar ao
  // cliente, não são dados sensíveis do ponto de vista do produto).
  // ══════════════════════════════════════════════════════════════════════

  // Devolve a conta activa marcada como default. Como confirmado, existe
  // sempre uma única conta por agora — mas a query já está pronta para
  // quando houver mais do que uma.
  async getDefaultPlatformAccount(): Promise<PlatformBankAccount> {
    const account = await this.platformRepo.findOne({
      where: { isActive: true, isDefault: true },
    });
    if (!account) {
      throw new NotFoundException(
        'Nenhuma conta bancária da plataforma configurada. Contacta o suporte.',
      );
    }
    return account;
  }

  async listPlatformAccounts(): Promise<PlatformBankAccount[]> {
    return this.platformRepo.find({ order: { createdAt: 'ASC' } });
  }

  async createPlatformAccount(dto: UpsertPlatformBankAccountDto): Promise<PlatformBankAccount> {
    // Se esta nova conta for marcada como default, desmarca as outras
    if (dto.isDefault) {
      await this.platformRepo.update({ isDefault: true }, { isDefault: false });
    }
    const account = this.platformRepo.create({
      ...dto,
      isDefault: dto.isDefault ?? false,
      isActive: true,
    });
    return this.platformRepo.save(account);
  }

  async updatePlatformAccount(
    id: string,
    dto: Partial<UpsertPlatformBankAccountDto>,
  ): Promise<PlatformBankAccount> {
    const account = await this.platformRepo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Conta não encontrada.');

    if (dto.isDefault) {
      await this.platformRepo.update({ isDefault: true }, { isDefault: false });
    }

    Object.assign(account, dto);
    return this.platformRepo.save(account);
  }

  // ══════════════════════════════════════════════════════════════════════
  // CONTA DO PRESTADOR — privada. Só o próprio prestador (para editar) e
  // o admin (para saber para onde transferir) podem aceder.
  // ══════════════════════════════════════════════════════════════════════

  async getMyProviderAccount(userId: string): Promise<ProviderBankAccount | null> {
    return this.providerRepo.findOne({ where: { userId } });
  }

  async upsertMyProviderAccount(
    userId: string,
    dto: UpsertProviderBankAccountDto,
  ): Promise<ProviderBankAccount> {
    let account = await this.providerRepo.findOne({ where: { userId } });
    if (account) {
      Object.assign(account, dto);
    } else {
      account = this.providerRepo.create({ userId, ...dto });
    }
    return this.providerRepo.save(account);
  }

  // Só para uso interno do AdminPaymentsService — nunca exposto
  // directamente a um endpoint que o cliente possa chamar.
  async getProviderAccountForAdmin(providerId: string): Promise<ProviderBankAccount | null> {
    return this.providerRepo.findOne({
      where: { userId: providerId },
      relations: { user: true },
    });
  }
}