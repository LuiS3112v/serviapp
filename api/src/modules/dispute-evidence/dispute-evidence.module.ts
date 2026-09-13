import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputeEvidenceController } from './dispute-evidence.controller';
import { DisputeEvidenceService } from './dispute-evidence.service';
import { DisputeEvidence } from '../../database/entities/dispute-evidence.entity';
import { Service } from '../../database/entities/service.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DisputeEvidence, Service]),
    CloudinaryModule,
  ],
  controllers: [DisputeEvidenceController],
  providers: [DisputeEvidenceService],
  exports: [DisputeEvidenceService],
})
export class DisputeEvidenceModule {}