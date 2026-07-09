import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettings } from '../../database/entities/platform-settings.entity';

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectRepository(PlatformSettings)
    private settingsRepo: Repository<PlatformSettings>,
  ) {}

  // Tabela singleton — garante que existe sempre exactamente uma linha.
  // Se ainda não existir nenhuma (primeira vez que a app corre), cria
  // com o valor por defeito de 10%.
  private async getOrCreate(): Promise<PlatformSettings> {
    let settings = await this.settingsRepo.findOne({ where: {} });
    if (!settings) {
      settings = await this.settingsRepo.save(
        this.settingsRepo.create({ commissionPercentage: 10 }),
      );
    }
    return settings;
  }

  async getCommissionPercentage(): Promise<number> {
    const settings = await this.getOrCreate();
    return Number(settings.commissionPercentage);
  }

  async getSettings(): Promise<PlatformSettings> {
    return this.getOrCreate();
  }

  async updateCommissionPercentage(percentage: number): Promise<PlatformSettings> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('A comissão tem de estar entre 0 e 100.');
    }
    const settings = await this.getOrCreate();
    settings.commissionPercentage = percentage;
    return this.settingsRepo.save(settings);
  }
}