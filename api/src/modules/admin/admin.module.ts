import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../database/entities/user.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { Service } from '../../database/entities/service.entity';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ProviderVerification, Service]),
    CompaniesModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}