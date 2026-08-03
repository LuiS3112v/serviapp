import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderProfileController } from './provider-profile.controller';
import { ProviderProfileService } from './provider-profile.service';
import { User } from '../../database/entities/user.entity';
import { Service } from '../../database/entities/service.entity';
import { ProviderGalleryImage } from '../../database/entities/provider-gallery-image.entity';
import { ProviderPricedService } from '../../database/entities/provider-priced-service.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    // Importa Service directamente para agregação de reviews, seguindo
    // o mesmo padrão que CompaniesModule já usa para as suas próprias
    // agregações sobre Service — não depende de nenhum export de
    // ServicesModule que não foi confirmado.
    TypeOrmModule.forFeature([User, Service, ProviderGalleryImage, ProviderPricedService]),
    CloudinaryModule,
  ],
  controllers: [ProviderProfileController],
  providers: [ProviderProfileService],
})
export class ProviderProfileModule {}