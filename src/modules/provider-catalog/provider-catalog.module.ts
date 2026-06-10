import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderCatalogController } from './provider-catalog.controller';
import { ProviderCatalogService } from './provider-catalog.service';
import { ProviderCatalog } from '../../database/entities/provider-catalog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderCatalog])],
  controllers: [ProviderCatalogController],
  providers: [ProviderCatalogService],
  exports: [ProviderCatalogService],
})
export class ProviderCatalogModule {}