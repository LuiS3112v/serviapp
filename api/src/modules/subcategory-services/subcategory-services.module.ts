import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubcategoryServicesController } from './subcategory-services.controller';
import { SubcategoryServicesService } from './subcategory-services.service';

import { SubcategoryService } from '../../database/entities/subcategory-service.entity';
import { SubcategoryServiceProposal } from '../../database/entities/subcategory-service-proposal.entity';
import { SubcategoryServiceDismissal } from '../../database/entities/subcategory-service-dismissal.entity';
import { Service } from '../../database/entities/service.entity';
import { ProviderCatalog } from '../../database/entities/provider-catalog.entity';
import { User } from '../../database/entities/user.entity';

import { NotificationsModule } from '../notifications/notifications.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubcategoryService,
      SubcategoryServiceProposal,
      SubcategoryServiceDismissal,
      Service,
      ProviderCatalog,
      User,
    ]),

    NotificationsModule,
  ],

  controllers: [
    SubcategoryServicesController,
  ],

  providers: [
    SubcategoryServicesService,
  ],

  exports: [
    SubcategoryServicesService,
  ],
})
export class SubcategoryServicesModule {}