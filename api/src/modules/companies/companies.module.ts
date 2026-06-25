import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { CompanyKycController } from './company-kyc.controller';
import { CompanyKycService } from './company-kyc.service';
import { CompanyRolesGuard } from '../../common/guards/company-roles.guard';

import { Company } from '../../database/entities/company.entity';
import { CompanyVerification } from '../../database/entities/company-verification.entity';
import { CompanyEmployee } from '../../database/entities/company-employee.entity';
import { CompanyInvitation } from '../../database/entities/company-invitation.entity';
import { CompanyService as CompanyServiceEntity } from '../../database/entities/company-service.entity';
import { CompanyPortfolioItem } from '../../database/entities/company-portfolio-item.entity';
import { CompanyGalleryImage } from '../../database/entities/company-gallery-image.entity';
import { CompanyCertification } from '../../database/entities/company-certification.entity';
import { User } from '../../database/entities/user.entity';
import { Service } from '../../database/entities/service.entity';

import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyVerification,
      CompanyEmployee,
      CompanyInvitation,
      CompanyServiceEntity,
      CompanyPortfolioItem,
      CompanyGalleryImage,
      CompanyCertification,
      User,
      Service,
    ]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [CompaniesController, CompanyKycController],
  providers: [CompaniesService, CompanyKycService, CompanyRolesGuard],
  // Exporta CompanyKycService para o AdminModule poder injectá-lo
  // (ver PATCH-admin.service.txt)
  exports: [CompaniesService, CompanyKycService],
})
export class CompaniesModule {}