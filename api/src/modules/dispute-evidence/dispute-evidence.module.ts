import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisputeEvidenceController, DisputeEvidenceFileController } from './dispute-evidence.controller';
import { DisputeEvidenceService } from './dispute-evidence.service';
import { DisputeEvidence } from '../../database/entities/dispute-evidence.entity';
import { Service } from '../../database/entities/service.entity';

// CloudinaryModule é @Global() — não precisa de ser importado aqui.
// O CloudinaryService é injectado automaticamente em qualquer provider.
@Module({
  imports: [
    TypeOrmModule.forFeature([DisputeEvidence, Service]),
  ],
  controllers: [DisputeEvidenceController, DisputeEvidenceFileController],
  providers: [DisputeEvidenceService],
  exports: [DisputeEvidenceService],
})
export class DisputeEvidenceModule {}