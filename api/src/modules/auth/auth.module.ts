import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { User } from '../../database/entities/user.entity';
import { UserSession } from '../../database/entities/user-session.entity';
import { SecurityLog } from '../../database/entities/security-log.entity';
import { ProviderVerification } from '../../database/entities/provider-verification.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // NOVO: ProviderVerification foi adicionado só para o AuthService
    // conseguir devolver o kycStatus no fluxo Google — não introduz
    // nenhuma escrita nova nesta tabela, apenas leitura.
    TypeOrmModule.forFeature([User, UserSession, SecurityLog, ProviderVerification]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleAuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}