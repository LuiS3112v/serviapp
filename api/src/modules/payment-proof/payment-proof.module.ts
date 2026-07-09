import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentProofController } from './payment-proof.controller';
import { PaymentProofService } from './payment-proof.service';
import { PaymentProof } from '../../database/entities/payment-proof.entity';
import { Payment } from '../../database/entities/payment.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentProof, Payment]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [PaymentProofController],
  providers: [PaymentProofService],
  exports: [PaymentProofService],
})
export class PaymentProofModule {}