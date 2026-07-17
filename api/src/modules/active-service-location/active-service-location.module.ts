import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ActiveServiceLocationController } from './active-service-location.controller';
import { ActiveServiceLocationService } from './active-service-location.service';
import { ActiveServiceLocationGateway } from './active-service-location.gateway';
import { Service } from '../../database/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service]),
    JwtModule.register({}),
  ],
  controllers: [ActiveServiceLocationController],
  providers: [ActiveServiceLocationService, ActiveServiceLocationGateway],
  exports: [ActiveServiceLocationService],
})
export class ActiveServiceLocationModule {}