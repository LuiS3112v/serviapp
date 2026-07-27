import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { User } from '../../database/entities/user.entity';
import { UserSession } from '../../database/entities/user-session.entity';
import { SecurityLog } from '../../database/entities/security-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSession, SecurityLog])],
  controllers: [SecurityController],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}