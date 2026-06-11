import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { User } from '../../database/entities/user.entity';
// FIX #5: KycService injeta CloudinaryService e NotificationsService mas o
// módulo não os importava → DI error em runtime.
// Se estes módulos já usam @Global(), as linhas abaixo são redundantes
// mas inofensivas e tornam a dependência explícita (boa prática).
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProviderVerification, User]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}